// Shared types for rendering (used by both frontend and server)
export interface RenderChange {
    type: 'wall' | 'floor';
    wallId?: string;
    polygonPoints?: number[];
    color?: string;
    material?: string;
    sponsoredProductId?: string;
    sponsoredProductName?: string;
    label: string;
}

export interface RenderResponse {
    success: boolean;
    renderedImageUrl?: string;
    imageId?: string;
    renderTime?: number;
    error?: string;
    errorCode?: 'TIMEOUT' | 'SAFETY_FILTER' | 'INVALID_POLYGON' | 'QUOTA_EXCEEDED' | 'UNKNOWN';
}
