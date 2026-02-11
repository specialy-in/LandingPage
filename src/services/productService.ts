/**
 * Product Service - Optimized for Firebase cost savings
 * Uses local caching and limit(20) to minimize Firestore reads
 */

import { collection, getDocs, query, limit, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

// --- Types ---
export interface SponsoredProduct {
    id: string;
    name: string;
    brand: string;
    price: number;
    category: string;
    roomTypes?: string[];
    thumbnailUrl: string;
    highResUrl: string;
    specs?: {
        dimensions?: string;
        material?: string;
    };
    commissionRate?: number;
    buyLink?: string;
}

// --- Local Cache ---
const productCache: Map<string, SponsoredProduct[]> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps: Map<string, number> = new Map();

/**
 * Fetch products with caching and pagination
 * @param category Optional category filter
 * @param maxItems Maximum items to fetch (default 20)
 */
export async function fetchCatalogProducts(
    category?: string,
    maxItems: number = 20
): Promise<SponsoredProduct[]> {
    const cacheKey = `products_${category || 'all'}_${maxItems}`;

    // Check cache validity
    const cachedTime = cacheTimestamps.get(cacheKey);
    if (cachedTime && Date.now() - cachedTime < CACHE_TTL_MS) {
        const cached = productCache.get(cacheKey);
        if (cached) {
            console.log('📦 Using cached products:', cached.length);
            return cached;
        }
    }

    // Fetch from Firestore
    console.log('🔥 Fetching products from Firestore...');
    const productsRef = collection(db, 'sponsored_products');

    let q = query(productsRef, limit(maxItems));

    if (category) {
        q = query(productsRef, where('category', '==', category), limit(maxItems));
    }

    try {
        const snapshot = await getDocs(q);
        const products: SponsoredProduct[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SponsoredProduct));

        // Update cache
        productCache.set(cacheKey, products);
        cacheTimestamps.set(cacheKey, Date.now());

        console.log(`✅ Fetched ${products.length} products`);
        return products;

    } catch (error) {
        console.error('❌ Error fetching products:', error);
        // Return cached data if available (stale cache fallback)
        const staleCache = productCache.get(cacheKey);
        if (staleCache) {
            console.log('⚠️ Using stale cache due to error');
            return staleCache;
        }
        return [];
    }
}

/**
 * Get a single product by ID (checks cache first)
 */
export async function getProductById(productId: string): Promise<SponsoredProduct | null> {
    // Check all cached categories for this product
    for (const [, products] of productCache) {
        const found = products.find(p => p.id === productId);
        if (found) return found;
    }

    // Fetch directly if not in cache
    try {
        const productsRef = collection(db, 'sponsored_products');
        const q = query(productsRef, where('id', '==', productId), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as SponsoredProduct;
        }
    } catch (error) {
        console.error('❌ Error fetching product by ID:', error);
    }

    return null;
}

/**
 * Clear the product cache (useful on demand)
 */
export function clearProductCache(): void {
    productCache.clear();
    cacheTimestamps.clear();
    console.log('🗑️ Product cache cleared');
}

/**
 * Transform SponsoredProduct to CatalogItem format for UI
 */
export function toCatalogItem(product: SponsoredProduct) {
    return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        imageUrl: product.thumbnailUrl,
        fullImageUrl: product.highResUrl,
        category: product.category,
        subcategory: product.category, // Default to category
        buyLink: product.buyLink || '#'
    };
}
