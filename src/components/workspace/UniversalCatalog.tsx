import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Star, ChevronDown, Filter, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CatalogTab,
    CatalogItem,
    CATALOG_TABS,
    getCatalogItemsByTab,
    getSponsoredItems,
    getItemsByRoomType,
    searchCatalog,
    WallFinish,
    ProductItem,
    OpeningItem,
    FlooringItem
} from './catalogTypes';
import { useCatalogStore } from '../../stores/useCatalogStore';

// ============================================
// COMPONENT PROPS
// ============================================

interface UniversalCatalogProps {
    isOpen: boolean;
    onClose: () => void;
    openToTab?: CatalogTab;
    roomType?: string;
    onSelectMaterial?: (item: CatalogItem) => void;
    onSelectProduct?: (item: CatalogItem) => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const UniversalCatalog: React.FC<UniversalCatalogProps> = ({
    isOpen,
    onClose,
    openToTab = 'flooring',
    roomType = 'Living Room',
    onSelectMaterial,
    onSelectProduct
}) => {
    const [activeTab, setActiveTab] = useState<CatalogTab>(openToTab);
    const [searchQuery, setSearchQuery] = useState('');

    // Reset state when tab changes
    const handleTabChange = (tab: CatalogTab) => {
        setActiveTab(tab);
        setSearchQuery('');
    };

    // Handle item selection
    const handleSelectItem = (item: CatalogItem) => {
        if (activeTab === 'products') {
            onSelectProduct?.(item);
        } else {
            onSelectMaterial?.(item);
        }
        onClose();
    };

    if (!isOpen) return null;

    const modalContent = (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl w-[95vw] max-w-[1600px] h-[90vh] 
                               border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-slate-950/50">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
                                🏠 Catalog <span className="text-gray-600 text-lg font-normal">/</span> <span className="text-orange-400">{CATALOG_TABS.find(t => t.id === activeTab)?.label}</span>
                            </h2>
                        </div>

                        {/* Universal Search */}
                        <div className="flex items-center gap-4">
                            <div className="relative w-96">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={`Search ${CATALOG_TABS.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 
                                               text-gray-200 text-sm placeholder:text-gray-500 focus:outline-none 
                                               focus:border-orange-500/50 transition-all"
                                />
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Main Content Layout */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Sidebar tabs */}
                        <div className="w-[260px] border-r border-white/10 bg-black/20 flex flex-col p-6 space-y-2">
                            {CATALOG_TABS.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`w-full text-left px-5 py-4 rounded-xl text-sm font-medium transition-all flex items-center gap-4
                                            ${isActive
                                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <Icon size={20} />
                                        <span>{tab.label}</span>
                                        {isActive && <ChevronRight size={16} className="ml-auto opacity-50" />}
                                    </button>
                                );
                            })}

                            <div className="mt-auto pt-6 border-t border-white/10">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-xs text-gray-400 mb-2">Need something else?</p>
                                    <button onClick={onClose} className="text-sm text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1">
                                        Use Custom Upload <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Specific View Content */}
                        <div className="flex-1 bg-gradient-to-br from-slate-900/50 to-slate-950/50 overflow-hidden">
                            {activeTab === 'wall-finishes' && (
                                <WallFinishesView
                                    roomType={roomType}
                                    onSelect={handleSelectItem}
                                    searchQuery={searchQuery}
                                />
                            )}
                            {activeTab === 'flooring' && (
                                <FlooringView
                                    roomType={roomType}
                                    onSelect={handleSelectItem}
                                    searchQuery={searchQuery}
                                />
                            )}
                            {activeTab === 'products' && (
                                <ProductsView
                                    roomType={roomType}
                                    onSelect={handleSelectItem}
                                    searchQuery={searchQuery}
                                />
                            )}
                            {activeTab === 'windows-doors' && (
                                <OpeningsView
                                    roomType={roomType}
                                    onSelect={handleSelectItem}
                                    searchQuery={searchQuery}
                                />
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};


// ============================================
// SHARED COMPONENTS
// ============================================

const SectionHeader: React.FC<{ title: string; count?: number; action?: React.ReactNode }> = ({ title, count, action }) => (
    <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-white flex items-center gap-3">
            {title}
            {count !== undefined && <span className="text-sm text-gray-500 font-normal">({count})</span>}
        </h3>
        {action}
    </div>
);

// ============================================
// WALL FINISHES VIEW
// ============================================

const WallFinishesView: React.FC<{ roomType: string; onSelect: (item: CatalogItem) => void; searchQuery: string }> = ({ roomType, onSelect, searchQuery }) => {
    const [filter, setFilter] = useState<'All' | 'Paints' | 'Wallpapers' | 'Textures'>('All');

    // Get real products from store - use stable selector pattern
    const products = useCatalogStore(state => state.products);
    const getByCategory = useCatalogStore(state => state.getByCategory);
    const storeProducts = useMemo(() => getByCategory('wall_finish'), [getByCategory, products]);

    // Map store products to WallFinish type
    const mappedStoreItems = useMemo(() => {
        if (storeProducts.length === 0) return getCatalogItemsByTab('wall-finishes'); // Fallback to mock

        return storeProducts.map(p => ({
            id: p.id,
            name: p.name,
            category: 'wall-finishes',
            subcategory: p.tags.find(t => ['Paints', 'Wallpapers', 'Textures', 'Stone Cladding'].includes(t)) || 'Paints',
            brand: p.brand,
            price: p.price,
            priceUnit: p.unit,
            imageUrl: p.thumbnailUrl,
            isSponsored: true, // All store items are "sponsored"/premium
            type: (p.tags.find(t => ['paint', 'wallpaper', 'texture', 'cladding'].includes(t)) || 'paint') as any,
            finish: p.ai_metadata?.finish_type || 'matte'
        } as WallFinish));
    }, [storeProducts]);

    const filteredItems = useMemo(() => {
        let items = searchQuery ? searchCatalog(searchQuery, 'wall-finishes') : mappedStoreItems;
        if (filter !== 'All') {
            items = items.filter(i => i.subcategory === filter);
        }
        return items;
    }, [filter, searchQuery, mappedStoreItems]);

    const quickPicks = useMemo(() => getItemsByRoomType('wall-finishes', roomType).slice(0, 6), [roomType]);

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto">
            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-white/10 pb-4">
                {['All', 'Paints', 'Wallpapers', 'Textures'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all
                            ${filter === f
                                ? 'bg-white text-slate-900'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Quick Picks (Only on All tab and no search) */}
            {filter === 'All' && !searchQuery && (
                <div className="mb-10">
                    <SectionHeader title={`Popular for ${roomType}`} />
                    <div className="flex gap-4">
                        {quickPicks.map(item => (
                            <button
                                key={item.id}
                                onClick={() => onSelect(item)}
                                className="group relative w-28 h-28 rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-orange-500 transition-all"
                            >
                                <div
                                    className="w-full h-full"
                                    style={{ backgroundColor: (item as WallFinish).colorCode || '#333' }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-xs text-white font-medium truncate">{item.name}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Grid */}
            <SectionHeader title={filter === 'All' ? 'All Finishes' : `${filter}`} count={filteredItems.length} />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredItems.map(item => (
                    <CatalogCard key={item.id} item={item} onSelect={() => onSelect(item)} />
                ))}
            </div>
        </div>
    );
};

// ============================================
// FLOORING VIEW
// ============================================

const FlooringView: React.FC<{ roomType: string; onSelect: (item: CatalogItem) => void; searchQuery: string }> = ({ roomType, onSelect, searchQuery }) => {
    const [filter, setFilter] = useState<'All' | 'Wood' | 'Tiles' | 'Stone' | 'Vinyl'>('All');

    // Get real products from store - use stable selector pattern
    const products = useCatalogStore(state => state.products);
    const getByCategory = useCatalogStore(state => state.getByCategory);
    const storeProducts = useMemo(() => getByCategory('flooring'), [getByCategory, products]);

    // Map store products to FlooringItem type
    const mappedStoreItems = useMemo(() => {
        if (storeProducts.length === 0) return getCatalogItemsByTab('flooring'); // Fallback to mock

        return storeProducts.map(p => ({
            id: p.id,
            name: p.name,
            category: 'flooring',
            subcategory: p.tags.find(t => ['Wood', 'Tiles', 'Stone', 'Vinyl', 'Epoxy', 'Carpet'].includes(t)) || 'Wood',
            brand: p.brand,
            price: p.price,
            priceUnit: p.unit,
            imageUrl: p.thumbnailUrl,
            isSponsored: true,
            type: (p.tags.find(t => ['wood', 'tiles', 'stone', 'vinyl', 'epoxy', 'carpet'].includes(t)) || 'wood') as any,
            finish: p.ai_metadata?.finish_type || 'matte'
        } as FlooringItem));
    }, [storeProducts]);

    const filteredItems = useMemo(() => {
        let items = searchQuery ? searchCatalog(searchQuery, 'flooring') : mappedStoreItems;
        if (filter !== 'All') {
            items = items.filter(i => i.subcategory === filter);
        }
        return items;
    }, [filter, searchQuery, mappedStoreItems]);

    const subcategories = ['Wood', 'Tiles', 'Stone', 'Vinyl', 'Carpet'];

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto">
            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-white/10 pb-4">
                <button
                    onClick={() => setFilter('All')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all
                        ${filter === 'All'
                            ? 'bg-white text-slate-900'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                    All
                </button>
                {subcategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat as any)}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all
                            ${filter === cat
                                ? 'bg-white text-slate-900'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <CatalogCard key={item.id} item={item} onSelect={() => onSelect(item)} />
                ))}
            </div>
        </div>
    );
};

// ============================================
// PRODUCTS VIEW (Furniture & Decor)
// ============================================

const ProductsView: React.FC<{ roomType: string; onSelect: (item: CatalogItem) => void; searchQuery: string }> = ({ roomType, onSelect, searchQuery }) => {
    const [activeRoomFilter, setActiveRoomFilter] = useState(roomType);

    // Get real products from store - use stable selector pattern
    const products = useCatalogStore(state => state.products);
    const getByCategory = useCatalogStore(state => state.getByCategory);
    const storeProducts = useMemo(() => getByCategory('gadget'), [getByCategory, products]);

    // Map store products to ProductItem type
    const mappedStoreItems = useMemo(() => {
        if (storeProducts.length === 0) return getCatalogItemsByTab('products'); // Fallback to mock

        return storeProducts.map(p => {
            const subcategory = p.tags.find(t => ['Furniture', 'Lighting', 'Decor', 'Rugs', 'Art'].includes(t)) || 'Furniture';
            return {
                id: p.id,
                name: p.name,
                category: 'products',
                subcategory,
                type: subcategory.toLowerCase() as any,
                brand: p.brand,
                price: p.price,
                priceUnit: p.unit,
                imageUrl: p.thumbnailUrl,
                isSponsored: true,
                rating: 4.5,
                reviews: 10,
                dimensions: p.ai_metadata?.dimensions ? { ...p.ai_metadata.dimensions } : { width: 0, height: 0 } // Handle dimensions safely
            } as ProductItem;
        });
    }, [storeProducts]);

    const filteredItems = useMemo(() => {
        let items = searchQuery ? searchCatalog(searchQuery, 'products') : mappedStoreItems;
        // Filter by room type logic could assume store products don't have room type yet, so skip or use tags
        // For now, let's keep all items if no room type matches
        if (activeRoomFilter) {
            // items = items.filter(i => i.roomTypes?.includes(activeRoomFilter));
        }
        return items;
    }, [activeRoomFilter, searchQuery, mappedStoreItems]);

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto">
            {/* Room Filter Tabs */}
            <div className="flex gap-8 mb-8 border-b border-white/10">
                {['Living Room', 'Bedroom', 'Kitchen', 'Dining Room', 'Study'].map(room => (
                    <button
                        key={room}
                        onClick={() => setActiveRoomFilter(room)}
                        className={`pb-4 text-sm font-medium transition-all relative
                            ${activeRoomFilter === room ? 'text-orange-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        {room}
                        {activeRoomFilter === room && (
                            <motion.div layoutId="activeRoom" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400" />
                        )}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <ProductCard key={item.id} item={item as ProductItem} onSelect={() => onSelect(item)} />
                ))}
            </div>
        </div>
    );
};

// ============================================
// OPENINGS VIEW (Windows & Doors)
// ============================================

const OpeningsView: React.FC<{ roomType: string; onSelect: (item: CatalogItem) => void; searchQuery: string }> = ({ roomType, onSelect, searchQuery }) => {
    const [typeFilter, setTypeFilter] = useState<'All' | 'Window' | 'Door'>('All');

    // Get real products from store (fetch both windows and doors) - use stable selector pattern
    const products = useCatalogStore(state => state.products);
    const getByCategory = useCatalogStore(state => state.getByCategory);
    const windows = useMemo(() => getByCategory('window'), [getByCategory, products]);
    const doors = useMemo(() => getByCategory('door'), [getByCategory, products]);
    const storeProducts = useMemo(() => [...windows, ...doors], [windows, doors]);

    // Map store products to OpeningItem type
    const mappedStoreItems = useMemo(() => {
        if (storeProducts.length === 0) return getCatalogItemsByTab('windows-doors'); // Fallback to mock

        return storeProducts.map(p => ({
            id: p.id,
            name: p.name,
            category: 'windows-doors',
            subcategory: p.category === 'window' ? 'Windows' : 'Doors',
            brand: p.brand,
            price: p.price,
            priceUnit: p.unit,
            imageUrl: p.thumbnailUrl,
            isSponsored: true,
            type: p.category as any,
            dimensions: { width: 100, height: 200 } // Default dimensions object
        } as unknown as OpeningItem)); // Cast to unknown then OpeningItem to bypass mismatch if needed
    }, [storeProducts]);

    const filteredItems = useMemo(() => {
        let items = searchQuery ? searchCatalog(searchQuery, 'windows-doors') : mappedStoreItems;
        if (typeFilter === 'Window') items = items.filter(i => i.subcategory === 'Windows');
        if (typeFilter === 'Door') items = items.filter(i => i.subcategory === 'Doors');
        return items;
    }, [typeFilter, searchQuery, mappedStoreItems]);

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto">
            <div className="flex gap-3 mb-8">
                {['All', 'Window', 'Door'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTypeFilter(t as any)}
                        className={`px-6 py-2.5 rounded-lg border text-sm font-medium transition-all
                            ${typeFilter === t
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'}`}
                    >
                        {t}s
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <CatalogCard key={item.id} item={item} onSelect={() => onSelect(item)} />
                ))}
            </div>
        </div>
    );
};


// ============================================
// SHARED CARDS
// ============================================

const CatalogCard: React.FC<{ item: CatalogItem; onSelect: () => void }> = ({ item, onSelect }) => {
    const isColor = (item as WallFinish).colorCode;

    return (
        <button
            onClick={onSelect}
            className="group flex flex-col items-start text-left bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:bg-white/[0.04] hover:border-white/10 transition-all hover:-translate-y-1"
        >
            <div className="w-full aspect-square relative bg-white/5 overflow-hidden">
                {isColor ? (
                    <div className="w-full h-full" style={{ backgroundColor: (item as WallFinish).colorCode }} />
                ) : (
                    item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
                            <div className="w-12 h-12 rounded-full bg-white/5" />
                        </div>
                    )
                )}

                {item.isSponsored && (
                    <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg">
                        FEATURED
                    </span>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-black px-4 py-2 rounded-lg font-medium text-sm transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        Select
                    </span>
                </div>
            </div>

            <div className="p-4 w-full">
                <div className="flex justify-between items-start mb-1">
                    <h4 className="text-gray-200 font-medium truncate pr-2">{item.name}</h4>
                </div>
                <p className="text-xs text-gray-500 mb-2">{item.brand}</p>
                <div className="flex items-center justify-between">
                    <p className="text-orange-400 font-semibold text-sm">₹{item.price?.toLocaleString()} <span className="text-xs font-normal text-gray-600"></span></p>
                </div>
            </div>
        </button>
    );
};

const FlooringCard: React.FC<{ item: FlooringItem; onSelect: () => void }> = ({ item, onSelect }) => (
    <button
        onClick={onSelect}
        className="group relative h-64 rounded-2xl overflow-hidden border border-white/10 hover:border-orange-500/50 transition-all text-left"
    >
        {/* Background Image/Preview */}
        <div className="absolute inset-0 bg-gray-800">
            {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt={item.name} />}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="relative h-full p-5 flex flex-col justify-end">
            <div className="mb-auto">
                {item.isSponsored && (
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-1 rounded inline-block mb-2">
                        PREMIUM
                    </span>
                )}
            </div>

            <h4 className="text-xl font-bold text-white mb-1">{item.name}</h4>
            <p className="text-sm text-gray-300 mb-3">{item.brand}</p>

            <div className="flex items-center justify-between border-t border-white/20 pt-3 opacity-80 group-hover:opacity-100 transition-opacity">
                <p className="text-orange-400 font-bold">₹{item.price}<span className="text-xs text-gray-400 font-normal">/sqft</span></p>
                <ChevronRight size={18} className="text-white transform group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    </button>
);

const ProductCard: React.FC<{ item: ProductItem; onSelect: () => void }> = ({ item, onSelect }) => (
    <button
        onClick={onSelect}
        className="group flex flex-col bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:bg-white/[0.04] transition-all hover:scale-[1.01]"
    >
        <div className="relative aspect-[4/3] bg-white/5 overflow-hidden">
            {item.imageUrl ? (
                <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-gray-600 font-medium opacity-20 text-4xl">{item.subcategory[0]}</div>
                </div>
            )}

            {item.rating && (
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-white font-medium">{item.rating}</span>
                </div>
            )}
        </div>

        <div className="p-4 text-left">
            <h4 className="text-gray-200 font-medium truncate mb-1">{item.name}</h4>
            <p className="text-xs text-gray-500 mb-3">{item.brand}</p>
            <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-white">₹{item.price?.toLocaleString()}</span>
                <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded">Select</span>
            </div>
        </div>
    </button>
);

export default UniversalCatalog;
