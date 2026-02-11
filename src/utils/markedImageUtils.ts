import Konva from 'konva';

/**
 * Creates a marked image with orange polygon overlay
 * Uses Konva for offscreen rendering
 */
export const createMarkedImage = async (
    baseImageUrl: string,
    polygonPoints: number[],  // Denormalized pixel coordinates
    imageWidth: number,
    imageHeight: number
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        // Create temporary container (offscreen)
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        document.body.appendChild(container);

        try {
            // Create Konva stage
            const stage = new Konva.Stage({
                container,
                width: imageWidth,
                height: imageHeight
            });

            const layer = new Konva.Layer();
            stage.add(layer);

            // Load base image
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.src = baseImageUrl;

            img.onload = () => {
                // Add base image
                const konvaImage = new Konva.Image({
                    image: img,
                    x: 0,
                    y: 0,
                    width: imageWidth,
                    height: imageHeight
                });
                layer.add(konvaImage);

                // Draw orange polygon overlay
                const polygon = new Konva.Line({
                    points: polygonPoints,
                    closed: true,
                    stroke: '#EA580C',
                    strokeWidth: 6,
                    fill: 'rgba(234, 88, 12, 0.5)',  // Semi-transparent orange
                    lineCap: 'round',
                    lineJoin: 'round'
                });
                layer.add(polygon);

                // Add "WALL" label at polygon center
                const centerX = polygonPoints.reduce((sum, p, i) => i % 2 === 0 ? sum + p : sum, 0) / (polygonPoints.length / 2);
                const centerY = polygonPoints.reduce((sum, p, i) => i % 2 === 1 ? sum + p : sum, 0) / (polygonPoints.length / 2);

                const label = new Konva.Text({
                    x: centerX,
                    y: centerY,
                    text: 'WALL',
                    fontSize: Math.min(imageWidth / 15, 72),
                    fontFamily: 'Arial',
                    fontStyle: 'bold',
                    fill: '#FFFFFF',
                    stroke: '#EA580C',
                    strokeWidth: 2,
                    offsetX: 40,
                    offsetY: 20
                });
                layer.add(label);

                layer.draw();

                // Export as blob
                stage.toBlob({
                    callback: (blob) => {
                        // Cleanup
                        stage.destroy();
                        document.body.removeChild(container);

                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to create marked image blob'));
                        }
                    },
                    mimeType: 'image/png',
                    quality: 1
                });
            };

            img.onerror = () => {
                stage.destroy();
                document.body.removeChild(container);
                reject(new Error('Failed to load base image for marking'));
            };
        } catch (error) {
            document.body.removeChild(container);
            reject(error);
        }
    });
};

/**
 * Validates polygon before saving
 */
export const validatePolygon = (
    points: number[],
    imageWidth: number,
    imageHeight: number
): { valid: boolean; error?: string } => {
    // Minimum 3 points (6 coordinates)
    if (points.length < 6) {
        return { valid: false, error: 'Polygon must have at least 3 points' };
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

    // Minimum area check (1000 pixels at original resolution)
    const minArea = 1000;
    if (area < minArea) {
        return { valid: false, error: 'Polygon is too small. Draw a larger area.' };
    }

    // Check bounds
    for (let i = 0; i < points.length; i += 2) {
        const x = points[i];
        const y = points[i + 1];
        if (x < 0 || x > imageWidth || y < 0 || y > imageHeight) {
            return { valid: false, error: 'Polygon extends outside image bounds' };
        }
    }

    return { valid: true };
};
