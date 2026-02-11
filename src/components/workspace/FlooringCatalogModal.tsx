import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Grid3X3, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlooringMaterial, FLOORING_CATALOG, MOCK_SPONSORED_FLOORING } from './types';

interface FlooringCatalogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (material: FlooringMaterial) => void;
    selectedMaterialId?: string;
    roomType?: string;
}

export const FlooringCatalogModal: React.FC<FlooringCatalogModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    selectedMaterialId,
    roomType = 'Living Room'
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'relevance' | 'price-low' | 'price-high' | 'name'>('relevance');
    const [hoveredMaterial, setHoveredMaterial] = useState<FlooringMaterial | null>(null);

    // Get all categories with counts
    const categories = useMemo(() => {
        return FLOORING_CATALOG.map(cat => ({
            name: cat.category,
            count: cat.items.length
        }));
    }, []);

    // Get total items count
    const totalItems = useMemo(() => {
        return FLOORING_CATALOG.reduce((acc, cat) => acc + cat.items.length, 0);
    }, []);

    // Filter materials based on search and category
    const filteredCatalog = useMemo(() => {
        return FLOORING_CATALOG
            .filter(cat => !selectedCategory || cat.category === selectedCategory)
            .map(cat => ({
                ...cat,
                items: cat.items.filter(item => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return item.name.toLowerCase().includes(query) ||
                        item.category.toLowerCase().includes(query);
                })
            }))
            .filter(cat => cat.items.length > 0);
    }, [selectedCategory, searchQuery]);

    // Count filtered results
    const filteredCount = useMemo(() => {
        return filteredCatalog.reduce((acc, cat) => acc + cat.items.length, 0);
    }, [filteredCatalog]);

    // Quick picks based on room type
    const quickPicks = useMemo(() => {
        const allItems = FLOORING_CATALOG.flatMap(cat => cat.items);
        return allItems.slice(0, 6); // First 6 items as quick picks
    }, []);

    if (!isOpen) return null;

    const modalContent = (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
            >
                {/* Backdrop - covers entire viewport */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Container - centered, 90vw x 85vh */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative bg-slate-950 rounded-2xl w-[90vw] max-w-[1400px] h-[85vh] 
                               border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Grid3X3 size={22} className="text-orange-400" />
                            Flooring Catalog
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Main Content - 2 Panel Layout */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Sidebar - Categories (20%) */}
                        <div className="w-[20%] min-w-[180px] border-r border-white/10 bg-white/[0.01] p-4 overflow-y-auto">
                            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                                Categories
                            </h3>

                            {/* All Category */}
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 transition-all flex items-center justify-between
                                    ${!selectedCategory
                                        ? 'bg-orange-500/20 text-orange-400'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                            >
                                <span>All</span>
                                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{totalItems}</span>
                            </button>

                            {/* Category List */}
                            {categories.map((cat) => (
                                <button
                                    key={cat.name}
                                    onClick={() => setSelectedCategory(cat.name)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 transition-all flex items-center justify-between
                                        ${selectedCategory === cat.name
                                            ? 'bg-orange-500/20 text-orange-400'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                                >
                                    <span>{cat.name}</span>
                                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{cat.count}</span>
                                </button>
                            ))}
                        </div>

                        {/* Right Content Area (80%) */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Search & Sort Bar */}
                            <div className="flex items-center gap-4 px-6 py-3 border-b border-white/10 bg-white/[0.02]">
                                <div className="flex-1 relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search flooring..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 
                                                   text-gray-200 text-sm placeholder:text-gray-500 focus:outline-none 
                                                   focus:border-orange-500/50"
                                    />
                                </div>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 
                                               text-sm focus:outline-none focus:border-orange-500/50 cursor-pointer"
                                >
                                    <option value="relevance">Sort: Relevance</option>
                                    <option value="name">Sort: Name</option>
                                    <option value="price-low">Sort: Price (Low to High)</option>
                                    <option value="price-high">Sort: Price (High to Low)</option>
                                </select>

                                {searchQuery && (
                                    <span className="text-sm text-gray-500">
                                        {filteredCount} results for "{searchQuery}"
                                    </span>
                                )}
                            </div>

                            {/* Scrollable Grid Area */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                {/* Quick Picks Section */}
                                {!selectedCategory && !searchQuery && (
                                    <div className="mb-8">
                                        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                            <Star size={14} className="text-amber-400" />
                                            Quick Picks for {roomType}
                                        </h3>
                                        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
                                            {quickPicks.map((material) => {
                                                const isSelected = selectedMaterialId === material.id;
                                                return (
                                                    <button
                                                        key={`quick-${material.id}`}
                                                        onClick={() => onSelect(material)}
                                                        className={`flex-shrink-0 w-36 p-3 rounded-xl border transition-all text-left
                                                            ${isSelected
                                                                ? 'border-orange-500 bg-orange-500/10'
                                                                : 'border-white/10 hover:border-orange-500/30 bg-white/[0.03] hover:bg-white/[0.05]'}`}
                                                    >
                                                        <div className="aspect-square rounded-lg bg-gradient-to-br from-amber-800/40 to-stone-600/40 
                                                                        mb-2 flex items-center justify-center">
                                                            <Grid3X3 size={28} className="text-amber-300/60" />
                                                        </div>
                                                        <p className="text-xs text-gray-200 font-medium truncate">{material.name}</p>
                                                        <p className="text-[10px] text-gray-500 capitalize">{material.category}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Featured Sponsored Materials */}
                                {!selectedCategory && !searchQuery && (
                                    <div className="mb-8">
                                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                                            Featured Materials
                                        </h3>
                                        <div className="grid grid-cols-4 gap-4">
                                            {MOCK_SPONSORED_FLOORING.map((flooring) => (
                                                <button
                                                    key={flooring.id}
                                                    onClick={() => onSelect({
                                                        id: flooring.id,
                                                        name: flooring.name,
                                                        category: flooring.category
                                                    })}
                                                    className="group relative p-4 rounded-xl border border-white/10 
                                                               hover:border-orange-500/30 bg-white/[0.03] hover:bg-white/[0.05] 
                                                               transition-all text-left hover:scale-[1.02]"
                                                >
                                                    {/* Featured Badge */}
                                                    <span className="absolute top-2 right-2 text-[8px] bg-amber-500/10 
                                                                     text-amber-400 px-1.5 py-0.5 rounded font-medium">
                                                        FEATURED
                                                    </span>

                                                    <div className="aspect-square rounded-lg bg-gradient-to-br from-slate-600/40 to-stone-500/40 
                                                                    mb-3 flex items-center justify-center">
                                                        <Grid3X3 size={32} className="text-slate-300/50" />
                                                    </div>

                                                    <p className="text-sm text-gray-200 font-medium truncate">{flooring.name}</p>
                                                    <p className="text-xs text-gray-500">{flooring.brand}</p>
                                                    <p className="text-sm text-orange-400 font-semibold mt-1">₹{flooring.price}/sq ft</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Main Catalog Grid */}
                                {filteredCatalog.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                        <Grid3X3 size={48} className="mb-4 opacity-30" />
                                        <p>No materials found matching your search.</p>
                                        <button
                                            onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                                            className="mt-2 text-orange-400 hover:underline text-sm"
                                        >
                                            Clear filters
                                        </button>
                                    </div>
                                ) : (
                                    filteredCatalog.map((category) => (
                                        <div key={category.category} className="mb-8">
                                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                                                <span>{category.category}</span>
                                                <span className="text-xs text-gray-600">({category.items.length} items)</span>
                                            </h3>
                                            <div className="grid grid-cols-4 xl:grid-cols-5 gap-4">
                                                {category.items.map((material) => {
                                                    const isSelected = selectedMaterialId === material.id;
                                                    return (
                                                        <button
                                                            key={material.id}
                                                            onClick={() => onSelect(material)}
                                                            onMouseEnter={() => setHoveredMaterial(material)}
                                                            onMouseLeave={() => setHoveredMaterial(null)}
                                                            className={`group relative p-4 rounded-xl border transition-all text-left
                                                                ${isSelected
                                                                    ? 'border-2 border-orange-500 bg-orange-500/10'
                                                                    : 'border-white/[0.08] hover:border-orange-500/30 bg-white/[0.03] hover:bg-white/[0.05]'}
                                                                hover:scale-[1.03]`}
                                                        >
                                                            {/* Texture Preview */}
                                                            <div className="aspect-square rounded-lg bg-gradient-to-br from-slate-700/50 to-stone-600/50 
                                                                            mb-3 flex items-center justify-center overflow-hidden">
                                                                <Grid3X3
                                                                    size={32}
                                                                    className={`${isSelected ? 'text-orange-400' : 'text-slate-400'} 
                                                                               group-hover:scale-110 transition-transform`}
                                                                />
                                                            </div>

                                                            {/* Material Info */}
                                                            <div className="flex items-center justify-between">
                                                                <div className="min-w-0">
                                                                    <p className="text-sm text-gray-200 font-medium truncate">{material.name}</p>
                                                                    <p className="text-xs text-gray-500 capitalize">{material.category}</p>
                                                                </div>
                                                                {isSelected && (
                                                                    <Check size={16} className="text-orange-400 shrink-0" />
                                                                )}
                                                            </div>

                                                            {/* Hover Select Button */}
                                                            <div className="absolute inset-x-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <div className="w-full py-2 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-medium text-center">
                                                                    Select
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-slate-950/80">
                        <p className="text-sm text-gray-500">
                            {filteredCount} materials available
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-lg bg-white/5 text-gray-300 text-sm 
                                           hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

    // Use React Portal to render modal at document body level
    return createPortal(modalContent, document.body);
};
