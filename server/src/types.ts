// Shared types for the rendering API
export interface RenderChange {
    type: 'wall' | 'floor';
    wallId?: string;
    polygonPoints?: number[]; // [x1, y1, x2, y2, ...] for walls
    color?: string; // hex color for walls
    material?: string; // material name for floors
    sponsoredProductId?: string;
    sponsoredProductName?: string;
    label: string; // "Wall 1", "Floor"
}

export interface RenderRequest {
    projectId: string;
    currentImageUrl: string;
    changes: RenderChange[];
    canvasWidth: number;
    canvasHeight: number;
    imageWidth: number;
    imageHeight: number;
}

export interface RenderResponse {
    success: boolean;
    renderedImageUrl?: string;
    imageId?: string;
    renderTime?: number;
    error?: string;
    errorCode?: 'TIMEOUT' | 'SAFETY_FILTER' | 'INVALID_POLYGON' | 'QUOTA_EXCEEDED' | 'UNKNOWN';
}

export interface SponsoredProduct {
    id: string;
    name: string;
    brand: string;
    color: string;
    price?: number;
    unit?: string; // "per sqft", "per liter"
    coverage?: number; // sqft per liter for paint
}
