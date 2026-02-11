
import { useState, useEffect, useRef, useCallback } from 'react';
import { ProjectService } from '../services/projectService';
import { debounce } from 'lodash';


type SaveStatus = 'saved' | 'saving' | 'offline';

export function useAutoSave(projectId: string | undefined, initialSurfaces: any) {
    const [status, setStatus] = useState<SaveStatus>('saved');
    const [lastSaved, setLastSaved] = useState<Date>(new Date());

    // Ref to track if it's the initial load to avoid saving on mount
    const isFirstRender = useRef(true);
    const surfacesRef = useRef(initialSurfaces);

    // Stable debounced save function
    const debouncedSaveRef = useRef(
        debounce(async (projectIdToSave: string, surfaces: any) => {
            try {
                setStatus('saving');

                // Race against a 5s timeout to prevent stuck spinner
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Save timeout')), 5000));
                await Promise.race([
                    ProjectService.saveSurfaces(projectIdToSave, surfaces),
                    timeoutPromise
                ]);

                setStatus('saved');
                setLastSaved(new Date());
            } catch (error) {
                console.error('Auto-save failed:', error);
                setStatus('offline');
                // Reset to saved after a delay to avoid stuck state
                setTimeout(() => setStatus('saved'), 3000);
            }
        }, 2000) // 2 second debounce
    );

    // Update ref when surfaces change
    useEffect(() => {
        surfacesRef.current = initialSurfaces;
    }, [initialSurfaces]);

    // Debounced save for surfaces
    const debouncedSaveSurfaces = useCallback((surfaces: any) => {
        if (!projectId) return;
        // Skip first render
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        debouncedSaveRef.current(projectId, surfaces);
    }, [projectId]);

    // Immediate save for critical items (like new products or completed polygons)
    const saveImmediate = async (action: () => Promise<void>) => {
        if (!projectId) return;
        try {
            setStatus('saving');

            // Race against a 5s timeout
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Save timeout')), 5000));
            await Promise.race([action(), timeoutPromise]);

            setStatus('saved');
            setLastSaved(new Date());
        } catch (error) {
            console.error('Immediate save failed:', error);
            setStatus('offline');
            // Reset to saved after a delay
            setTimeout(() => setStatus('saved'), 3000);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            debouncedSaveRef.current.cancel();
        };
    }, []);

    return {
        status,
        lastSaved,
        debouncedSaveSurfaces,
        saveImmediate
    };
}

