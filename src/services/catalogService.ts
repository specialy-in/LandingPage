/**
 * Catalog Service
 * Handles fetching and caching of sponsored products from Firestore
 */

import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SponsoredProduct, ProductCategory } from '../types/sponsoredCatalogTypes';

const COLLECTION_NAME = 'sponsored_catalog';

/**
 * Fetch the entire catalog in a single getDocs call
 * This is efficient for small catalogs (100-500 items)
 */
export const fetchFullCatalog = async (): Promise<SponsoredProduct[]> => {
    try {
        const catalogRef = collection(db, COLLECTION_NAME);
        const q = query(catalogRef, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);

        const products: SponsoredProduct[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SponsoredProduct));

        console.log(`✅ Catalog loaded: ${products.length} products`);
        return products;
    } catch (error) {
        console.error('❌ Error fetching catalog:', error);
        throw error;
    }
};

/**
 * Filter products by category from a cached list
 */
export const filterByCategory = (
    products: SponsoredProduct[],
    category: ProductCategory
): SponsoredProduct[] => {
    return products.filter(p => p.category === category);
};

/**
 * Get featured products for "Quick Picks" section
 */
export const getFeaturedProducts = (
    products: SponsoredProduct[],
    category?: ProductCategory
): SponsoredProduct[] => {
    return products.filter(p =>
        p.featured && (category ? p.category === category : true)
    );
};

/**
 * Search products by name, brand, or tags
 */
export const searchProducts = (
    products: SponsoredProduct[],
    searchTerm: string
): SponsoredProduct[] => {
    const term = searchTerm.toLowerCase();
    return products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.tags.some(tag => tag.toLowerCase().includes(term))
    );
};

/**
 * Get a single product by ID from cache
 * Returns null if not found
 */
export const resolveProduct = (
    products: SponsoredProduct[],
    productId: string
): SponsoredProduct | null => {
    return products.find(p => p.id === productId) || null;
};
