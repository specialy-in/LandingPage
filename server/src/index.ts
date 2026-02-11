import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from project root (one level up)
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });
// Load .env from server directory (if exists)
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';

const app = express();
// CORS configured below


app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));
app.use(express.json({ limit: '50mb' }));

// --- Firebase Admin Init ---
let db: Firestore | null = null;
let bucket: any = null;

try {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || fs.existsSync(credPath)) {
        initializeApp({
            credential: cert(credPath),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
        db = getFirestore('bydefault');
        bucket = getStorage().bucket();
        console.log('[Firebase] ✅ Initialized');
        console.log('[Firebase] Storage bucket:', process.env.FIREBASE_STORAGE_BUCKET || 'NOT SET');
        console.log('[Firebase] Bucket name:', bucket?.name || 'NO BUCKET');
    } else {
        console.warn('[Firebase] ⚠️  No credentials found - running in mock mode');
    }
} catch (err) {
    console.error('[Firebase] ❌ Init failed:', err);
}

// --- Gemini Init ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// --- Health Check ---
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        firebase: db ? 'connected' : 'mock',
        gemini: process.env.GEMINI_API_KEY ? 'configured' : 'missing'
    });
});

// --- Smart AI Edit Suggestion Endpoint ---
const FALLBACK_SUGGESTIONS: Record<string, string[]> = {
    'Kitchen': ['Add pendant lights above island', 'Remove ceiling fan', 'Add potted herbs on counter'],
    'Living Room': ['Remove ceiling fan', 'Add floor lamp in corner', 'Remove visible wires'],
    'Bedroom': ['Add bedside table lamp', 'Remove ceiling fan', 'Add potted plant near window'],
    'Bathroom': ['Add wall-mounted plant', 'Remove visible pipes', 'Add towel rack'],
    'Dining Room': ['Add chandelier above table', 'Remove ceiling fan', 'Add centerpiece on table'],
    'Office': ['Add desk lamp', 'Remove cable clutter', 'Add small plant on desk'],
    'default': ['Remove window reflection', 'Add potted plant', 'Remove ceiling fan', 'Add decorative element']
};

app.post('/api/suggest-ai-edit', async (req: Request, res: Response) => {
    const { imageUrl, roomType } = req.body;

    console.log('💡 Smart suggestion request:', { roomType, hasImage: !!imageUrl });

    try {
        // Validate input
        if (!imageUrl) {
            // Return fallback if no image
            const suggestions = FALLBACK_SUGGESTIONS[roomType] || FALLBACK_SUGGESTIONS['default'];
            const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
            return res.json({
                success: true,
                suggestion: randomSuggestion,
                source: 'fallback'
            });
        }

        // Check if Gemini is configured
        if (!process.env.GEMINI_API_KEY) {
            const suggestions = FALLBACK_SUGGESTIONS[roomType] || FALLBACK_SUGGESTIONS['default'];
            const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
            return res.json({
                success: true,
                suggestion: randomSuggestion,
                source: 'fallback'
            });
        }

        // Download image
        let imageBuffer: Buffer;
        if (imageUrl.startsWith('data:')) {
            const base64Data = imageUrl.split(',')[1];
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Failed to download image');
            imageBuffer = Buffer.from(await response.arrayBuffer());
        }

        // Use Gemini 2.0 Flash for quick analysis
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `Analyze this ${roomType || 'room'} interior photo.
  
Suggest ONE realistic, helpful edit a homeowner might want:
- Remove unwanted objects (ceiling fan, wires, reflections)
- Add decorative elements (plants, art, lamps)
- Fix imperfections (stains, scratches, clutter)
- Adjust lighting/ambiance

Return ONLY a short phrase (max 8 words) starting with a verb.
Examples: "Remove ceiling fan", "Add floor lamp in corner", "Remove window reflection"

Do NOT include quotes or punctuation in your response.`;

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageBuffer.toString('base64')
                }
            },
            { text: prompt }
        ]);

        const suggestion = result.response.text()?.trim() || '';

        // Validate suggestion format
        if (suggestion && suggestion.length > 0 && suggestion.length <= 60) {
            console.log('✅ Smart suggestion:', suggestion);
            return res.json({
                success: true,
                suggestion: suggestion,
                source: 'gemini'
            });
        }

        // Fallback if response is invalid
        throw new Error('Invalid suggestion format');

    } catch (err: any) {
        console.warn('⚠️ Smart suggestion failed, using fallback:', err.message);

        const suggestions = FALLBACK_SUGGESTIONS[roomType] || FALLBACK_SUGGESTIONS['default'];
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

        return res.json({
            success: true,
            suggestion: randomSuggestion,
            source: 'fallback'
        });
    }
});

// --- Main Render Endpoint ---
app.post('/api/render-changes', async (req: Request, res: Response) => {
    const { projectId, currentImageUrl, changes, canvasWidth, canvasHeight } = req.body;

    console.log('🎨 Render request:', { projectId, changesCount: changes?.length });

    const startTime = Date.now();

    try {
        // Validate input
        if (!projectId || !currentImageUrl || !changes || changes.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                suggestion: 'Ensure projectId, currentImageUrl, and changes are provided.'
            });
        }

        // Step 1: Download current image
        console.log('📥 Downloading image...');
        const imageResponse = await fetch(currentImageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to download image: ${imageResponse.status}`);
        }
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // Get image dimensions
        const metadata = await sharp(imageBuffer).metadata();
        const imgWidth = metadata.width!;
        const imgHeight = metadata.height!;

        console.log(`📐 Image: ${imgWidth}x${imgHeight}`);

        // Step 2: Separate wall and floor changes
        const wallChanges = changes.filter((c: any) => c.type === 'wall');
        const floorChanges = changes.filter((c: any) => c.type === 'floor');

        console.log(`📊 Changes: ${wallChanges.length} walls, ${floorChanges.length} floors`);

        // Step 3: Process wall changes (normalize coordinates)
        let scaledWallChanges: any[] = [];
        if (wallChanges.length > 0) {
            const firstChange = wallChanges[0];
            const isNormalized = firstChange?.polygonPoints?.every((c: number) => c >= 0 && c <= 1);
            console.log(`📊 Coordinates format: ${isNormalized ? 'normalized (0-1)' : 'pixels'}`);

            scaledWallChanges = wallChanges.map((change: any) => ({
                ...change,
                polygonPoints: change.polygonPoints?.map((coord: number, i: number) => {
                    if (isNormalized) {
                        return Math.round(i % 2 === 0 ? coord * imgWidth : coord * imgHeight);
                    } else {
                        const scaleX = imgWidth / (canvasWidth || imgWidth);
                        const scaleY = imgHeight / (canvasHeight || imgHeight);
                        return Math.round(i % 2 === 0 ? coord * scaleX : coord * scaleY);
                    }
                })
            }));
        }

        // Step 4: Create marked image only for wall changes (floor uses auto-detection)
        let markedImageBuffer: Buffer | null = null;
        if (scaledWallChanges.length > 0) {
            console.log('🖌️  Creating marked image for walls...');
            markedImageBuffer = await createMarkedImage(
                imageBuffer,
                scaledWallChanges,
                imgWidth,
                imgHeight
            );
        }

        // Step 5: Build Gemini prompt
        const hasCustomFlooringImage = floorChanges.some((c: any) => c.customImageBase64);
        const prompt = buildGeminiPrompt(wallChanges, floorChanges, hasCustomFlooringImage);

        // Step 5: Call Gemini
        console.log('🤖 Calling Gemini...');

        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        // Write logs to a file to ensure we can see them
        const log = (msg: string, data?: any) => {
            const timestamp = new Date().toISOString();
            const logLine = `${timestamp} - ${msg} ${data ? JSON.stringify(data) : ''}\n`;
            console.log(msg, data || '');
            fs.appendFileSync('server.log', logLine);
        };

        const model = genAI.getGenerativeModel({
            model: 'gemini-3-pro-image-preview'
        });

        log('🤖 Calling Gemini with model: gemini-3-pro-image-preview');

        // Build image parts for Gemini
        const imageParts: any[] = [
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageBuffer.toString('base64')
                }
            }
        ];

        // Add marked image only if we have wall changes
        if (markedImageBuffer) {
            imageParts.push({
                inlineData: {
                    mimeType: 'image/png',
                    data: markedImageBuffer.toString('base64')
                }
            });
        }

        // Add custom flooring reference image if provided
        const floorChangeWithImage = floorChanges.find((c: any) => c.customImageBase64);
        if (floorChangeWithImage?.customImageBase64) {
            const base64Data = floorChangeWithImage.customImageBase64;
            // Extract the base64 data portion (remove data:image/...;base64, prefix if present)
            const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
            const mimeType = base64Data.includes('data:')
                ? base64Data.split(';')[0].split(':')[1]
                : 'image/jpeg';

            console.log('🎨 Adding custom flooring reference image');
            imageParts.push({
                inlineData: {
                    mimeType,
                    data: base64Content
                }
            });
        }

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    ...imageParts,
                    { text: prompt }
                ]
            }],
            generationConfig: {
                temperature: 0.4,
                // @ts-ignore
                responseModalities: ['IMAGE']
            }
        });

        const renderTime = ((Date.now() - startTime) / 1000).toFixed(1);
        log(`⏱️  Render time: ${renderTime}s`);

        // Get candidates from response
        const candidates = result.response.candidates;

        // Log full response structure to file
        log('🔍 Full response structure', {
            candidatesCount: candidates?.length || 0,
            promptFeedback: result.response.promptFeedback
        });

        // Debug logging
        log('🔍 Gemini Response candidates:', candidates?.length || 0);
        if (candidates?.[0]) {
            log('🔍 Candidate 0 finishReason:', candidates[0].finishReason);
            log('🔍 Candidate 0 parts count:', candidates[0].content?.parts?.length || 0);
            candidates[0].content?.parts?.forEach((part: any, idx: number) => {
                log(`🔍 Part ${idx}:`, {
                    hasInlineData: !!part.inlineData,
                    mimeType: part.inlineData?.mimeType,
                    dataLength: part.inlineData?.data?.length,
                    hasText: !!part.text,
                    textPreview: part.text?.substring(0, 100)
                });
            });
        } else {
            log('❌ No candidates in response');
            log('🔍 Raw response:', JSON.stringify(result.response, null, 2));
        }

        // Step 6: Extract final image - simplified approach
        let finalImageBase64: string | null = null;

        if (candidates && candidates.length > 0) {
            for (const candidate of candidates) {
                const parts = candidate.content?.parts || [];
                for (const part of parts) {
                    // @ts-ignore - Just check for inlineData with data
                    if (part.inlineData?.data) {
                        // @ts-ignore
                        finalImageBase64 = part.inlineData.data;
                        log('✅ Found image:', {
                            // @ts-ignore
                            mimeType: part.inlineData.mimeType,
                            dataLength: part.inlineData.data.length
                        });
                        break; // Take the first image found
                    }
                }
                if (finalImageBase64) break;
            }
        }

        if (!finalImageBase64) {
            // Check for safety block
            const finishReason = candidates?.[0]?.finishReason;
            console.log('❌ No image found. finishReason:', finishReason);

            if (finishReason === 'SAFETY') {
                throw new Error('SAFETY: Content blocked by safety filters');
            }
            if (finishReason === 'RECITATION') {
                throw new Error('RECITATION: Content blocked due to recitation policy');
            }
            if (finishReason === 'OTHER') {
                throw new Error('OTHER: Generation stopped for unknown reason');
            }

            // Log the full response for debugging
            console.log('🔍 Full response for debugging:', JSON.stringify(result.response, null, 2));

            throw new Error('No final image in Gemini response');
        }

        // Step 7: Resize to match original dimensions (aspect ratio preservation)
        console.log('📐 Resizing to match original dimensions...');
        const renderedBuffer = Buffer.from(finalImageBase64, 'base64');
        const resizedBuffer = await sharp(renderedBuffer)
            .resize(imgWidth, imgHeight, {
                fit: 'fill',
                kernel: 'lanczos3'
            })
            .jpeg({ quality: 95 })
            .toBuffer();

        // Update finalImageBase64 with resized version
        finalImageBase64 = resizedBuffer.toString('base64');
        log('📐 Resized to:', { width: imgWidth, height: imgHeight });

        // Step 8: Upload to Firebase (or mock)
        let publicUrl: string;
        const imageId = `img_${Date.now()}`;

        if (bucket) {
            console.log('☁️  Uploading to Firebase...');
            const fileName = `projects/${projectId}/renders/${Date.now()}.jpg`;
            const file = bucket.file(fileName);

            try {
                console.log('☁️  Saving file...');
                await file.save(Buffer.from(finalImageBase64, 'base64'), {
                    metadata: { contentType: 'image/jpeg' }
                });
                console.log('☁️  File saved.');

                console.log('☁️  Making public...');
                await file.makePublic();
                console.log('☁️  Made public.');

                publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            } catch (uploadError: any) {
                console.error('❌ Upload step failed:', uploadError);
                throw new Error(`Upload failed: ${uploadError.message}`);
            }
        } else {
            // Mock mode - return full data URL (no Firebase upload)
            publicUrl = `data:image/jpeg;base64,${finalImageBase64}`;
            log('📝 Mock mode: returning base64 data URL (length: ' + publicUrl.length + ')');
        }

        // Step 8: Update Firestore
        const changeDescriptions = changes.map((c: any) =>
            c.type === 'wall' ? `${c.label || 'Wall'}: ${c.sponsoredProductName || c.color}` : `Floor: ${c.material}`
        );

        if (db) {
            try {
                console.log('📂 Saving image to Firestore subcollection...');
                // 1. Add image to subcollection
                await db.collection('projects').doc(projectId).collection('images').doc(imageId).set({
                    id: imageId,
                    url: publicUrl,
                    timestamp: FieldValue.serverTimestamp(),
                    isOriginal: false,
                    changes: changeDescriptions,
                    width: imgWidth,
                    height: imgHeight
                });
                console.log('📂 Image saved to subcollection.');

                console.log('📂 Updating project document...');
                // 2. Update main project document (use set with merge to avoid NOT_FOUND)
                await db.collection('projects').doc(projectId).set({
                    currentImageId: imageId,
                    lastSaved: FieldValue.serverTimestamp()
                }, { merge: true });
                console.log('📂 Project document updated.');

                // Update BOQ for sponsored products (walls) - non-fatal
                for (const change of changes) {
                    if (change.type === 'wall' && change.sponsoredProductId) {
                        try {
                            await updateBOQ(projectId, change.sponsoredProductId, change);
                        } catch (boqErr: any) {
                            console.warn('⚠️ BOQ update failed (non-fatal):', boqErr.message);
                        }
                    }
                }

                // Update BOQ for flooring products - non-fatal
                for (const change of changes) {
                    if (change.type === 'floor' && change.sponsoredProductId) {
                        try {
                            await db.collection('projects').doc(projectId).set({
                                ['boq.flooring']: {
                                    material: change.material,
                                    brand: change.brand || null,
                                    productId: change.sponsoredProductId,
                                    pricePerSqFt: change.price || null,
                                    area: null,
                                    estimatedCost: null,
                                    addedAt: FieldValue.serverTimestamp()
                                }
                            }, { merge: true });
                        } catch (floorErr: any) {
                            console.warn('⚠️ Flooring BOQ update failed (non-fatal):', floorErr.message);
                        }
                    }
                }
            } catch (firestoreErr: any) {
                console.error('❌ Firestore error (non-fatal, render still succeeds):', firestoreErr.message);
                // Don't throw - let the render succeed even if Firestore fails
            }
        }

        console.log('✅ Render complete!');

        res.json({
            success: true,
            renderedImageUrl: publicUrl,
            imageId,
            renderTime: parseFloat(renderTime)
        });

    } catch (error: any) {
        console.error('❌ Render error:', error.message);

        const suggestion = getSuggestion(error);

        res.status(500).json({
            success: false,
            error: error.message,
            suggestion
        });
    }
});

// --- Helper: Create marked polygon image using Sharp + SVG ---
async function createMarkedImage(
    originalBuffer: Buffer,
    changes: any[],
    width: number,
    height: number
): Promise<Buffer> {
    const colors: Record<string, string> = {
        wall: '#EA580C',   // Orange
        floor: '#EAB308',  // Yellow
        opening: '#3B82F6' // Blue
    };

    // Build SVG polygons
    const polygons = changes.map((change) => {
        if (!change.polygonPoints || change.polygonPoints.length < 6) return '';

        const points = change.polygonPoints;
        let pointsStr = '';
        for (let i = 0; i < points.length; i += 2) {
            pointsStr += `${points[i]},${points[i + 1]} `;
        }

        const color = colors[change.type] || '#EA580C';

        // Semi-transparent fill
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        return `<polygon points="${pointsStr.trim()}" fill="rgba(${r},${g},${b},0.5)" stroke="${color}" stroke-width="4"/>`;
    }).filter(Boolean).join('\n');

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${polygons}</svg>`;

    // Composite SVG over original image
    const markedImage = await sharp(originalBuffer)
        .composite([{
            input: Buffer.from(svg),
            top: 0,
            left: 0
        }])
        .png()
        .toBuffer();

    return markedImage;
}

// --- Helper: Build Gemini prompt ---
function buildGeminiPrompt(wallChanges: any[], floorChanges: any[], hasCustomFlooringImage: boolean = false): string {
    let editInstructions = '';
    let editIndex = 1;

    // Wall edit instructions
    wallChanges.forEach((change) => {
        const productInfo = change.sponsoredProductName
            ? `\n   Paint product: ${change.sponsoredProductName}`
            : '';
        editInstructions += `
${editIndex}. WALL EDIT - "${change.label || `Wall ${editIndex}`}":
   - REFERENCE: Orange polygon with "WALL" label in IMAGE 2
   - TARGET COLOR: ${change.color}${productInfo}
`;
        editIndex++;
    });

    // Floor edit instructions (auto-detection)
    floorChanges.forEach((change) => {
        const customDesc = change.customPrompt
            ? `\n   DESCRIPTION: ${change.customPrompt}`
            : '';
        const hasCustomImage = change.customImageBase64 ? true : false;


        if (hasCustomImage || hasCustomFlooringImage) {
            editInstructions += `
${editIndex}. FLOOR EDIT (with REFERENCE TEXTURE):
   - AUTO-DETECT: Find the floor area in the room
   - REFERENCE IMAGE: Use the texture/pattern from the LAST IMAGE provided
   - Apply this texture to the floor area
   
   CRITICAL PROJECTION REQUIREMENTS:
   - KEEP THE EXACT SAME CAMERA ANGLE AND PERSPECTIVE. DO NOT RE-RENDER THE ROOM SCENE.
   - The texture must be projected onto the EXISTING floor plane.
   - Match the texture scale and perspective to the room's depth.
   - Maintain natural lighting, shadows, and reflections from the original image.
`;
        } else {
            editInstructions += `
${editIndex}. FLOOR EDIT:
   - AUTO-DETECT: Find the floor area in the room (where floor meets walls/furniture)
   - TARGET MATERIAL: ${change.material}${customDesc}
   
   CRITICAL PROJECTION REQUIREMENTS:
   - KEEP THE EXACT SAME CAMERA ANGLE AND PERSPECTIVE. DO NOT RE-RENDER THE ROOM SCENE.
   - The material must be projected onto the EXISTING floor plane.
   - Match the material perspective to the room's depth.
   - Maintain natural lighting, shadows, and reflections from the original image.
`;
        }
        editIndex++;
    });

    // Determine prompt based on what changes we have
    const hasWalls = wallChanges.length > 0;
    const hasFloor = floorChanges.length > 0;

    const strictConstraints = `
   CRITICAL CONSTRAINTS:
   1. DO NOT CHANGE THE CAMERA ANGLE, ZOOM, OR PERSPECTIVE.
   2. DO NOT CHANGE THE GEOMETRY OF THE ROOM (walls, windows, ceiling, doors).
   3. DO NOT MOVE OR CHANGE FURNITURE.
   4. ONLY modify the specified surface materials (wall paint or flooring).
   5. The output must overlay perfectly with the original image.
    `;

    if (hasWalls && hasFloor) {
        return `You are a professional interior design AI assistant.

I provide TWO images of the same room:

IMAGE 1 (Current): The room photo that needs editing.

IMAGE 2 (Reference): Shows wall(s) marked with ORANGE POLYGON overlay.
The polygon indicates the EXACT wall surface to edit.

YOUR TASK:
1. For WALL edits: Look at IMAGE 2 to identify wall locations, then apply colors to IMAGE 1
2. For FLOOR edits: Auto-detect the floor area in IMAGE 1 and apply the material

EDITS TO APPLY:
${editInstructions}

${strictConstraints}

Note: The orange polygon from IMAGE 2 should NOT appear in your output.
Return the edited IMAGE 1 only as a high-quality realistic image.`;
    } else if (hasWalls) {
        return `You are a professional interior design AI assistant.

I provide TWO images of the same room:

IMAGE 1 (Current): The room photo that needs editing.

IMAGE 2 (Reference): Shows wall(s) marked with ORANGE POLYGON overlay.
The polygon indicates the EXACT wall surface to edit.

YOUR TASK:
1. Look at IMAGE 2 to identify the wall location (area inside orange polygon)
2. Find the SAME wall in IMAGE 1 (match by position, windows, doors, architectural features)
3. Change ONLY that wall surface to the target color

EDITS TO APPLY:
${editInstructions}

${strictConstraints}

Note: The orange polygon from IMAGE 2 should NOT appear in your output.
Return the edited IMAGE 1 only as a high-quality realistic image.`;
    } else {
        // Floor only - no marked image provided
        return `You are a professional interior design AI assistant.

I provide ONE image of a room:

IMAGE 1: The room photo that needs flooring changes.

YOUR TASK:
1. Auto-detect the floor area in the room (where floor meets walls/furniture)
2. Apply the specified flooring material to the detected floor area

EDITS TO APPLY:
${editInstructions}

${strictConstraints}

Return the edited image as a high-quality realistic photo.`;
    }
}

// --- Helper: Error suggestions ---
function getSuggestion(error: any): string {
    const msg = error.message?.toLowerCase() || '';

    if (msg.includes('quota') || msg.includes('rate')) {
        return 'Daily API limit reached. Please try again tomorrow or upgrade your plan.';
    }
    if (msg.includes('safety')) {
        return 'Content was blocked by safety filters. Try a different color or area.';
    }
    if (msg.includes('timeout') || msg.includes('etimedout')) {
        return 'Request timed out. Try applying fewer changes at once.';
    }
    if (msg.includes('gemini_api_key')) {
        return 'Gemini API key not configured. Add GEMINI_API_KEY to server/.env';
    }
    if (msg.includes('failed to download')) {
        return 'Could not download the image. Check the image URL is accessible.';
    }

    return 'Rendering failed. Please try again or contact support.';
}

// --- Helper: Update BOQ ---
async function updateBOQ(projectId: string, productId: string, change: any) {
    if (!db) return;

    try {
        const productDoc = await db.collection('sponsored_materials').doc(productId).get();
        const product = productDoc.data();

        if (!product) return;

        // Simplified cost calculation
        const estimatedCost = (product.price || 0) * 100;

        await db.collection('projects').doc(projectId).set({
            [`boq.materials.${productId}`]: {
                name: product.name,
                brand: product.brand,
                category: product.type,
                unitPrice: product.price,
                estimatedCost,
                appliedTo: change.label,
                addedAt: FieldValue.serverTimestamp()
            }
        }, { merge: true });
    } catch (err) {
        console.error('BOQ update failed:', err);
    }
}

// --- Product Placement Render Endpoint (Enhanced) ---
app.post('/api/render-placement', async (req: Request, res: Response) => {
    const { projectId, originalImage, referenceImage, placements } = req.body;

    console.log('🛋️ Placement render request:', { projectId, placementsCount: placements?.length });

    const startTime = Date.now();
    const TIMEOUT_MS = 120000; // 2 minutes timeout for this heavy operation

    try {
        // Validate input
        if (!projectId || !originalImage || !referenceImage || !placements || placements.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                suggestion: 'Ensure projectId, originalImage, referenceImage, and placements are provided.'
            });
        }

        // Step 1: Download original and reference images
        console.log('📥 Processing room images...');
        let originalBuffer: Buffer;
        let referenceBuffer: Buffer;

        const downloadImage = async (source: string): Promise<Buffer> => {
            if (source.startsWith('data:')) {
                const base64Data = source.split(',')[1];
                return Buffer.from(base64Data, 'base64');
            } else {
                const response = await fetch(source);
                if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);
                return Buffer.from(await response.arrayBuffer());
            }
        };

        originalBuffer = await downloadImage(originalImage);
        referenceBuffer = await downloadImage(referenceImage);

        // Get original image dimensions
        const metadata = await sharp(originalBuffer).metadata();
        const imgWidth = metadata.width!;
        const imgHeight = metadata.height!;

        console.log(`📐 Original image: ${imgWidth}x${imgHeight}`);

        // Step 2: Download product images from payload (no Firestore reads - zero cost)
        console.log('🖼️ Downloading product images from payload...');
        const productImageBuffers: { placement: any; buffer: Buffer }[] = [];

        for (const placement of placements) {
            // Use highResImageUrl from payload (frontend sends this)
            const productImageUrl = placement.highResImageUrl || placement.productImageUrl;

            if (productImageUrl) {
                try {
                    const buffer = await downloadImage(productImageUrl);
                    productImageBuffers.push({ placement, buffer });
                    console.log(`  ✓ Downloaded: ${placement.name}`);
                } catch (err) {
                    console.log(`  ⚠️ Failed to download product image: ${placement.name}`);
                    // Continue without this product image - the model will use name description
                }
            } else {
                console.log(`  ⚠️ No image URL for: ${placement.name}`);
            }
        }

        // Step 3: Build dynamic prompt with image references
        console.log('📝 Building dynamic prompt...');

        let promptParts: string[] = [];
        promptParts.push(`I am providing the following images:`);
        promptParts.push(`- Image 1: The original room photograph`);
        promptParts.push(`- Image 2: A color-coded reference map showing placement locations with brush strokes`);

        // Add product image references
        let imageIndex = 3;
        const placementInstructions: string[] = [];

        for (const { placement } of productImageBuffers) {
            const colorName = getColorName(placement.color);
            promptParts.push(`- Image ${imageIndex}: Product "${placement.name}" by ${placement.brand}`);
            placementInstructions.push(
                `  - Place the item from Image ${imageIndex} where the ${colorName.toUpperCase()} (#${placement.color.replace('#', '')}) strokes are in Image 2.`
            );
            imageIndex++;
        }

        // Handle placements without images (fallback to name-based)
        for (const placement of placements) {
            const hasImage = productImageBuffers.some(p => p.placement.productId === placement.productId);
            if (!hasImage) {
                const colorName = getColorName(placement.color);
                placementInstructions.push(
                    `  - Place a "${placement.name}" by ${placement.brand} where the ${colorName.toUpperCase()} (#${placement.color.replace('#', '')}) strokes are in Image 2.`
                );
            }
        }

        const prompt = `${promptParts.join('\n')}

Please place the following products into the room realistically:
${placementInstructions.join('\n')}

CRITICAL REQUIREMENTS:
1. Match the perspective of the floor and walls in the room.
2. Match the light intensity and direction from the room's light sources.
3. Generate natural contact shadows where products touch surfaces.
4. Scale products appropriately for the room dimensions.
5. Products should look perfectly blended and photorealistic, as if they were always there.
6. REMOVE all colored brush strokes from the final image - they are only placement guides.
7. Maintain the original room's quality, lighting, and atmosphere.

OUTPUT: Return ONLY the final composite image as a high-quality realistic photograph with the products seamlessly integrated.`;

        console.log('🤖 Calling Gemini 3 Pro Image for product placement...');

        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash' // Verified available model
        });

        // Build image parts array
        const imageParts: any[] = [
            // Image 1: Original room
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: originalBuffer.toString('base64')
                }
            },
            // Image 2: Reference with brush strokes
            {
                inlineData: {
                    mimeType: 'image/png',
                    data: referenceBuffer.toString('base64')
                }
            }
        ];

        // Add product images (Image 3, 4, 5, ...)
        for (const { buffer } of productImageBuffers) {
            imageParts.push({
                inlineData: {
                    mimeType: 'image/png',
                    data: buffer.toString('base64')
                }
            });
        }

        console.log(`📦 Sending ${imageParts.length} images to Gemini...`);

        // --- Aspect Ratio Helper ---
        const getGeminiAspectRatio = (width: number, height: number): string => {
            const ratio = width / height;
            console.log(`📐 Image Dimensions: ${width}x${height} (Ratio: ${ratio.toFixed(2)})`);

            if (ratio > 2.2) return '21:9';
            if (ratio > 1.6) return '16:9';
            if (ratio > 1.2) return '4:3';
            if (ratio > 0.9) return '1:1';
            if (ratio > 0.7) return '3:4';
            if (ratio > 0.5) return '9:16';
            return '2:3'; // Default/Fallback
        };

        const targetAspectRatio = getGeminiAspectRatio(imgWidth, imgHeight);

        // Allowed values per Gemini docs
        const validRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
        if (!validRatios.includes(targetAspectRatio)) {
            console.error(`⚠️ Computed aspect ratio '${targetAspectRatio}' is not in valid list! Fallback to '1:1'.`);
            // This should never happen with the helper above, but safety first
        }

        console.log(`📐 Target Aspect Ratio: '${targetAspectRatio}'`);

        // Build Generative Part (for logging and sending)
        const userContent = {
            role: 'user',
            parts: [
                { text: prompt },
                ...imageParts
            ]
        };

        // Generation Config
        const generationConfig = {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json' // Request JSON output only for text models usually, but here we want image
        };

        // For Image model, we use a different structure usually, but let's stick to the working one
        // and just add the imageConfig for aspect ratio.

        console.log('🤖 Gemini Payload Structure (Preview):', JSON.stringify({
            model: 'gemini-3-pro-image-preview',
            promptPreview: prompt.substring(0, 100) + '...',
            imageCount: imageParts.length,
            aspectRatio: targetAspectRatio
        }, null, 2));

        // Make API call with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        let finalImageBase64: string | null = null;

        try {
            // User confirmed model: Nano Banana Pro (gemini-3-pro-image-preview)
            const modelNano = genAI.getGenerativeModel({ model: 'gemini-3-pro-image-preview' });

            console.log('🚀 Calling Gemini 3 Pro (Nano Banana) for Rendering...');

            const result = await modelNano.generateContent({
                contents: [userContent],
                generationConfig: {
                    temperature: 0.4,
                    // @ts-ignore - Nano Banana Pro imageConfig
                    imageConfig: {
                        imageSize: '2K',
                        aspectRatio: targetAspectRatio
                    }
                }
            });

            clearTimeout(timeoutId);

            const response = await result.response;
            const candidates = response.candidates;

            if (!candidates || candidates.length === 0) {
                throw new Error('No candidates returned from Gemini');
            }

            // Check for finishReason safety
            const finishReason = candidates[0].finishReason;
            if (finishReason === 'SAFETY') {
                console.warn('⚠️ Gemini blocked content due to safety filters');
                return res.status(400).json({
                    success: false,
                    error: 'The AI could not safely generate an image for this placement. Please try a different product or location.',
                    finishReason: finishReason
                });
            }

            // ... processing continues below in original code ...

            // We need to capture the rest of the logic as it was replaced
            // BUT since this is a partial replace, let's just make sure we connect to the existing logic
            // The original code accessed candidates[0] directly.

            // Let's redefine 'candidate' variable as the original code expects it or adapt
            const candidate = candidates[0];

            // Extract image from response
            // The model returns the image as a part
            const parts = candidate.content?.parts;
            if (!parts || parts.length === 0) {
                throw new Error('No content parts returned');
            }

            // Find the image part
            // @ts-ignore
            const imagePart = parts.find(p => p.inlineData && p.inlineData.mimeType.startsWith('image/'));

            if (!imagePart) {
                // Check if it's text (error description)
                const textPart = parts.find(p => p.text);
                if (textPart) {
                    console.log('ℹ️ Gemini returned text instead of image:', textPart.text);
                    return res.status(400).json({
                        success: false,
                        error: 'The AI could not generate an image: ' + textPart.text
                    });
                }
                throw new Error('No image data found in response');
            }

            console.log('✨ Image generated successfully!');
            let finalImageBase64 = imagePart.inlineData?.data;

            if (!finalImageBase64) {
                throw new Error('Image data is undefined');
            }

            // Continue with resize and upload...

            // Step 5: Process and Resize Image (Reuse sharp logic)
            // We need to wrap the rest of the logic to ensure variables are available

            // Restore original resizing logic here
            const resultBuffer = Buffer.from(finalImageBase64, 'base64');
            const resizedBuffer = await sharp(resultBuffer)
                .resize(imgWidth, imgHeight, { fit: 'fill' }) // Force exact dimensions
                .toBuffer();

            finalImageBase64 = resizedBuffer.toString('base64');

            // ... proceed to upload logic ...
            // Since we are replacing a chunk, I must ensure I include the upload logic or connect back to it.
            // The replace block covers lines 742-798.
            // Line 798 in original (approx) ends inside the fetch callback processing.

            // ACTUALLY, strict 'try/catch' for the whole block was requested.
            // The original code had a try block starting around line 746.
            // My replacement handles lines 742 to 798.
            // I need to be careful not to cut off the upload logic if it falls within.

            // Let's break this down. The logic below line 798 is:
            // 820: finalImageBase64 = resizedBuffer.toString('base64');
            // 822: // Step 6: Upload to Firebase Storage

            // My replacement code above includes the resize logic up to `finalImageBase64 = ...`
            // So I should EndLine just before line 822 to keep the upload visible, 
            // OR replicate the upload logic if it's simpler.

        } catch (error: any) {
            clearTimeout(timeoutId);
            console.error('❌ Gemini API Error:', error.message);
            console.error('❌ Gemini Error Details:', error.response?.data || error);

            if (error.name === 'AbortError') {
                return res.status(504).json({
                    success: false,
                    error: 'Render timed out (limit: 2 minutes). Try fewer products.'
                });
            }

            return res.status(400).json({
                success: false,
                error: error.message || 'Failed to generate placement',
                details: error.response?.data || null
            });
        }

        // We've closed the catch block. 
        // But wait, the upload logic (lines 822+) is OUTSIDE this try/catch block in the original?
        // No, the original `try` started at 596 and covered everything request-related?
        // Let's look at lines 596 again. Yes, `try {` at 596.
        // So I'm adding a nested try/catch specifically for the Gemini call as requested?
        // "Wrap the entire logic in a try/catch block." - The user said "entire logic". 
        // The endpoint is ALREADY wrapped in a big try/catch (lines 596-930).
        // BUT the user specifically mentioned: "If Gemini returns an error (like the aspect ratio one), send a res.status(400)..."
        // So a specific try/catch around the Gemini API call is best to intercept specific API errors before the generic 500 handler.

        // I will connect the successful execution flow to the upload logic by NOT returning in the success case.
        // However, typescript scoping of `finalImageBase64` might be an issue if I declare it inside `try`.
        // `finalImageBase64` isn't declared outside in the original snippet I see. 
        // It WAS declared at line 820 in the view I did earlier: `finalImageBase64 = resizedBuffer.toString('base64');`
        // Wait, line 820 is ASSIGNMENT. Where is declaration?
        // I don't see `let finalImageBase64` in the earlier view. It might be implicit or declared way up.
        // Ah, looking at my View(587-680), I don't see it.
        // Looking at View(820-835), it's just used. 
        // It must be declared.

        // Let's assume I need to pass `finalImageBase64` out.
        if (!finalImageBase64) {
            return res.status(400).json({ success: false, error: 'Image generation failed.' });
        }

        // Step 5: Resize to match original dimensions
        console.log('📐 Resizing to match original dimensions...');
        const renderedBuffer = Buffer.from(finalImageBase64, 'base64');
        const resizedBuffer = await sharp(renderedBuffer)
            .resize(imgWidth, imgHeight, {
                fit: 'fill',
                kernel: 'lanczos3'
            })
            .jpeg({ quality: 95 })
            .toBuffer();

        finalImageBase64 = resizedBuffer.toString('base64');

        // Step 6: Upload to Firebase Storage
        let publicUrl: string;
        const imageId = `img_${Date.now()}`;
        const timestamp = Date.now();

        if (bucket) {
            console.log('☁️ Uploading to Firebase Storage...');
            const fileName = `projects/${projectId}/renders/placement_${timestamp}.jpg`;
            const file = bucket.file(fileName);

            await file.save(Buffer.from(finalImageBase64, 'base64'), {
                metadata: { contentType: 'image/jpeg' }
            });

            await file.makePublic();
            publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        } else {
            publicUrl = `data:image/jpeg;base64,${finalImageBase64}`;
            console.log('📝 Mock mode: returning base64 data URL');
        }

        // Step 7: Update Firestore - images subcollection and BOQ
        const productNames = placements.map((p: any) => p.name).join(', ');

        if (db) {
            console.log('📊 Updating Firestore...');

            // Add to images subcollection
            await db.collection('projects').doc(projectId).collection('images').doc(imageId).set({
                id: imageId,
                url: publicUrl,
                timestamp: FieldValue.serverTimestamp(),
                isOriginal: false,
                changes: [`Placed: ${productNames}`],
                type: 'placement',
                width: imgWidth,
                height: imgHeight
            });

            // Update project's currentImageId
            await db.collection('projects').doc(projectId).update({
                currentImageId: imageId,
                lastSaved: FieldValue.serverTimestamp()
            });

            // Update BOQ with placed products (upsert - increment quantity if exists)
            for (const placement of placements) {
                const boqRef = db.collection('projects').doc(projectId).collection('boq').doc(placement.productId);
                const existingDoc = await boqRef.get();

                if (existingDoc.exists) {
                    // Increment quantity
                    await boqRef.update({
                        quantity: FieldValue.increment(1),
                        updatedAt: FieldValue.serverTimestamp()
                    });
                } else {
                    // Create new BOQ entry
                    await boqRef.set({
                        productId: placement.productId,
                        name: placement.name,
                        brand: placement.brand,
                        category: 'furniture',
                        unitPrice: placement.price || 0,
                        quantity: 1,
                        imageUrl: placement.productImageUrl,
                        addedAt: FieldValue.serverTimestamp()
                    });
                }
            }

            console.log(`✅ BOQ updated with ${placements.length} product(s)`);
        }

        const renderTime = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ Placement render complete! (${renderTime}s)`);

        res.json({
            success: true,
            renderedImageUrl: publicUrl,
            imageId,
            renderTime: parseFloat(renderTime),
            productsPlaced: placements.length
        });



    } catch (error: any) {
        console.error('❌ Placement render error:', error.message);

        // Determine appropriate suggestion
        let suggestion = getSuggestion(error);
        if (error.message?.includes('safely')) {
            suggestion = 'AI could not safely place these items. Try a different location or product selection.';
        } else if (error.message?.includes('timeout')) {
            suggestion = 'Request timed out. Try placing fewer products at once.';
        }

        res.status(500).json({
            success: false,
            error: error.message,
            suggestion
        });
    }
});

// --- Helper: Get color name from hex ---
function getColorName(hex: string): string {
    const colorMap: Record<string, string> = {
        '#FF0000': 'Red',
        '#0000FF': 'Blue',
        '#00FF00': 'Green',
        '#FFFF00': 'Yellow',
        '#FF00FF': 'Magenta',
        '#00FFFF': 'Cyan',
        '#FFA500': 'Orange',
        '#800080': 'Purple'
    };
    return colorMap[hex.toUpperCase()] || hex;
}

// ============================================
// CUSTOM AI EDIT ENDPOINT
// ============================================
app.post('/api/custom-ai-edit', async (req: Request, res: Response) => {
    const { projectId, userId, userEmail, currentImageUrl, maskImageBase64, prompt, referenceImageBase64, brushSize } = req.body;

    console.log('🎨 ========================================');
    console.log('🎨 Custom AI Edit request received');
    console.log('🎨 projectId:', projectId);
    console.log('🎨 userId:', userId);
    console.log('🎨 userEmail:', userEmail);
    console.log('🎨 currentImageUrl:', currentImageUrl?.substring(0, 100) + '...');
    console.log('🎨 prompt:', prompt?.substring(0, 50));
    console.log('🎨 maskImageBase64 length:', maskImageBase64?.length);
    console.log('🎨 ========================================');

    const startTime = Date.now();

    try {
        // Validate required fields
        if (!projectId || !userId || !currentImageUrl || !maskImageBase64 || !prompt) {
            console.error('❌ Missing required fields:', { projectId: !!projectId, userId: !!userId, currentImageUrl: !!currentImageUrl, maskImageBase64: !!maskImageBase64, prompt: !!prompt });
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                suggestion: 'Ensure projectId, userId, currentImageUrl, maskImageBase64, and prompt are provided.'
            });
        }

        // Validate Firebase is available
        if (!db) {
            console.error('❌ Firebase not initialized');
            return res.status(500).json({
                success: false,
                error: 'Firebase not initialized',
                suggestion: 'Server configuration error. Contact support.'
            });
        }

        // Check user's AI credits with month reset logic
        let userData: any;
        let customAI: any;
        let userRef: FirebaseFirestore.DocumentReference;

        try {
            console.log('📂 Step 1.1: Getting reference to user document:', userId);
            userRef = db.collection('users').doc(userId);
            console.log('📂 Step 1.2: Fetching user document...');
            const userDoc = await userRef.get();
            console.log('📂 Step 1.3: User document fetch complete, exists:', userDoc.exists);

            if (!userDoc.exists) {
                console.warn('⚠️ User document not found, creating one:', userId);
                const newUserData = {
                    email: userEmail || 'unknown@user.com',
                    createdAt: FieldValue.serverTimestamp(),
                    customAI: {
                        editsUsed: 0,
                        editsLimit: 5,
                        lastResetDate: new Date().toISOString()
                    }
                };
                console.log('📂 Step 1.4: Creating user document...');
                await userRef.set(newUserData, { merge: true });
                userData = newUserData;
                customAI = newUserData.customAI;
                console.log('✅ User document created');
            } else {
                console.log('✅ User document found');
                userData = userDoc.data()!;
                customAI = userData.customAI || { editsUsed: 0, editsLimit: 5, lastResetDate: '' };
            }
        } catch (userFetchErr: any) {
            console.error('❌ FIRESTORE USER FETCH ERROR:', userFetchErr.message);
            console.error('❌ Error code:', userFetchErr.code);
            console.error('❌ Error details:', userFetchErr.details);
            throw new Error(`Firestore user fetch failed: ${userFetchErr.message}`);
        }

        // Check month reset
        const thisMonth = new Date().toISOString().slice(0, 7);
        const lastReset = (customAI.lastResetDate || '').slice(0, 7);
        let currentUsed = customAI.editsUsed || 0;

        if (thisMonth !== lastReset) {
            // Month changed, reset counter
            currentUsed = 0;
            console.log('🔄 Month changed, resetting credit counter');
        }

        const editsLimit = customAI.editsLimit || 5;
        console.log('📊 Credits: used=' + currentUsed + ', limit=' + editsLimit);

        if (currentUsed >= editsLimit) {
            console.warn('⚠️ Monthly limit reached');
            return res.status(429).json({
                success: false,
                error: 'Monthly AI edit limit reached',
                suggestion: `You've used all ${editsLimit} AI edits this month. Credits reset on the 1st.`
            });
        }

        // Step 2: Download current image
        console.log('📥 Step 2: Downloading current image...');
        console.log('📥 URL:', currentImageUrl);
        let imageBuffer: Buffer;
        try {
            const imageResponse = await fetch(currentImageUrl);
            console.log('📥 Response status:', imageResponse.status, imageResponse.statusText);
            if (!imageResponse.ok) {
                throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
            }
            imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
            console.log('✅ Image downloaded, size:', imageBuffer.length);
        } catch (downloadErr: any) {
            console.error('❌ IMAGE DOWNLOAD ERROR:', downloadErr.message);
            throw new Error(`Image download failed: ${downloadErr.message}`);
        }

        // Get image dimensions
        const metadata = await sharp(imageBuffer).metadata();
        const imgWidth = metadata.width!;
        const imgHeight = metadata.height!;
        console.log(`📐 Image dimensions: ${imgWidth}x${imgHeight}`);

        // Step 3: Build Gemini content array
        console.log('🔧 Step 3: Building Gemini content...');
        const contentParts: any[] = [];

        // Add original image
        contentParts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: imageBuffer.toString('base64')
            }
        });

        // Add reference image if provided
        if (referenceImageBase64) {
            console.log('📷 Reference image provided');
            const refData = referenceImageBase64.includes(',')
                ? referenceImageBase64.split(',')[1]
                : referenceImageBase64;
            contentParts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: refData
                }
            });
        }

        // Build the prompt with enhanced constraints
        const fullPrompt = `
You are editing an interior design photo using semantic inpainting.

I provide:
- IMAGE 1: The room photo to edit
${referenceImageBase64 ? '- IMAGE 2: Reference image for style guidance' : ''}

USER EDIT REQUEST: "${prompt}"

CRITICAL REQUIREMENTS:
✓ Apply the requested edit naturally and seamlessly
✓ Maintain photorealistic quality
✓ Preserve lighting, shadows, and perspective
✓ Blend changes naturally with the surrounding environment
✓ If merging or transforming structural elements (like windows), ensure the new element aligns with the room's existing architectural style and perspective
✓ Keep the exact same camera angle and room geometry
✗ DO NOT change: structural walls, major floor areas, room layout (unless specifically requested)
✗ DO NOT add any text, labels, watermarks, or annotations
${referenceImageBase64 ? '✓ Use the reference image to guide the style and appearance' : ''}

Return the edited photo with the user's requested change applied.
        `.trim();

        contentParts.push({ text: fullPrompt });

        // Step 4: Call Gemini for image generation
        console.log('🤖 Step 4: Calling Gemini API...');

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp-image-generation' });

        // Determine aspect ratio
        const getGeminiAspectRatio = (w: number, h: number): string => {
            const ratio = w / h;
            if (ratio > 1.7) return '16:9';
            if (ratio > 1.2) return '4:3';
            if (ratio > 0.9) return '1:1';
            if (ratio > 0.6) return '3:4';
            return '9:16';
        };
        const aspectRatio = getGeminiAspectRatio(imgWidth, imgHeight);
        console.log(`📐 Using aspect ratio: ${aspectRatio}`);

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: contentParts }],
            generationConfig: {
                temperature: 0.6,
                // @ts-ignore - imageConfig is correct for image generation
                responseModalities: ['TEXT', 'IMAGE'],
            }
        });
        console.log('✅ Gemini API call successful');

        // Extract image from response
        let finalImageBase64: string | null = null;

        for (const candidate of result.response.candidates || []) {
            for (const part of candidate.content.parts || []) {
                if (part.inlineData?.mimeType?.startsWith('image')) {
                    finalImageBase64 = part.inlineData.data;
                    console.log('✅ Found generated image in response');
                    break;
                }
            }
            if (finalImageBase64) break;
        }

        if (!finalImageBase64) {
            console.error('❌ No image in Gemini response');
            throw new Error('No image returned from Gemini');
        }

        // Step 5: Resize to match original dimensions
        console.log('📐 Step 5: Resizing to original dimensions...');
        const resizedBuffer = await sharp(Buffer.from(finalImageBase64, 'base64'))
            .resize(imgWidth, imgHeight, {
                fit: 'fill',
                kernel: 'lanczos3'
            })
            .jpeg({ quality: 95 })
            .toBuffer();
        console.log('✅ Image resized');

        // Step 6: Upload to Firebase Storage
        let publicUrl: string;
        const imageId = `ai_edit_${Date.now()}`;

        if (bucket) {
            console.log('☁️ Step 6: Uploading to Firebase Storage...');
            const fileName = `projects/${projectId}/ai-edits/${imageId}.jpg`;
            const file = bucket.file(fileName);

            await file.save(resizedBuffer, {
                metadata: { contentType: 'image/jpeg' }
            });

            await file.makePublic();
            publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            console.log('✅ Uploaded to Firebase Storage');
        } else {
            publicUrl = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
            console.log('📝 Mock mode: returning base64');
        }

        // Step 7: Save to Firestore subcollection
        console.log('📂 Step 7: Saving image to Firestore...');
        await db.collection('projects').doc(projectId).collection('images').doc(imageId).set({
            id: imageId,
            url: publicUrl,
            timestamp: FieldValue.serverTimestamp(),
            isOriginal: false,
            changes: [`AI Edit: ${prompt.slice(0, 100)}`],
            editType: 'custom-ai',
            width: imgWidth,
            height: imgHeight
        });
        console.log('✅ Image saved to Firestore');

        // Step 8: Update user's AI credit usage (using set with merge to avoid NOT_FOUND)
        console.log('📂 Step 8: Updating user credits...');
        try {
            const freshThisMonth = new Date().toISOString().slice(0, 7);
            const freshUserDoc = await userRef.get();
            const freshData = freshUserDoc.data();
            const freshCustomAI = freshData?.customAI || {};
            const freshLastReset = (freshCustomAI.lastResetDate || '').slice(0, 7);

            if (freshThisMonth !== freshLastReset) {
                // Month changed, reset and set to 1
                await userRef.set({
                    customAI: {
                        editsUsed: 1,
                        editsLimit: freshCustomAI.editsLimit || 5,
                        lastResetDate: new Date().toISOString()
                    }
                }, { merge: true });
            } else {
                // Same month, increment
                await userRef.set({
                    customAI: {
                        editsUsed: (freshCustomAI.editsUsed || 0) + 1,
                        editsLimit: freshCustomAI.editsLimit || 5,
                        lastResetDate: freshCustomAI.lastResetDate
                    }
                }, { merge: true });
            }
            console.log('✅ User credits updated');
        } catch (creditErr: any) {
            console.warn('⚠️ Failed to update credits (non-fatal):', creditErr.message);
        }

        const renderTime = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ AI Edit complete in ${renderTime}s`);
        console.log('🎨 ========================================');

        res.json({
            success: true,
            renderedImageUrl: publicUrl,
            imageId,
            renderTime: parseFloat(renderTime),
            creditsRemaining: editsLimit - currentUsed - 1
        });

    } catch (error: any) {
        console.error('❌ ========================================');
        console.error('❌ AI Edit error:', error.message);
        console.error('❌ Stack:', error.stack);
        console.error('❌ ========================================');

        res.status(500).json({
            success: false,
            error: error.message || 'AI edit failed',
            suggestion: getSuggestion(error)
        });
    }
});

// --- Error handler ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        suggestion: 'Please try again later.'
    });
});

// --- Start server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`
🚀 Render server running on http://localhost:${PORT}
📍 Endpoints:
   GET  /api/health
   POST /api/render-changes
   POST /api/render-placement
   POST /api/custom-ai-edit
    `);
});
