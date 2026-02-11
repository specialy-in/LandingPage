import React, { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { OPENINGS_DATA, CatalogTab } from './catalogTypes';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// PROPS INTERFACE
// ============================================

interface DoorsPanelProps {
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
// DOOR TYPES WITH THUMBNAILS
// ============================================
const DOOR_TYPES = [
    { id: 'main-entry', label: 'Main Entry', image: 'https://images.unsplash.com/photo-1563222543-debc5874244b?auto=format&fit=crop&w=120&q=80' },
    { id: 'flush', label: 'Flush', image: 'https://images.unsplash.com/photo-1533779283484-8ad4940aa3a8?auto=format&fit=crop&w=120&q=80' },
    { id: 'glass-sliding', label: 'Glass Sliding', image: 'https://images.unsplash.com/photo-1522869635100-1f4d061dd70d?auto=format&fit=crop&w=120&q=80' },
    { id: 'bifold', label: 'Bifold', image: 'https://images.unsplash.com/photo-1621293954908-907159247fc8?auto=format&fit=crop&w=120&q=80' },
    { id: 'arched', label: 'Arched', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=120&q=80' },
];

// ============================================
// DOORS PANEL COMPONENT
// ============================================

export const DoorsPanel: React.FC<DoorsPanelProps> = ({
    onOpenCatalog
}) => {
    const [selectedType, setSelectedType] = useState('main-entry');

    // Filter doors from catalog data based on selected type
    const doorProducts = useMemo(() => {
        const allDoors = OPENINGS_DATA.filter(item => item.type === 'door');
        // For now, show all doors - in production, filter by style/type
        return allDoors.slice(0, 4);
    }, [selectedType]);

    return (
        <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-xl">
            <div className="p-8 space-y-8 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={scrollbarHideStyles}>
                {/* Header */}
                <div>
                    <h3 className="text-2xl font-serif text-gray-100 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Doors
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
                        {DOOR_TYPES.map((type) => (
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
                            {doorProducts.map((item) => (
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
                    <span className="text-sm font-medium">Browse Door Catalog</span>
                    <ChevronRight size={18} className="text-gray-500 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    );
};

export default DoorsPanel;
