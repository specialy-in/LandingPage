import sharp from 'sharp';
import { RenderChange } from './types.js';

// Colors for marking different edit types - bright and visible
const WALL_MARK_COLOR = '#FF6B00';  // Bright orange (very visible)
const FLOOR_MARK_COLOR = '#FFD700'; // Gold/yellow
const OPENING_MARK_COLOR = '#00B8D4'; // Cyan

/**
 * Creates a marked version of the image with colored polygons
 * indicating which areas to edit.
 */
export async function createMarkedImage(
    originalImageBuffer: Buffer,
    changes: RenderChange[],
    imageWidth: number,
    imageHeight: number
): Promise<Buffer> {
    // Generate SVG overlay with labels
    const svgOverlay = generateSvgOverlay(changes, imageWidth, imageHeight);

    // Composite SVG over original image
    const markedImage = await sharp(originalImageBuffer)
        .composite([
            {
                input: Buffer.from(svgOverlay),
                top: 0,
                left: 0,
            },
        ])
        .png()
        .toBuffer();

    return markedImage;
}

/**
 * Calculate polygon center for label placement
 */
function calculatePolygonCenter(points: number[]): { x: number; y: number } {
    let sumX = 0, sumY = 0;
    const n = points.length / 2;
    for (let i = 0; i < n; i++) {
        sumX += points[i * 2];
        sumY += points[i * 2 + 1];
    }
    return { x: sumX / n, y: sumY / n };
}

/**
 * Generates an SVG string containing the modification polygons with labels
 */
function generateSvgOverlay(
    changes: RenderChange[],
    width: number,
    height: number
): string {
    let wallIndex = 0;

    const polygons = changes.map((change, i) => {
        if (!change.polygonPoints || change.polygonPoints.length < 6) return '';

        const pointsStr = change.polygonPoints
            .reduce((acc, val, idx, arr) => {
                if (idx % 2 === 0) return acc + `${val},${arr[idx + 1]} `;
                return acc;
            }, '')
            .trim();

        let color: string;
        let label: string;

        if (change.type === 'wall') {
            wallIndex++;
            color = WALL_MARK_COLOR;
            label = `WALL ${wallIndex}`;
        } else if (change.type === 'floor') {
            color = FLOOR_MARK_COLOR;
            label = 'FLOOR';
        } else {
            color = OPENING_MARK_COLOR;
            label = 'OPENING';
        }

        const rgbaColor = hexToRgba(color, 0.5); // Semi-transparent fill
        const center = calculatePolygonCenter(change.polygonPoints);

        // Calculate font size based on polygon area (approximate)
        const fontSize = Math.min(Math.max(width / 20, 36), 72);

        return `
            <polygon points="${pointsStr}" fill="${rgbaColor}" stroke="${color}" stroke-width="4" />
            <text x="${center.x}" y="${center.y}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle" stroke="${color}" stroke-width="2">${label}</text>
        `;
    }).join('\n');

    return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        ${polygons}
    </svg>
    `;
}

/**
 * Convert hex color to rgba string
 */
function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Validates polygon coordinates are within image bounds
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
    const area = calculatePolygonArea(points);
    if (area < 1000) {
        return { valid: false, error: 'Polygon too small. Draw a larger area.' };
    }

    return { valid: true };
}

/**
 * Calculate polygon area using shoelace formula
 */
function calculatePolygonArea(points: number[]): number {
    let area = 0;
    const n = points.length / 2;

    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += points[i * 2] * points[j * 2 + 1];
        area -= points[j * 2] * points[i * 2 + 1];
    }

    return Math.abs(area / 2);
}
