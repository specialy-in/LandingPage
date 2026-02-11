import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { RenderChange, SponsoredProduct } from './types.js';

// Initialize Firebase Admin
let app: App | null = null;
let db: any = null;
let storage: any = null;

try {
    const apps = getApps();
    if (apps.length === 0) {
        // Only attempt to initialize if we have credentials
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';
        const fs = require('fs');

        if (process.env.GOOGLE_APPLICATION_CREDENTIALS || fs.existsSync(credentialsPath)) {
            app = initializeApp({
                credential: cert(credentialsPath),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET
            });
            console.log('[Firebase] Initialized successfully');
        } else {
            console.warn('[Firebase] Warning: serviceAccountKey.json not found and GOOGLE_APPLICATION_CREDENTIALS not set by user.');
            console.warn('[Firebase] Firebase features will be disabled (mock mode).');
        }
    } else {
        app = apps[0];
    }

    if (app) {
        db = getFirestore(app);
        storage = getStorage(app);
    }
} catch (error) {
    console.error('[Firebase] Initialization failed:', error);
}

/**
 * Upload rendered image to Firebase Storage
 */
export async function uploadRenderedImage(
    projectId: string,
    imageBuffer: Buffer,
    mimeType: string = 'image/jpeg'
): Promise<string> {
    if (!storage) {
        console.log('[Firebase] Mocking uploadRenderedImage (no credentials)');
        // Return a placeholder or the original image if available (but we don't have it here easily without passing it)
        // For now return a dummy URL that won't load but proves the point
        return `https://placehold.co/1920x1080/EA580C/FFFFFF?text=Rendered+Image+(Mock)`;
    }

    const bucket = storage.bucket();
    const filename = `projects/${projectId}/renders/${Date.now()}.jpg`;
    const file = bucket.file(filename);

    await file.save(imageBuffer, {
        metadata: {
            contentType: mimeType,
            cacheControl: 'public, max-age=31536000'
        }
    });

    // Make file public
    await file.makePublic();

    // Return public URL
    return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

/**
 * Update project with new rendered image
 */
export async function updateProjectWithRender(
    projectId: string,
    imageUrl: string,
    imageId: string,
    changes: RenderChange[]
): Promise<void> {
    if (!db) {
        console.log('[Firebase] Mocking updateProjectWithRender (no credentials)');
        return;
    }

    const changeDescriptions = changes.map(c => {
        if (c.type === 'wall') {
            return `${c.label}: ${c.sponsoredProductName || c.color}`;
        }
        return `${c.label}: ${c.material}`;
    });

    const newImage = {
        id: imageId,
        url: imageUrl,
        timestamp: Timestamp.now(),
        isOriginal: false,
        changes: changeDescriptions
    };

    await db.collection('projects').doc(projectId).update({
        images: FieldValue.arrayUnion(newImage),
        currentImageId: imageId,
        lastSaved: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    });
}

/**
 * Update Bill of Quantities for sponsored products
 */
export async function updateBOQ(
    projectId: string,
    changes: RenderChange[]
): Promise<void> {
    if (!db) {
        console.log('[Firebase] Mocking updateBOQ (no credentials)');
        return;
    }

    const sponsoredChanges = changes.filter(c => c.sponsoredProductId);

    if (sponsoredChanges.length === 0) return;

    // Fetch sponsored product details
    for (const change of sponsoredChanges) {
        if (!change.sponsoredProductId) continue;

        // Get product from sponsored_materials collection
        const productDoc = await db.collection('sponsored_materials').doc(change.sponsoredProductId).get();

        if (!productDoc.exists) continue;

        const product = productDoc.data() as SponsoredProduct;

        // Calculate estimated quantity (simplified - would need polygon area in real impl)
        const estimatedCoverage = 100; // sqft placeholder
        const estimatedQuantity = product.coverage ? Math.ceil(estimatedCoverage / product.coverage) : 1;
        const estimatedCost = product.price ? product.price * estimatedQuantity : 0;

        // Add to BOQ
        const boqItem = {
            productId: change.sponsoredProductId,
            productName: product.name,
            brand: product.brand,
            quantity: estimatedQuantity,
            unit: product.unit || 'unit',
            unitPrice: product.price || 0,
            totalPrice: estimatedCost,
            appliedTo: change.label,
            addedAt: FieldValue.serverTimestamp()
        };

        await db.collection('projects').doc(projectId).collection('boq').add(boqItem);
    }
}

/**
 * Get project data
 */
export async function getProject(projectId: string): Promise<any | null> {
    if (!db) return null;
    const doc = await db.collection('projects').doc(projectId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
}
