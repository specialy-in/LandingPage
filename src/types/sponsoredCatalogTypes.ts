/**
 * Sponsored Catalog Types
 * Defines the schema for products in the `sponsored_catalog` Firestore collection
 */

import { Timestamp } from 'firebase/firestore';

/**
 * AI Metadata for helping Gemini maintain render accuracy
 */
export interface ProductAIMetadata {
    shininess?: number;      // 0-1 scale
    roughness?: number;      // 0-1 scale
    base_prompt?: string;    // e.g., "polished white marble"
    finish_type?: 'matte' | 'satin' | 'glossy' | 'polished' | 'textured';
}

/**
 * Product category types
 */
export type ProductCategory = 'flooring' | 'wall_finish' | 'gadget' | 'window' | 'door';

/**
 * Unit types for pricing
 */
export type ProductUnit = 'sq ft' | 'piece' | 'set' | 'linear ft';

/**
 * Main Sponsored Product interface
 * Maps to documents in `sponsored_catalog` collection
 */
export interface SponsoredProduct {
    id: string;              // SKU e.g., "kajaria-marble-001"
    name: string;            // Display name
    brand: string;           // Manufacturer/brand
    price: number;           // Price in ₹
    unit: ProductUnit;       // Billing unit
    category: ProductCategory;
    tags: string[];          // For filtering [kitchen, bathroom, luxury, modern]
    thumbnailUrl: string;    // 200x200 preview image
    textureUrl?: string;     // High-res 2K/4K texture (for materials)
    productUrl?: string;     // Direct buy link
    featured: boolean;       // Show in "Quick Picks" section
    ai_metadata?: ProductAIMetadata;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

/**
 * BOQ (Bill of Quantities) Item
 * Stored in `projects/{projectId}/boq` sub-collection
 */
export interface BOQItem {
    id: string;
    productId: string;       // Reference to sponsored_catalog
    quantity: number;        // Units needed
    calculatedPrice: number; // price * quantity
    addedAt: Timestamp;
    notes?: string;          // Optional user notes
}

/**
 * Canvas State Snapshot
 * Stored alongside each image version for state restoration
 */
export interface CanvasStateSnapshot {
    walls: Record<string, {
        polygonPoints: number[];
        productId?: string | null;
        color?: string;
    }>;
    floor?: {
        productId?: string | null;
        pattern?: string;
        finish?: string;
    };
    placements?: Array<{
        id: string;
        productId: string;
        x: number;        // Normalized 0-1
        y: number;        // Normalized 0-1
        scale?: number;
    }>;
}
