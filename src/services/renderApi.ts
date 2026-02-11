import { RenderChange, RenderResponse } from './types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

/**
 * Call the backend render-changes API
 */
export async function renderChanges(
    projectId: string,
    currentImageUrl: string,
    changes: RenderChange[],
    canvasWidth: number,
    canvasHeight: number,
    imageWidth: number,
    imageHeight: number
): Promise<RenderResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/render-changes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectId,
                currentImageUrl,
                changes,
                canvasWidth,
                canvasHeight,
                imageWidth,
                imageHeight
            })
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.error || `HTTP ${response.status}`,
                errorCode: result.errorCode || 'UNKNOWN'
            };
        }

        return result as RenderResponse;

    } catch (error: any) {
        console.error('[API] Render error:', error);

        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return {
                success: false,
                error: 'Cannot connect to server. Make sure the backend is running.',
                errorCode: 'UNKNOWN'
            };
        }

        return {
            success: false,
            error: error.message || 'Unknown error',
            errorCode: 'UNKNOWN'
        };
    }
}

/**
 * Validate polygon before sending to backend
 */
export function validatePolygon(
    points: number[],
    imageWidth: number,
    imageHeight: number
): { valid: boolean; error?: string } {
    if (points.length < 6) {
        return { valid: false, error: 'Polygon must have at least 3 points' };
    }

    for (let i = 0; i < points.length; i += 2) {
        const x = points[i];
        const y = points[i + 1];

        if (x < 0 || x > imageWidth || y < 0 || y > imageHeight) {
            return { valid: false, error: 'Polygon extends outside image bounds' };
        }
    }

    // Calculate polygon area using shoelace formula
    let area = 0;
    const n = points.length / 2;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += points[i * 2] * points[j * 2 + 1];
        area -= points[j * 2] * points[i * 2 + 1];
    }
    area = Math.abs(area / 2);

    if (area < 1000) {
        return { valid: false, error: 'Polygon too small. Draw a larger area.' };
    }

    return { valid: true };
}
