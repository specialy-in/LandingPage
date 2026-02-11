import { Palette, Grid3X3, Sofa, DoorOpen } from 'lucide-react';

// ============================================
// CATALOG TAB TYPES
// ============================================

export type CatalogTab = 'wall-finishes' | 'flooring' | 'products' | 'windows-doors';

export interface CatalogTabConfig {
    id: CatalogTab;
    label: string;
    icon: typeof Palette;
    subcategories: string[];
}

export const CATALOG_TABS: CatalogTabConfig[] = [
    {
        id: 'wall-finishes',
        label: 'Wall Finishes',
        icon: Palette,
        subcategories: ['Paints', 'Wallpapers', 'Textures', 'Stone Cladding']
    },
    {
        id: 'flooring',
        label: 'Flooring',
        icon: Grid3X3,
        subcategories: ['Wood', 'Tiles', 'Stone', 'Vinyl', 'Epoxy', 'Carpet']
    },
    {
        id: 'products',
        label: 'Products',
        icon: Sofa,
        subcategories: ['Furniture', 'Lighting', 'Decor', 'Rugs', 'Art']
    },
    {
        id: 'windows-doors',
        label: 'Windows & Doors',
        icon: DoorOpen,
        subcategories: ['Windows', 'Doors', 'Frames', 'Hardware']
    }
];

// ============================================
// BASE CATALOG ITEM
// ============================================

export interface CatalogItem {
    id: string;
    name: string;
    category: string;
    subcategory: string;
    brand?: string;
    price?: number;
    priceUnit?: string;
    imageUrl?: string;
    isSponsored?: boolean;
    roomTypes?: string[];
    tags?: string[];
    buyLink?: string;
}

// ============================================
// WALL FINISHES
// ============================================

export interface WallFinish extends CatalogItem {
    type: 'paint' | 'wallpaper' | 'texture' | 'cladding';
    colorCode?: string;
    finish?: 'matte' | 'satin' | 'gloss' | 'eggshell';
    coverage?: string; // e.g., "100 sq ft/L"
}

export const WALL_FINISHES_DATA: WallFinish[] = [
    // Paints
    { id: 'wf1', name: 'Arctic White', category: 'wall-finishes', subcategory: 'Paints', type: 'paint', colorCode: '#FAFAFA', brand: 'Asian Paints', price: 450, priceUnit: 'L', finish: 'matte', isSponsored: true, roomTypes: ['Living Room', 'Bedroom', 'Kitchen'], imageUrl: 'https://images.unsplash.com/photo-1563603095063-562db49e6fb0?auto=format&fit=crop&w=400&q=80' },
    { id: 'wf2', name: 'Warm Beige', category: 'wall-finishes', subcategory: 'Paints', type: 'paint', colorCode: '#E8DCC8', brand: 'Asian Paints', price: 480, priceUnit: 'L', finish: 'satin', roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&w=400&q=80' },
    { id: 'wf3', name: 'Sage Green', category: 'wall-finishes', subcategory: 'Paints', type: 'paint', colorCode: '#9CAF88', brand: 'Berger', price: 520, priceUnit: 'L', finish: 'eggshell', roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1550978939-bf888df54dc8?auto=format&fit=crop&w=400&q=80' },
    { id: 'wf4', name: 'Navy Blue', category: 'wall-finishes', subcategory: 'Paints', type: 'paint', colorCode: '#1E3A5F', brand: 'Dulux', price: 580, priceUnit: 'L', finish: 'satin', isSponsored: true, roomTypes: ['Bedroom', 'Study'], imageUrl: 'https://images.unsplash.com/photo-1590756770519-c187320b9e83?auto=format&fit=crop&w=400&q=80' },
    { id: 'wf5', name: 'Terracotta', category: 'wall-finishes', subcategory: 'Paints', type: 'paint', colorCode: '#C75B39', brand: 'Nerolac', price: 490, priceUnit: 'L', finish: 'matte', roomTypes: ['Living Room', 'Dining Room'], imageUrl: 'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?auto=format&fit=crop&w=400&q=80' },
    { id: 'wf6', name: 'Charcoal Grey', category: 'wall-finishes', subcategory: 'Paints', type: 'paint', colorCode: '#36454F', brand: 'Asian Paints', price: 510, priceUnit: 'L', finish: 'matte', roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=400&q=80' },
    // Wallpapers
    { id: 'wf7', name: 'Geometric Grey', category: 'wall-finishes', subcategory: 'Wallpapers', type: 'wallpaper', brand: 'Nilaya', price: 2800, priceUnit: 'roll', isSponsored: true, roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=400&q=80' },
    { id: 'wf8', name: 'Floral Blush', category: 'wall-finishes', subcategory: 'Wallpapers', type: 'wallpaper', brand: 'Nilaya', price: 3200, priceUnit: 'roll', roomTypes: ['Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1522758971460-1d21eed7dc1d?auto=format&fit=crop&w=400&q=80' },
    { id: 'wf9', name: 'Tropical Leaves', category: 'wall-finishes', subcategory: 'Wallpapers', type: 'wallpaper', brand: 'Marshalls', price: 2500, priceUnit: 'roll', roomTypes: ['Living Room'], imageUrl: 'https://images.unsplash.com/photo-1534723328310-e82dad3af43f?auto=format&fit=crop&w=400&q=80' },
    // Textures
    { id: 'wf10', name: 'Venetian Plaster', category: 'wall-finishes', subcategory: 'Textures', type: 'texture', brand: 'San Marco', price: 850, priceUnit: 'sq ft', isSponsored: true, roomTypes: ['Living Room', 'Dining Room'], imageUrl: 'https://images.unsplash.com/photo-1562184552-e0a539946671?auto=format&fit=crop&w=400&q=80' },
    { id: 'wf11', name: 'Concrete Effect', category: 'wall-finishes', subcategory: 'Textures', type: 'texture', brand: 'Asian Paints', price: 680, priceUnit: 'sq ft', roomTypes: ['Living Room', 'Study'], imageUrl: 'https://images.unsplash.com/photo-1518098268026-62e5be2dd160?auto=format&fit=crop&w=400&q=80' },
    // Stone Cladding
    { id: 'wf12', name: 'Natural Stone Stack', category: 'wall-finishes', subcategory: 'Stone Cladding', type: 'cladding', brand: 'Stone Age', price: 1200, priceUnit: 'sq ft', roomTypes: ['Living Room'], imageUrl: 'https://images.unsplash.com/photo-1605218427360-6961d35b3c43?auto=format&fit=crop&w=400&q=80' },
];

// ============================================
// FLOORING
// ============================================

export interface FlooringItem extends CatalogItem {
    type: 'wood' | 'tiles' | 'stone' | 'vinyl' | 'epoxy' | 'carpet';
    dimensions?: string;
    finish?: string;
    durability?: 'light' | 'medium' | 'heavy';
    maintenance?: 'low' | 'medium' | 'high';
}

export const FLOORING_DATA: FlooringItem[] = [
    // Wood
    { id: 'fl1', name: 'European Oak', category: 'flooring', subcategory: 'Wood', type: 'wood', brand: 'Pergo', price: 850, priceUnit: 'sq ft', dimensions: '1200x200mm', finish: 'Natural Matte', durability: 'heavy', isSponsored: true, roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&w=400&q=80' },
    { id: 'fl2', name: 'American Walnut', category: 'flooring', subcategory: 'Wood', type: 'wood', brand: 'Pergo', price: 920, priceUnit: 'sq ft', dimensions: '1200x200mm', durability: 'heavy', roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=400&q=80' },
    { id: 'fl3', name: 'Bamboo Natural', category: 'flooring', subcategory: 'Wood', type: 'wood', brand: 'EcoTimber', price: 680, priceUnit: 'sq ft', durability: 'medium', roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1582042784742-99884523c959?auto=format&fit=crop&w=400&q=80' },
    { id: 'fl4', name: 'Teak Classic', category: 'flooring', subcategory: 'Wood', type: 'wood', brand: 'Woodcraft', price: 1100, priceUnit: 'sq ft', durability: 'heavy', roomTypes: ['Living Room'], imageUrl: 'https://images.unsplash.com/photo-1574519658597-96a92787d2ce?auto=format&fit=crop&w=400&q=80' },
    // Tiles
    { id: 'fl5', name: 'Carrara Marble', category: 'flooring', subcategory: 'Tiles', type: 'tiles', brand: 'Kajaria', price: 800, priceUnit: 'sq ft', dimensions: '600x600mm', finish: 'Polished', isSponsored: true, roomTypes: ['Living Room', 'Bathroom'], imageUrl: 'https://images.unsplash.com/photo-1598048148819-21cb0a8dc588?auto=format&fit=crop&w=400&q=80' },
    { id: 'fl6', name: 'Black Granite', category: 'flooring', subcategory: 'Tiles', type: 'tiles', brand: 'Johnson', price: 650, priceUnit: 'sq ft', dimensions: '600x600mm', finish: 'Polished', isSponsored: true, roomTypes: ['Kitchen', 'Bathroom'], imageUrl: 'https://images.unsplash.com/photo-1618221639263-165f17849e8a?auto=format&fit=crop&w=400&q=80' },
    { id: 'fl7', name: 'Terracotta Rustic', category: 'flooring', subcategory: 'Tiles', type: 'tiles', brand: 'Somany', price: 450, priceUnit: 'sq ft', dimensions: '300x300mm', roomTypes: ['Kitchen', 'Outdoor'], imageUrl: 'https://images.unsplash.com/photo-1563293729-1c9c84776735?auto=format&fit=crop&w=400&q=80' },
    { id: 'fl8', name: 'Mosaic Blue', category: 'flooring', subcategory: 'Tiles', type: 'tiles', brand: 'Nitco', price: 720, priceUnit: 'sq ft', dimensions: '300x300mm', isSponsored: true, roomTypes: ['Bathroom'], imageUrl: 'https://images.unsplash.com/photo-1584627124335-h75432d56149?auto=format&fit=crop&w=400&q=80' },
    // Stone
    { id: 'fl9', name: 'Travertine Beige', category: 'flooring', subcategory: 'Stone', type: 'stone', brand: 'Stone Gallery', price: 950, priceUnit: 'sq ft', dimensions: '600x600mm', roomTypes: ['Living Room'], imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80' },
    { id: 'fl10', name: 'Slate Grey', category: 'flooring', subcategory: 'Stone', type: 'stone', price: 780, priceUnit: 'sq ft', roomTypes: ['Outdoor', 'Bathroom'], imageUrl: 'https://images.unsplash.com/photo-1585250106297-c2573510e82c?auto=format&fit=crop&w=400&q=80' },
    // Vinyl
    { id: 'fl11', name: 'Luxury Vinyl Oak', category: 'flooring', subcategory: 'Vinyl', type: 'vinyl', brand: 'Armstrong', price: 380, priceUnit: 'sq ft', durability: 'heavy', maintenance: 'low', roomTypes: ['Kitchen', 'Office'], imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=80' },
    { id: 'fl12', name: 'Herringbone Grey', category: 'flooring', subcategory: 'Vinyl', type: 'vinyl', brand: 'Tarkett', price: 420, priceUnit: 'sq ft', roomTypes: ['Living Room', 'Office'], imageUrl: 'https://images.unsplash.com/photo-1622372738946-a287a22e8316?auto=format&fit=crop&w=400&q=80' },
    // Carpet
    { id: 'fl13', name: 'Plush Cream', category: 'flooring', subcategory: 'Carpet', type: 'carpet', brand: 'Shaw Floors', price: 550, priceUnit: 'sq ft', roomTypes: ['Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1563456075928-854728565251?auto=format&fit=crop&w=400&q=80' },
    { id: 'fl14', name: 'Berber Natural', category: 'flooring', subcategory: 'Carpet', type: 'carpet', brand: 'Mohawk', price: 480, priceUnit: 'sq ft', roomTypes: ['Bedroom', 'Office'], imageUrl: 'https://images.unsplash.com/photo-1596282679957-2cba4a889445?auto=format&fit=crop&w=400&q=80' },
];

// ============================================
// PRODUCTS (Furniture, Decor, etc.)
// ============================================

export interface ProductItem extends CatalogItem {
    type: 'furniture' | 'lighting' | 'decor' | 'rug' | 'art';
    dimensions?: { width: number; height: number; depth?: number };
    material?: string;
    rating?: number;
    reviewCount?: number;
}

export const PRODUCTS_DATA: ProductItem[] = [
    // Living Room Furniture
    { id: 'pr1', name: 'Oslo Lounge Chair', category: 'products', subcategory: 'Furniture', type: 'furniture', brand: 'HAY', price: 62271, dimensions: { width: 80, height: 85, depth: 80 }, material: 'Oak + Fabric', rating: 4.7, reviewCount: 358, isSponsored: true, roomTypes: ['Living Room'], imageUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=400&q=80' },
    { id: 'pr2', name: 'Mags Modular Sofa', category: 'products', subcategory: 'Furniture', type: 'furniture', brand: 'HAY', price: 185000, dimensions: { width: 260, height: 70, depth: 95 }, rating: 4.8, reviewCount: 124, roomTypes: ['Living Room'], imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80' },
    { id: 'pr3', name: 'Slit Table Round', category: 'products', subcategory: 'Furniture', type: 'furniture', brand: 'HAY', price: 28500, dimensions: { width: 45, height: 47 }, rating: 4.5, reviewCount: 89, roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=400&q=80' },
    // Bedroom
    { id: 'pr4', name: 'King Platform Bed', category: 'products', subcategory: 'Furniture', type: 'furniture', brand: 'Urban Ladder', price: 75000, dimensions: { width: 180, height: 40, depth: 200 }, rating: 4.6, reviewCount: 267, isSponsored: true, roomTypes: ['Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=400&q=80' },
    { id: 'pr5', name: 'Bedside Table Oak', category: 'products', subcategory: 'Furniture', type: 'furniture', brand: 'Pepperfry', price: 12500, dimensions: { width: 45, height: 55, depth: 40 }, rating: 4.4, reviewCount: 156, roomTypes: ['Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?auto=format&fit=crop&w=400&q=80' },
    // Lighting
    { id: 'pr6', name: 'Melt Pendant Light', category: 'products', subcategory: 'Lighting', type: 'lighting', brand: 'Tom Dixon', price: 95000, dimensions: { width: 50, height: 50 }, rating: 4.9, reviewCount: 78, isSponsored: true, roomTypes: ['Living Room', 'Dining Room'], imageUrl: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=400&q=80' },
    { id: 'pr7', name: 'Arco Floor Lamp', category: 'products', subcategory: 'Lighting', type: 'lighting', brand: 'FLOS', price: 185000, dimensions: { width: 30, height: 240 }, rating: 4.8, reviewCount: 45, roomTypes: ['Living Room'], imageUrl: 'https://images.unsplash.com/photo-1513506003011-3b611dd518fd?auto=format&fit=crop&w=400&q=80' },
    { id: 'pr8', name: 'Grasshopper Floor Lamp', category: 'products', subcategory: 'Lighting', type: 'lighting', brand: 'Gubi', price: 72000, rating: 4.7, reviewCount: 92, roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1507473888900-52e1adad54cd?auto=format&fit=crop&w=400&q=80' },
    // Decor
    { id: 'pr9', name: 'Ceramic Vase Set', category: 'products', subcategory: 'Decor', type: 'decor', brand: 'West Elm', price: 8500, rating: 4.3, reviewCount: 234, roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1581783342308-f792ca11df53?auto=format&fit=crop&w=400&q=80' },
    { id: 'pr10', name: 'Abstract Wall Art', category: 'products', subcategory: 'Art', type: 'art', brand: 'Art Studio', price: 15000, dimensions: { width: 90, height: 60 }, rating: 4.5, reviewCount: 112, roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb39279c79?auto=format&fit=crop&w=400&q=80' },
    // Rugs
    { id: 'pr11', name: 'Persian Wool Rug', category: 'products', subcategory: 'Rugs', type: 'rug', brand: 'Jaipur Rugs', price: 45000, dimensions: { width: 200, height: 300 }, rating: 4.8, reviewCount: 189, isSponsored: true, roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1575412621320-2032b5a54ac3?auto=format&fit=crop&w=400&q=80' },
    { id: 'pr12', name: 'Moroccan Shag Rug', category: 'products', subcategory: 'Rugs', type: 'rug', brand: 'The Rug Republic', price: 28000, dimensions: { width: 160, height: 230 }, rating: 4.6, reviewCount: 156, roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1509641771148-3a1379d7d91d?auto=format&fit=crop&w=400&q=80' },
];

// ============================================
// WINDOWS & DOORS
// ============================================

export interface OpeningItem extends CatalogItem {
    type: 'window' | 'door' | 'frame' | 'hardware';
    material?: 'wood' | 'upvc' | 'aluminum' | 'steel';
    style?: string;
    dimensions?: { width: number; height: number };
}

export const OPENINGS_DATA: OpeningItem[] = [
    // Windows
    { id: 'op1', name: 'Casement Window', category: 'windows-doors', subcategory: 'Windows', type: 'window', brand: 'Fenesta', price: 18000, material: 'upvc', style: 'Modern', isSponsored: true, roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1506180376378-5711ccba9a4e?auto=format&fit=crop&w=400&q=80' },
    { id: 'op2', name: 'Sliding Window', category: 'windows-doors', subcategory: 'Windows', type: 'window', brand: 'Fenesta', price: 15000, material: 'upvc', roomTypes: ['Kitchen', 'Bathroom'], imageUrl: 'https://images.unsplash.com/photo-1516156008625-3a9d60c1dd9b?auto=format&fit=crop&w=400&q=80' },
    { id: 'op3', name: 'Bay Window', category: 'windows-doors', subcategory: 'Windows', type: 'window', brand: 'NCL', price: 45000, material: 'aluminum', roomTypes: ['Living Room'], imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=400&q=80' },
    { id: 'op4', name: 'French Window', category: 'windows-doors', subcategory: 'Windows', type: 'window', brand: 'Encraft', price: 35000, material: 'wood', roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1508247967583-7d982ea01526?auto=format&fit=crop&w=400&q=80' },
    // Doors
    { id: 'op5', name: 'Panel Door Teak', category: 'windows-doors', subcategory: 'Doors', type: 'door', brand: 'Greenply', price: 25000, material: 'wood', style: 'Traditional', isSponsored: true, roomTypes: ['Living Room', 'Bedroom'], imageUrl: 'https://images.unsplash.com/photo-1621293954908-907159247fc8?auto=format&fit=crop&w=400&q=80' },
    { id: 'op6', name: 'Flush Door White', category: 'windows-doors', subcategory: 'Doors', type: 'door', brand: 'Century Ply', price: 12000, material: 'wood', style: 'Modern', roomTypes: ['Bedroom', 'Bathroom'], imageUrl: 'https://images.unsplash.com/photo-1533779283484-8ad4940aa3a8?auto=format&fit=crop&w=400&q=80' },
    { id: 'op7', name: 'Glass Sliding Door', category: 'windows-doors', subcategory: 'Doors', type: 'door', brand: 'Saint-Gobain', price: 55000, material: 'aluminum', roomTypes: ['Living Room', 'Balcony'], imageUrl: 'https://images.unsplash.com/photo-1522869635100-1f4d061dd70d?auto=format&fit=crop&w=400&q=80' },
    { id: 'op8', name: 'Security Door', category: 'windows-doors', subcategory: 'Doors', type: 'door', brand: 'Godrej', price: 28000, material: 'steel', isSponsored: true, roomTypes: ['Main Entry'], imageUrl: 'https://images.unsplash.com/photo-1563222543-debc5874244b?auto=format&fit=crop&w=400&q=80' },
    // Frames
    { id: 'op9', name: 'UPVC Frame System', category: 'windows-doors', subcategory: 'Frames', type: 'frame', brand: 'Fenesta', price: 8000, priceUnit: 'running ft', material: 'upvc', roomTypes: ['All'], imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80' },
    { id: 'op10', name: 'Aluminum Frame', category: 'windows-doors', subcategory: 'Frames', type: 'frame', brand: 'Jindal', price: 6500, priceUnit: 'running ft', material: 'aluminum', roomTypes: ['All'], imageUrl: 'https://images.unsplash.com/photo-1530912234509-5a82200ec27d?auto=format&fit=crop&w=400&q=80' },
    // Hardware
    { id: 'op11', name: 'Mortise Lock Set', category: 'windows-doors', subcategory: 'Hardware', type: 'hardware', brand: 'Yale', price: 4500, isSponsored: true, roomTypes: ['All'], imageUrl: 'https://images.unsplash.com/photo-1589824419996-527fb9af2293?auto=format&fit=crop&w=400&q=80' },
    { id: 'op12', name: 'Door Handle Brass', category: 'windows-doors', subcategory: 'Hardware', type: 'hardware', brand: 'Dorset', price: 2800, roomTypes: ['All'], imageUrl: 'https://images.unsplash.com/photo-1621271168128-4ce15e6b189a?auto=format&fit=crop&w=400&q=80' },
];

// ============================================
// ROOM TYPES
// ============================================

export const ROOM_TYPES = [
    'Living Room',
    'Bedroom',
    'Kitchen',
    'Bathroom',
    'Dining Room',
    'Study',
    'Office',
    'Balcony',
    'Outdoor'
] as const;

export type RoomType = typeof ROOM_TYPES[number];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getAllCatalogItems(): CatalogItem[] {
    return [
        ...WALL_FINISHES_DATA,
        ...FLOORING_DATA,
        ...PRODUCTS_DATA,
        ...OPENINGS_DATA
    ];
}

export function getCatalogItemsByTab(tab: CatalogTab): CatalogItem[] {
    switch (tab) {
        case 'wall-finishes': return WALL_FINISHES_DATA;
        case 'flooring': return FLOORING_DATA;
        case 'products': return PRODUCTS_DATA;
        case 'windows-doors': return OPENINGS_DATA;
        default: return [];
    }
}

export function getSponsoredItems(tab: CatalogTab): CatalogItem[] {
    return getCatalogItemsByTab(tab).filter(item => item.isSponsored);
}

export function getItemsByRoomType(tab: CatalogTab, roomType: string): CatalogItem[] {
    return getCatalogItemsByTab(tab).filter(item =>
        !item.roomTypes || item.roomTypes.includes(roomType) || item.roomTypes.includes('All')
    );
}

export function searchCatalog(query: string, tab?: CatalogTab): CatalogItem[] {
    const items = tab ? getCatalogItemsByTab(tab) : getAllCatalogItems();
    const q = query.toLowerCase();

    return items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.brand?.toLowerCase().includes(q) ||
        item.subcategory.toLowerCase().includes(q) ||
        item.tags?.some(tag => tag.toLowerCase().includes(q))
    );
}
