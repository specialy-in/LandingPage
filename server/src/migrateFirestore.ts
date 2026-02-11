
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Initialize Firebase Admin
const credPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
if (!fs.existsSync(credPath)) {
    console.error('❌ Service account key not found at:', credPath);
    process.exit(1);
}

initializeApp({
    credential: cert(credPath),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const db = getFirestore();

async function migrateProjects() {
    console.log('🚀 Starting migration...');

    try {
        const projectsSnap = await db.collection('projects').get();
        console.log(`Found ${projectsSnap.size} projects to check.`);

        let migratedCount = 0;

        for (const doc of projectsSnap.docs) {
            const data = doc.data();
            const projectId = doc.id;
            const images = data.images || [];

            if (Array.isArray(images) && images.length > 0) {
                console.log(`\n📦 Migrating project ${projectId} (${images.length} images)...`);

                const batch = db.batch();

                // 1. Move images to subcollection
                for (const img of images) {
                    // Use image ID as doc ID, or generate one if missing
                    const imgId = img.id || `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const imgRef = db.collection('projects').doc(projectId).collection('images').doc(imgId);

                    batch.set(imgRef, {
                        ...img,
                        id: imgId, // Ensure ID is saved
                        migratedAt: FieldValue.serverTimestamp()
                    });
                }

                // 2. Remove 'images' array from main doc
                const projectRef = db.collection('projects').doc(projectId);
                batch.update(projectRef, {
                    images: FieldValue.delete(),
                    lastMigrated: FieldValue.serverTimestamp()
                });

                await batch.commit();
                console.log(`✅ Migrated ${projectId}`);
                migratedCount++;
            } else {
                console.log(`Skipping ${projectId} (no images array)`);
            }
        }

        console.log(`\n🎉 Migration complete! Migrated ${migratedCount} projects.`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

migrateProjects();
