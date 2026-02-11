/**
 * Catalog Store (Zustand)
 * Holds the entire sponsored catalog in local memory for instant access
 */

import { create } from 'zustand';
import { SponsoredProduct, ProductCategory } from '../types/sponsoredCatalogTypes';
import {
    fetchFullCatalog,
    filterByCategory,
    getFeaturedProducts,
    searchProducts,
    resolveProduct
} from '../services/catalogService';

interface CatalogState {
    // Data
    products: SponsoredProduct[];
    isLoading: boolean;
    error: string | null;
    lastFetched: Date | null;

    // Actions
    fetchCatalog: () => Promise<void>;

    // Selectors (computed from products)
    getByCategory: (category: ProductCategory) => SponsoredProduct[];
    getFeatured: (category?: ProductCategory) => SponsoredProduct[];
    search: (term: string) => SponsoredProduct[];
    getProduct: (id: string) => SponsoredProduct | null;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
    // Initial state
    products: [],
    isLoading: false,
    error: null,
    lastFetched: null,

    // Fetch entire catalog
    fetchCatalog: async () => {
        // Skip if already loaded and less than 5 minutes old
        const { lastFetched, products } = get();
        if (lastFetched && products.length > 0) {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (lastFetched > fiveMinutesAgo) {
                console.log('📦 Using cached catalog');
                return;
            }
        }

        set({ isLoading: true, error: null });

        try {
            const products = await fetchFullCatalog();
            set({
                products,
                isLoading: false,
                lastFetched: new Date()
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch catalog',
                isLoading: false
            });
        }
    },

    // Get products by category
    getByCategory: (category: ProductCategory) => {
        return filterByCategory(get().products, category);
    },

    // Get featured products
    getFeatured: (category?: ProductCategory) => {
        return getFeaturedProducts(get().products, category);
    },

    // Search products
    search: (term: string) => {
        return searchProducts(get().products, term);
    },

    // Get single product by ID
    getProduct: (id: string) => {
        return resolveProduct(get().products, id);
    },
}));

/**
 * Hook to initialize catalog on component mount
 * Use this in Workspace or App root
 */
export const useInitCatalog = () => {
    const fetchCatalog = useCatalogStore(state => state.fetchCatalog);

    // Returns the fetch function to be called in useEffect
    return { initCatalog: fetchCatalog };
};
