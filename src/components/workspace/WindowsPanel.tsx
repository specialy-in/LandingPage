import React, { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { OPENINGS_DATA, CatalogTab } from './catalogTypes';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// PROPS INTERFACE
// ============================================

interface WindowsPanelProps {
    onOpenCatalog?: (tab: CatalogTab) => void;
}

// ============================================
// HIDDEN SCROLLBAR STYLES
// ============================================
const scrollbarHideStyles: React.CSSProperties = {
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
};

// ============================================
// WINDOW TYPES WITH THUMBNAILS
// ============================================
const WINDOW_TYPES = [
    { id: 'casement', label: 'Casement', image: 'https://images.unsplash.com/photo-1506180376378-5711ccba9a4e?auto=format&fit=crop&w=120&q=80' },
    { id: 'sliding', label: 'Sliding', image: 'https://images.unsplash.com/photo-1516156008625-3a9d60c1dd9b?auto=format&fit=crop&w=120&q=80' },
    { id: 'bay', label: 'Bay', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=120&q=80' },
    { id: 'french', label: 'French', image: 'https://images.unsplash.com/photo-1508247967583-7d982ea01526?auto=format&fit=crop&w=120&q=80' },
    { id: 'fixed', label: 'Fixed', image: 'https://images.unsplash.com/photo-1530912234509-5a82200ec27d?auto=format&fit=crop&w=120&q=80' },
];

// ============================================
// WINDOWS PANEL COMPONENT
// ============================================

export const WindowsPanel: React.FC<WindowsPanelProps> = ({
    onOpenCatalog
}) => {
    const [selectedType, setSelectedType] = useState('casement');

    // Filter windows from catalog data based on selected type
    const windowProducts = useMemo(() => {
        const allWindows = OPENINGS_DATA.filter(item => item.type === 'window');
        // For now, show all windows - in production, filter by style/type
        return allWindows.slice(0, 4);
    }, [selectedType]);

    return (
        <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-xl">
            <div className="p-8 space-y-8 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={scrollbarHideStyles}>
                {/* Header */}
                <div>
                    <h3 className="text-2xl font-serif text-gray-100 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Windows
                    </h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Discover & Select
                    </p>
                </div>

                {/* Type Selector - Horizontal Scroll */}
                <div>
                    <div
                        className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
                        style={scrollbarHideStyles}
                    >
                        {WINDOW_TYPES.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={`flex flex-col items-center gap-2 flex-shrink-0 transition-all duration-200
                                    ${selectedType === type.id ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}
                            >
                                <div className={`w-[60px] h-[60px] rounded-full overflow-hidden border-2 transition-all
                                    ${selectedType === type.id
                                        ? 'border-orange-500 shadow-[0_0_16px_rgba(249,115,22,0.4)]'
                                        : 'border-white/10 hover:border-white/30'}`}
                                >
                                    <img
                                        src={type.image}
                                        alt={type.label}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className={`text-[10px] font-medium uppercase tracking-wide
                                    ${selectedType === type.id ? 'text-orange-400' : 'text-gray-500'}`}>
                                    {type.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-white/[0.05]" />

                {/* Recommended Grid with Animation */}
                <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                        Recommended for You
                    </h4>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedType}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {windowProducts.map((item) => (
                                <button
                                    key={item.id}
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
                    onClick={() => onOpenCatalog?.('windows-doors')}
                    className="w-full py-4 px-5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-gray-300 
                               flex justify-between items-center hover:bg-white/[0.04] hover:border-orange-500/30 
                               transition-all group"
                >
                    <span className="text-sm font-medium">Browse Window Catalog</span>
                    <ChevronRight size={18} className="text-gray-500 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    );
};

export default WindowsPanel;
