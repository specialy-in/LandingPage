/**
 * Project Service - Handles project-related Firestore operations
 */
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const ProjectService = {
    /**
     * Save surfaces/walls data to the project
     * @param projectId - The ID of the project
     * @param data - The data to update (e.g., walls, flooring)
     */
    saveSurfaces: async (projectId: string, data: any) => {
        try {
            const projectRef = doc(db, 'projects', projectId);
            await updateDoc(projectRef, {
                ...data,
                updatedAt: new Date()
            });
            console.log('✅ Project saved successfully');
        } catch (error) {
            console.error('❌ Error saving project:', error);
            throw error;
        }
    },

    /**
     * Get project details
     * @param projectId - The ID of the project
     */
    getProject: async (projectId: string) => {
        try {
            const projectRef = doc(db, 'projects', projectId);
            const snapshot = await getDoc(projectRef);
            if (snapshot.exists()) {
                return { id: snapshot.id, ...snapshot.data() };
            }
            return null;
        } catch (error) {
            console.error('❌ Error getting project:', error);
            throw error;
        }
    }
};
