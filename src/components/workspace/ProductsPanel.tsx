import React, { useState, useMemo } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { PRODUCTS_DATA, CatalogTab } from './catalogTypes';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// PROPS INTERFACE
// ============================================

interface ProductsPanelProps {
    roomType?: string;
    onOpenCatalog?: (tab: CatalogTab) => void;
    onSelectProduct?: (productId: string) => void;
}

// ============================================
// HIDDEN SCROLLBAR STYLES
// ============================================
const scrollbarHideStyles: React.CSSProperties = {
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
};

// ============================================
// CATEGORY TYPES BY ROOM
// ============================================
const ROOM_CATEGORIES: Record<string, { id: string; label: string; image: string }[]> = {
    'Living Room': [
        { id: 'sofas', label: 'Sofas', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=120&q=80' },
        { id: 'tables', label: 'Tables', image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=120&q=80' },
        { id: 'rugs', label: 'Rugs', image: 'https://images.unsplash.com/photo-1575412621320-2032b5a54ac3?auto=format&fit=crop&w=120&q=80' },
        { id: 'lighting', label: 'Lighting', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=120&q=80' },
        { id: 'decor', label: 'Decor', image: 'https://images.unsplash.com/photo-1581783342308-f792ca11df53?auto=format&fit=crop&w=120&q=80' },
    ],
    'Bedroom': [
        { id: 'beds', label: 'Beds', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=120&q=80' },
        { id: 'storage', label: 'Storage', image: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=120&q=80' },
        { id: 'lighting', label: 'Lighting', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=120&q=80' },
        { id: 'rugs', label: 'Rugs', image: 'https://images.unsplash.com/photo-1509641771148-3a1379d7d91d?auto=format&fit=crop&w=120&q=80' },
        { id: 'decor', label: 'Decor', image: 'https://images.unsplash.com/photo-1581783342308-f792ca11df53?auto=format&fit=crop&w=120&q=80' },
    ],
    'default': [
        { id: 'furniture', label: 'Furniture', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=120&q=80' },
        { id: 'lighting', label: 'Lighting', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=120&q=80' },
        { id: 'rugs', label: 'Rugs', image: 'https://images.unsplash.com/photo-1575412621320-2032b5a54ac3?auto=format&fit=crop&w=120&q=80' },
        { id: 'decor', label: 'Decor', image: 'https://images.unsplash.com/photo-1581783342308-f792ca11df53?auto=format&fit=crop&w=120&q=80' },
        { id: 'art', label: 'Art', image: 'https://images.unsplash.com/photo-1579783902614-a3fb39279c79?auto=format&fit=crop&w=120&q=80' },
    ],
};

// ============================================
// PRODUCTS PANEL COMPONENT
// ============================================

export const ProductsPanel: React.FC<ProductsPanelProps> = ({
    roomType = 'Living Room',
    onOpenCatalog,
    onSelectProduct
}) => {
    const categories = ROOM_CATEGORIES[roomType] || ROOM_CATEGORIES['default'];
    const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || 'furniture');

    // Filter products based on selected category
    const filteredProducts = useMemo(() => {
        // Map category IDs to subcategories in PRODUCTS_DATA
        const categoryMap: Record<string, string[]> = {
            'sofas': ['Sofas', 'Seating'],
            'tables': ['Tables', 'Coffee Tables'],
            'rugs': ['Rugs'],
            'lighting': ['Lighting', 'Lamps'],
            'decor': ['Decor', 'Accessories'],
            'beds': ['Beds', 'Bedroom'],
            'storage': ['Storage', 'Wardrobes'],
            'furniture': ['Sofas', 'Tables', 'Seating'],
            'art': ['Art', 'Wall Art'],
        };

        const subcategories = categoryMap[selectedCategory] || [];
        let products = PRODUCTS_DATA.filter(p =>
            subcategories.some(sub => p.subcategory?.toLowerCase().includes(sub.toLowerCase()))
        );

        // If no matches, show top products
        if (products.length === 0) {
            products = PRODUCTS_DATA.slice(0, 4);
        }

        return products.slice(0, 4);
    }, [selectedCategory]);

    return (
        <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-xl">
            <div className="p-8 space-y-8 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={scrollbarHideStyles}>
                {/* Header */}
                <div>
                    <h3 className="text-2xl font-serif text-gray-100 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Products
                    </h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Curated for {roomType}
                    </p>
                </div>

                {/* Category Selector - Horizontal Scroll */}
                <div>
                    <div
                        className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
                        style={scrollbarHideStyles}
                    >
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex flex-col items-center gap-2 flex-shrink-0 transition-all duration-200
                                    ${selectedCategory === cat.id ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}
                            >
                                <div className={`w-[60px] h-[60px] rounded-full overflow-hidden border-2 transition-all
                                    ${selectedCategory === cat.id
                                        ? 'border-orange-500 shadow-[0_0_16px_rgba(249,115,22,0.4)]'
                                        : 'border-white/10 hover:border-white/30'}`}
                                >
                                    <img
                                        src={cat.image}
                                        alt={cat.label}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className={`text-[10px] font-medium uppercase tracking-wide
                                    ${selectedCategory === cat.id ? 'text-orange-400' : 'text-gray-500'}`}>
                                    {cat.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-white/[0.05]" />

                {/* Recommended Grid with Animation */}
                <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Sparkles size={12} className="text-orange-400" />
                        Editor's Picks
                    </h4>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedCategory}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {filteredProducts.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onSelectProduct?.(item.id)}
                                    className="group text-left"
                                >
                                    <div className="aspect-square rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] relative">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <p className="text-xs font-medium text-white truncate">{item.name}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-[9px] text-gray-400 font-bold uppercase">{item.brand}</span>
                                                <span className="text-[10px] text-orange-400 font-bold">₹{item.price?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {item.isSponsored && (
                                            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-orange-500/90 rounded text-[8px] font-bold text-white uppercase">
                                                Featured
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="border-t border-white/[0.05]" />

                {/* Catalog Button */}
                <button
                    onClick={() => onOpenCatalog?.('products')}
                    className="w-full py-4 px-5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-gray-300 
                               flex justify-between items-center hover:bg-white/[0.04] hover:border-orange-500/30 
                               transition-all group"
                >
                    <span className="text-sm font-medium">Browse Our Magical Finds</span>
                    <ChevronRight size={18} className="text-gray-500 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    );
};

export default ProductsPanel;
