// Wall Types for Workspace
export interface Wall {
    id: string;
    label: string; // "Wall 1", "Wall 2", etc.
    polygonPoints: number[]; // Normalized 0-1 scale [x1, y1, x2, y2, ...]
    color?: string; // Current applied color (hex)
    sponsoredProductId?: string;
    sponsoredProductName?: string;
    createdOnImageId?: string; // Track which image the polygon was drawn on
    markedImageUrl?: string; // Firebase URL of marked reference image
    markedOnImageId?: string; // Which image version marked image was created from
    lastAppliedColor?: string; // Last color applied via Gemini
}

// Flooring Material Types
export interface FlooringMaterial {
    id: string;
    name: string;
    category: 'wood' | 'tiles' | 'vinyl' | 'stone' | 'carpet';
    textureUrl?: string;
}

export interface SponsoredFlooring {
    id: string;
    name: string;
    brand: string;
    category: string;
    price: number; // per sq ft in ₹
    textureUrl?: string;
    imageUrl?: string;
}

export interface FloorChange {
    materialId: string;
    materialName: string;
    type: 'quick' | 'sponsored' | 'custom';
    sponsoredProductId?: string;
    textureImageUrl?: string;
    customPrompt?: string;
    customImageFile?: File;
    price?: number;
    brand?: string;
}

// Quick picks flooring (generic materials)
export const QUICK_FLOORING: FlooringMaterial[] = [
    { id: 'qf1', name: 'Oak Wood', category: 'wood' },
    { id: 'qf2', name: 'Marble', category: 'tiles' },
    { id: 'qf3', name: 'Ceramic Tiles', category: 'tiles' },
    { id: 'qf4', name: 'Carpet', category: 'carpet' },
    { id: 'qf5', name: 'Concrete', category: 'stone' },
    { id: 'qf6', name: 'Laminate', category: 'vinyl' },
];

// Sponsored flooring products
export const MOCK_SPONSORED_FLOORING: SponsoredFlooring[] = [
    { id: 'sf1', name: 'Premium Marble', brand: 'Kajaria', category: 'tiles', price: 800 },
    { id: 'sf2', name: 'Tiles Premium', brand: 'Johnson', category: 'tiles', price: 650 },
    { id: 'sf3', name: 'Granite Premium', brand: 'Somany', category: 'stone', price: 900 },
    { id: 'sf4', name: 'Vitrified Tiles', brand: 'Nitco', category: 'tiles', price: 720 },
];

// Full catalog flooring data
export const FLOORING_CATALOG: { category: string; items: FlooringMaterial[] }[] = [
    {
        category: 'Wood Flooring',
        items: [
            { id: 'cat_oak', name: 'Oak', category: 'wood' },
            { id: 'cat_teak', name: 'Teak', category: 'wood' },
            { id: 'cat_walnut', name: 'Walnut', category: 'wood' },
            { id: 'cat_bamboo', name: 'Bamboo', category: 'wood' },
        ]
    },
    {
        category: 'Tiles',
        items: [
            { id: 'cat_marble', name: 'Marble', category: 'tiles' },
            { id: 'cat_granite', name: 'Granite', category: 'tiles' },
            { id: 'cat_ceramic', name: 'Ceramic', category: 'tiles' },
            { id: 'cat_porcelain', name: 'Porcelain', category: 'tiles' },
        ]
    },
    {
        category: 'Vinyl & Laminate',
        items: [
            { id: 'cat_vinyl_premium', name: 'Premium Vinyl', category: 'vinyl' },
            { id: 'cat_vinyl_standard', name: 'Standard Vinyl', category: 'vinyl' },
            { id: 'cat_laminate', name: 'Laminate', category: 'vinyl' },
        ]
    },
    {
        category: 'Natural Stone',
        items: [
            { id: 'cat_slate', name: 'Slate', category: 'stone' },
            { id: 'cat_limestone', name: 'Limestone', category: 'stone' },
            { id: 'cat_travertine', name: 'Travertine', category: 'stone' },
        ]
    },
];

// Pending Changes State Structure
export interface PendingChanges {
    walls: {
        [wallId: string]: {
            color: string;
            sponsoredProductId?: string;
            sponsoredProductName?: string;
            label: string;
        }
    };
    floor?: FloorChange;
    // Windows & Doors
    windows: { [windowId: string]: any };
    doors: { [doorId: string]: any };
}

export interface SponsoredPaint {
    id: string;
    name: string;
    brand: string;
    color: string; // hex
    imageUrl?: string;
    price?: number;
}

// Quick color palette
export const QUICK_COLORS = [
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Beige', hex: '#F5F5DC' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Sky Blue', hex: '#87CEEB' },
    { name: 'Sage Green', hex: '#9DC183' },
    { name: 'Blush Pink', hex: '#FFB6C1' },
];

// Mock sponsored paints
export const MOCK_SPONSORED_PAINTS: SponsoredPaint[] = [
    { id: 'sp1', name: 'Royal Luxury Emulsion', brand: 'Asian Paints', color: '#E8E4D9' },
    { id: 'sp2', name: 'Silk White', brand: 'Berger', color: '#FAFAFA' },
    { id: 'sp3', name: 'Matt Finish Ivory', brand: 'Dulux', color: '#FFFFF0' },
    { id: 'sp4', name: 'Premium Smooth', brand: 'Nerolac', color: '#F0EAD6' },
];

// ============================================
// PRODUCT PLACEMENT TYPES
// ============================================

// Color palette for brush strokes - each product gets a unique color
export const PLACEMENT_COLORS = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF'] as const;

export interface ProductPlacement {
    id: string; // Unique placement ID
    productId: string;
    name: string;
    brand: string;
    price: number;
    buyLink?: string;
    thumbnail?: string;
    productImageUrl?: string; // High-res image for AI
    color: string; // Assigned brush color from PLACEMENT_COLORS
    strokePoints: number[][]; // Array of strokes, each stroke is [x1, y1, x2, y2, ...]
}

// ============================================
// CUSTOM AI EDITOR TYPES
// ============================================

export interface AICredits {
    used: number;
    limit: number;
    resetDate: string; // ISO date string
}

export interface AIEditState {
    brushSize: number; // 10-200px
    maskStrokes: number[][]; // Array of strokes [x1, y1, x2, y2, ...]
    prompt: string;
    referenceImage: File | null;
    referencePreview: string | null;
}

// Validation result for AI prompts
export interface AIPromptValidation {
    valid: boolean;
    error?: string;
}
