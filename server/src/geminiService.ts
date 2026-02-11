import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { RenderChange } from './types.js';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Build the prompt for Gemini based on the changes requested
 */
function buildPrompt(changes: RenderChange[]): string {
    const editDescriptions = changes.map((change, index) => {
        if (change.type === 'wall') {
            const colorName = change.sponsoredProductName || change.color || 'white';
            return `
${index + 1}. ORANGE POLYGON (${change.label}): Change the wall surface to ${colorName} color (${change.color})
   ${change.sponsoredProductName ? `- This is "${change.sponsoredProductName}"` : ''}
   - Preserve all architectural details (trim, molding, outlets)
   - Maintain natural lighting and shadow gradients
   - Keep wall texture realistic`;
        } else if (change.type === 'floor') {
            return `
${index + 1}. YELLOW POLYGON (${change.label}): Change the flooring to ${change.material}
   ${change.sponsoredProductName ? `- This is "${change.sponsoredProductName}"` : ''}
   - Maintain perspective and lighting
   - Keep floor texture natural`;
        }
        return '';
    }).join('\n');

    return `You are a professional interior design image editing AI.

I am providing TWO images:

**IMAGE 1 (Original)**: The room photo that needs editing.
**IMAGE 2 (Reference)**: The same image with COLORED POLYGONS marking edit areas.

YOUR TASK:
Look at IMAGE 2 to identify which areas to edit, then apply those edits to IMAGE 1.

EDITS TO APPLY:
${editDescriptions}

CRITICAL RULES:
1. ONLY edit areas inside marked polygons
2. DO NOT change: windows, doors, furniture, ceiling, or any unmarked areas
3. PRESERVE: lighting, shadows, perspective, architectural features
4. BLEND: colors naturally with existing room lighting
5. MAINTAIN: surface texture and realistic appearance
6. The result should look like a professional photograph, not a digital edit
7.if switchboard or object comes in wall rea ,exclude that part to paint
Return ONLY the edited IMAGE 1 with changes applied.
Do NOT include polygon markings in your output.`;
}

/**
 * Call Gemini 3 Pro Image API to render the changes
 */
export async function callGeminiImageEdit(
    originalImageBase64: string,
    markedImageBase64: string,
    changes: RenderChange[]
): Promise<{ success: boolean; imageBase64?: string; error?: string; errorCode?: string }> {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp-image-generation',
        });

        const prompt = buildPrompt(changes);

        console.log('[Gemini] Sending request with prompt:', prompt.substring(0, 200) + '...');

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: originalImageBase64
                        }
                    },
                    {
                        inlineData: {
                            mimeType: 'image/png',
                            data: markedImageBase64
                        }
                    },
                    { text: prompt }
                ]
            }],
            generationConfig: {
                temperature: 0.4,
                // @ts-ignore - responseModalities is valid for image generation
                responseModalities: ['IMAGE', 'TEXT'],
            }
        });

        const response = result.response;
        const candidates = response.candidates;

        if (!candidates || candidates.length === 0) {
            return { success: false, error: 'No response from Gemini', errorCode: 'UNKNOWN' };
        }

        // Find the image part in the response
        for (const candidate of candidates) {
            const parts = candidate.content?.parts || [];
            for (const part of parts) {
                // @ts-ignore - inlineData exists on image parts
                if (part.inlineData && part.inlineData.data) {
                    // Skip "thinking" images if they have a thought signature
                    // @ts-ignore
                    if (part.thoughtSignature) continue;

                    // @ts-ignore
                    return { success: true, imageBase64: part.inlineData.data };
                }
            }
        }

        // Check for safety filter block
        const finishReason = candidates[0]?.finishReason;
        if (finishReason === 'SAFETY') {
            return {
                success: false,
                error: 'Content was blocked by safety filter. Try a different color or area.',
                errorCode: 'SAFETY_FILTER'
            };
        }

        return { success: false, error: 'No image in Gemini response', errorCode: 'UNKNOWN' };

    } catch (error: any) {
        console.error('[Gemini] Error:', error);

        // Handle specific error types
        if (error.message?.includes('quota')) {
            return {
                success: false,
                error: 'API quota exceeded. Try again later or upgrade your plan.',
                errorCode: 'QUOTA_EXCEEDED'
            };
        }

        if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
            return {
                success: false,
                error: 'Rendering took too long. Try fewer changes at once.',
                errorCode: 'TIMEOUT'
            };
        }

        return {
            success: false,
            error: error.message || 'Unknown error occurred',
            errorCode: 'UNKNOWN'
        };
    }
}
