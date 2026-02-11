import React, { useRef, ChangeEvent, useState, useEffect } from 'react';
import {
    Layers,
    Check,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    X,
    ZoomIn,
    ZoomOut,
    ArrowUp,
    ArrowDown,
    Maximize2,
    Package,
    Sparkles,
    Paintbrush,
    Upload,
    AlertTriangle,
    Trash2,
    ExternalLink,
    Calendar,
    Copy,
    Circle,
    Droplets,
    Shield,
    Clock
} from 'lucide-react';
import { Wall, QUICK_COLORS, MOCK_SPONSORED_PAINTS, PendingChanges, ProductPlacement, AICredits } from './types';
import { ToolType } from './LeftToolbar';
import { FlooringPanel } from './FlooringPanel';
import { WindowsPanel } from './WindowsPanel';
import { DoorsPanel } from './DoorsPanel';
import { ProductsPanel } from './ProductsPanel';
import { BOQPanel } from './BOQPanel';
import { HistoryPanel } from './HistoryPanel';
import { CatalogTab, OPENINGS_DATA } from './catalogTypes';
import { getFeaturedProducts } from '../../services/catalogService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { HexColorPicker } from 'react-colorful';
import { useCatalogStore } from '../../stores/useCatalogStore';

// ============================================
// HIDDEN SCROLLBAR STYLES
// ============================================
const scrollbarHideStyles: React.CSSProperties = {
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
};

// ============================================
// PROPS INTERFACE
// ============================================

interface RightPanelProps {
    activeTool: ToolType;
    hasImage: boolean;
    walls: Wall[];
    selectedWallId: string | null;
    pendingChanges: PendingChanges;
    onSelectWall: (id: string | null) => void;
    onUpdatePendingChange: (type: 'walls' | 'floor', id: string, data: any) => void;
    onClearFloorChange?: () => void;
    onOpenCatalog?: (tab: CatalogTab) => void;
    // Product Placement Props
    pendingPlacements?: ProductPlacement[];
    activePlacementId?: string | null;
    onSetActivePlacement?: (id: string | null) => void;
    onRemovePlacement?: (id: string) => void;
    onApplyPlacements?: () => void;
    // AI Editor Props
    aiCredits?: AICredits;
    aiBrushSize?: number;
    onAiBrushSizeChange?: (size: number) => void;
    aiPrompt?: string;
    onAiPromptChange?: (prompt: string) => void;
    aiPromptError?: string | null;
    aiMaskStrokes?: number[][];
    onClearAiMask?: () => void;
    aiReferencePreview?: string | null;
    onAiReferenceSelect?: (file: File) => void;
    onAiReferenceRemove?: () => void;
    onApplyAiEdit?: () => void;
    isAiApplying?: boolean;
    // General Apply Changes
    onApplyChanges?: () => void;
    isApplyingChanges?: boolean;
    // Room Context
    roomType?: string;
    // Smart Suggestions
    smartPlaceholder?: string;
    // Edit Success State
    editSuccess?: { prompt: string; time: number; creditUsed: boolean } | null;
    onClearEditSuccess?: () => void;
    // UI state for cursor control
    aiBrushActive?: boolean;
    onAiBrushActiveChange?: (active: boolean) => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const RightPanel: React.FC<RightPanelProps> = ({
    activeTool,
    hasImage,
    walls,
    selectedWallId,
    pendingChanges,
    onSelectWall,
    onUpdatePendingChange,
    onClearFloorChange,
    onOpenCatalog,
    // Product Placement
    pendingPlacements = [],
    activePlacementId,
    onSetActivePlacement,
    onRemovePlacement,
    onApplyPlacements,
    // AI Editor
    aiCredits = { used: 0, limit: 5, resetDate: new Date().toISOString() },
    aiBrushSize = 50,
    onAiBrushSizeChange,
    aiPrompt = '',
    onAiPromptChange,
    aiPromptError,
    aiMaskStrokes = [],
    onClearAiMask,
    aiReferencePreview,
    onAiReferenceSelect,
    onAiReferenceRemove,
    onApplyAiEdit,
    isAiApplying = false,
    onApplyChanges,
    isApplyingChanges = false,
    roomType = 'Living Room',
    smartPlaceholder = '',
    editSuccess,
    onClearEditSuccess,
    aiBrushActive = false,
    onAiBrushActiveChange
}) => {
    const selectedWall = (Array.isArray(walls) ? walls : []).find(w => w.id === selectedWallId);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Local state for product selection
    const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null);
    // Local state for collapsible color picker
    const [showColorPicker, setShowColorPicker] = React.useState(false);
    // Local state for AI panel collapsible sections
    const [isReferenceExpanded, setIsReferenceExpanded] = useState(false);

    // Catalog store for sponsored products
    const products = useCatalogStore(state => state.products);
    const featuredWallFinishes = React.useMemo(() => getFeaturedProducts(products, 'wall_finish'), [products]);
    const getProduct = useCatalogStore(state => state.getProduct);

    // ============================================
    // EMPTY STATE - No Image
    // ============================================
    if (!hasImage) {
        return (
            <div className="w-[400px] bg-slate-950/80 backdrop-blur-xl border-l border-white/5 flex flex-col">
                <div className="flex-1 flex items-center justify-center p-10">
                    <div className="text-center">
                        <Layers size={56} className="mx-auto text-gray-700 mb-6" />
                        <p className="text-gray-400 text-base mb-2">No Image Loaded</p>
                        <p className="text-gray-600 text-sm">Upload a photo to start editing</p>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================
    // EMPTY STATE - No Tool Selected (POV Options)
    // ============================================
    const renderEmptyState = () => (
        <div className="p-8">
            <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-white mb-2">Change Perspective</h3>
                <p className="text-sm text-gray-500">Adjust how you view your room</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Wider View */}
                <button className="p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] 
                                   hover:border-orange-500/30 transition-all flex flex-col items-center gap-3 group">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center 
                                    group-hover:bg-orange-500/10 transition-colors">
                        <ZoomOut size={24} className="text-gray-400 group-hover:text-orange-400" />
                    </div>
                    <span className="text-sm text-gray-300 font-medium">Wider View</span>
                </button>

                {/* Closer View */}
                <button className="p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] 
                                   hover:border-orange-500/30 transition-all flex flex-col items-center gap-3 group">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center 
                                    group-hover:bg-orange-500/10 transition-colors">
                        <ZoomIn size={24} className="text-gray-400 group-hover:text-orange-400" />
                    </div>
                    <span className="text-sm text-gray-300 font-medium">Closer View</span>
                </button>

                {/* Higher Angle */}
                <button className="p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] 
                                   hover:border-orange-500/30 transition-all flex flex-col items-center gap-3 group">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center 
                                    group-hover:bg-orange-500/10 transition-colors">
                        <ArrowUp size={24} className="text-gray-400 group-hover:text-orange-400" />
                    </div>
                    <span className="text-sm text-gray-300 font-medium">Higher Angle</span>
                </button>

                {/* Lower Angle */}
                <button className="p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] 
                                   hover:border-orange-500/30 transition-all flex flex-col items-center gap-3 group">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center 
                                    group-hover:bg-orange-500/10 transition-colors">
                        <ArrowDown size={24} className="text-gray-400 group-hover:text-orange-400" />
                    </div>
                    <span className="text-sm text-gray-300 font-medium">Lower Angle</span>
                </button>
            </div>

            <div className="text-center">
                <p className="text-xs text-gray-600">
                    Or select a tool from the left to start editing
                </p>
            </div>
        </div>
    );

    // ============================================
    // WALL EDITOR
    // ============================================
    const renderWallEditor = () => {
        if (!selectedWall) {
            return (
                <div className="p-8">
                    <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                        <Layers size={22} className="text-orange-400" />
                        Wall Finishes
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-6">
                        Select a wall to customize its color, finish, and material.
                    </p>

                    {/* Marked Walls List */}
                    {Array.isArray(walls) && walls.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                Marked Walls
                            </h4>
                            {walls.map((wall) => (
                                <button
                                    key={wall.id}
                                    onClick={() => onSelectWall(wall.id)}
                                    className="w-full p-3 rounded-lg border border-white/10 bg-white/[0.02] 
                                               hover:bg-white/[0.05] hover:border-orange-500/30 transition-all 
                                               flex items-center gap-3 group"
                                >
                                    <div
                                        className="w-8 h-8 rounded-full ring-1 ring-white/20 shadow-sm"
                                        style={{ backgroundColor: wall.lastAppliedColor || wall.color || '#6B7280' }}
                                    />
                                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{wall.label}</span>
                                    <ChevronRight size={16} className="text-gray-600 ml-auto group-hover:text-orange-400 transition-colors" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        const pendingChange = pendingChanges.walls[selectedWall.id];
        const currentColor = pendingChange?.color || selectedWall.color || '#ffffff';
        const currentSponsoredId = pendingChange?.sponsoredProductId || selectedWall.sponsoredProductId;

        const handleColorSelect = (color: string, sponsoredProduct?: { id: string; name: string }) => {
            onUpdatePendingChange('walls', selectedWall.id, {
                color,
                sponsoredProductId: sponsoredProduct?.id || null,
                sponsoredProductName: sponsoredProduct?.name || null,
                label: selectedWall.label
            });
        };

        const copyHex = () => {
            navigator.clipboard.writeText(currentColor);
            toast.success('Color code copied');
        };

        return (
            <div className="flex flex-col h-full relative">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                }}>
                    {/* Header */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                                {selectedWall.label}
                            </h3>
                            <button
                                onClick={() => onSelectWall(null)}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-gray-500 
                                        hover:text-white hover:bg-white/5 transition-all"
                            >
                                <X size={12} />
                                Deselect
                            </button>
                        </div>
                    </div>

                    {/* Selected Product from Catalog */}
                    {(currentSponsoredId || (pendingChange as any)?.thumbnailUrl) && (() => {
                        const storeProduct = currentSponsoredId ? getProduct(currentSponsoredId) : null;
                        // Fallback to pending change data if product not in store
                        const selectedProduct = storeProduct || {
                            name: pendingChange?.sponsoredProductName || 'Selected Finish',
                            brand: pendingChange?.material || 'Catalog',
                            price: 0,
                            thumbnailUrl: (pendingChange as any)?.thumbnailUrl || null,
                            unit: 'sq ft'
                        };

                        return (
                            <div className="space-y-3">
                                <h4 className="font-serif text-xs uppercase tracking-[0.2em] text-gray-100">
                                    Selected Finish
                                </h4>
                                <div className="p-4 rounded-xl border border-orange-500/50 bg-orange-500/5 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                                    <div className="flex items-start gap-4">
                                        {/* Thumbnail */}
                                        <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-gray-800">
                                            {selectedProduct.thumbnailUrl ? (
                                                <img
                                                    src={selectedProduct.thumbnailUrl}
                                                    alt={selectedProduct.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : currentColor ? (
                                                <div
                                                    className="w-full h-full"
                                                    style={{ backgroundColor: currentColor }}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-700" />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{selectedProduct.name}</p>
                                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-0.5">{selectedProduct.brand}</p>
                                            {selectedProduct.price > 0 && (
                                                <p className="text-sm font-semibold text-orange-400 mt-2">
                                                    ₹{selectedProduct.price}
                                                    <span className="text-gray-500 font-normal text-xs">/{selectedProduct.unit || 'sq ft'}</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => handleColorSelect(currentColor)}
                                            className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all"
                                            title="Remove selection"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {/* Applied Badge */}
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                                        <Check size={14} className="text-green-400" />
                                        <span className="text-xs text-green-400">Will be applied on render</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Color & Finish Section */}
                    <div className="space-y-6">
                        <h4 className="font-serif text-xs uppercase tracking-[0.2em] text-gray-100">
                            {currentSponsoredId ? 'Or Choose a Color' : 'Color & Finish'}
                        </h4>

                        {/* Quick Picks - Compact 24px Swatches */}
                        <div className="flex gap-2 flex-wrap">
                            {QUICK_COLORS.map((color) => (
                                <button
                                    key={color.hex}
                                    onClick={() => handleColorSelect(color.hex)}
                                    className={`w-6 h-6 rounded-full transition-all hover:scale-125
                                        ${currentColor === color.hex
                                            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                                            : 'ring-1 ring-white/10 hover:ring-white/40'}`}
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                />
                            ))}
                        </div>

                        {/* Custom Color Trigger */}
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5
                                           hover:bg-white/[0.06] hover:border-white/10 transition-all w-full"
                            >
                                <div
                                    className="w-8 h-8 rounded-lg border border-white/10 shadow-inner"
                                    style={{ backgroundColor: currentColor }}
                                />
                                <div className="flex-1 text-left">
                                    <p className="text-sm text-gray-300 font-mono">{currentColor.toUpperCase()}</p>
                                    <p className="text-[10px] text-gray-500">Custom Color</p>
                                </div>
                                <ChevronRight size={16} className={`text-gray-500 transition-transform ${showColorPicker ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Collapsible Color Picker */}
                            <AnimatePresence>
                                {showColorPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5">
                                            <HexColorPicker
                                                color={currentColor}
                                                onChange={(c) => handleColorSelect(c)}
                                                style={{ width: '100%', height: '140px' }}
                                            />
                                            <div className="flex items-center gap-2 mt-4 bg-black/20 p-2 rounded-lg border border-white/10">
                                                <input
                                                    type="text"
                                                    value={currentColor.toUpperCase()}
                                                    onChange={(e) => handleColorSelect(e.target.value)}
                                                    className="bg-transparent border-none text-sm text-gray-300 font-mono focus:outline-none flex-1 uppercase"
                                                />
                                                <button onClick={copyHex} className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors">
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Recommended Finishes - 2x2 Grid */}
                    <div className="space-y-4">
                        <h4 className="font-serif text-xs uppercase tracking-[0.2em] text-gray-100">
                            Recommended Finishes
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            {(featuredWallFinishes.length > 0 ? featuredWallFinishes.slice(0, 4) : MOCK_SPONSORED_PAINTS.slice(0, 4)).map((product) => {
                                const productId = product.id;
                                const isSelected = currentSponsoredId === productId;
                                const productPrice = 'price' in product ? product.price : 450;

                                return (
                                    <button
                                        key={productId}
                                        onClick={() => handleColorSelect(product.color || '#808080', { id: productId, name: product.name })}
                                        className={`rounded-xl border overflow-hidden transition-all
                                            ${isSelected
                                                ? 'border-orange-500 ring-1 ring-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.2)]'
                                                : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-orange-500/30'}`}
                                    >
                                        {/* Texture/Color Fill - 70% height */}
                                        <div className="h-20 relative">
                                            {product.thumbnailUrl ? (
                                                <img src={product.thumbnailUrl} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full" style={{ backgroundColor: product.color }} />
                                            )}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                                                    <Check size={12} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        {/* Info */}
                                        <div className="p-2 text-left bg-white/[0.02]">
                                            <p className="text-[10px] text-gray-400 font-medium truncate">{product.brand}</p>
                                            <p className="text-xs text-gray-500">₹{productPrice}/sq ft</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Browse Catalog Button */}
                        <button
                            onClick={() => onOpenCatalog?.('wall-finishes')}
                            className="w-full py-3 rounded-lg border border-white/10 text-gray-400 
                                       hover:text-white hover:border-white/20 hover:bg-white/[0.02]
                                       flex items-center justify-center gap-2 transition-all text-sm"
                        >
                            Browse Complete Catalog
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Custom Texture Upload - Secondary Action at Bottom */}
                    <div className="space-y-3 pb-8">
                        <h4 className="font-serif text-xs uppercase tracking-[0.2em] text-gray-500">
                            Custom Reference
                        </h4>
                        <div
                            className="p-4 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.01] 
                                       hover:border-orange-500/30 hover:bg-white/[0.02] transition-all cursor-pointer
                                       flex items-center gap-4"
                            onClick={() => onOpenCatalog?.('wall-finishes')}
                        >
                            <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center">
                                <Upload size={18} className="text-gray-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-400">Upload material reference</p>
                                <p className="text-xs text-gray-600">or drag and drop an image</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Scroll Gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent pointer-events-none" />
            </div>
        );
    };

    // ============================================
    // CUSTOM AI PANEL
    // ============================================
    const remainingCredits = aiCredits.limit - aiCredits.used;
    const resetDateFormatted = new Date(aiCredits.resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const canApplyAiEdit = aiMaskStrokes.length > 0 && aiPrompt.trim().length >= 10 && !aiPromptError && remainingCredits > 0;

    const handleReferenceFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onAiReferenceSelect) {
            onAiReferenceSelect(file);
        }
    };

    const renderAIPanel = () => {
        // Show success summary if edit just completed
        if (editSuccess) {
            return (
                <div className="p-6 overflow-y-auto" style={scrollbarHideStyles}>
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                            <Check size={32} className="text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                            Edit Applied!
                        </h3>
                        <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                            <p className="text-sm text-gray-300 mb-3">"{editSuccess.prompt}"</p>
                            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {editSuccess.time.toFixed(1)}s
                                </span>
                                <span>•</span>
                                <span>1 credit used</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-4">
                            Credits remaining: <span className="text-orange-400 font-medium">{remainingCredits}/{aiCredits.limit}</span>
                        </p>
                        <div className="flex gap-3 mt-6 justify-center">
                            <button
                                onClick={onClearEditSuccess}
                                className="px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 
                                         text-orange-400 hover:bg-orange-500 hover:text-white transition-all text-sm"
                            >
                                Make Another Edit
                            </button>
                            <button
                                onClick={onClearEditSuccess}
                                className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 
                                         hover:bg-white/5 hover:text-white transition-all text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="p-6 overflow-y-auto" style={scrollbarHideStyles}>
                {/* Header with Inline Credit Badge */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                        <Sparkles size={20} className="text-orange-400" />
                        Custom AI Editor
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Brush an area and describe the change</p>

                    {/* Minimal Credit Badge */}
                    <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs
                                   ${remainingCredits <= 1
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-white/[0.03] text-gray-400'}`}>
                        {remainingCredits <= 1 && <AlertTriangle size={12} />}
                        <span>Credits: {remainingCredits}/{aiCredits.limit}</span>
                        <span className="text-gray-600">•</span>
                        <span>Resets: {new Date(aiCredits.resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                </div>

                <div className="border-t border-white/5 my-4" />

                {/* Brush Tool - Collapsible */}
                <div className="mb-4">
                    <button
                        onClick={() => onAiBrushActiveChange?.(!aiBrushActive)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-white/[0.02] 
                                 border border-white/5 hover:bg-white/[0.04] transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <Paintbrush size={16} className="text-orange-400" />
                            <span className="text-sm text-gray-300">Mark Area to Edit</span>
                            {aiMaskStrokes.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px]">
                                    {aiMaskStrokes.length} stroke{aiMaskStrokes.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        {aiBrushActive ? (
                            <ChevronUp size={16} className="text-gray-500" />
                        ) : (
                            <ChevronDown size={16} className="text-gray-500" />
                        )}
                    </button>

                    <AnimatePresence>
                        {aiBrushActive && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4 px-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-gray-600 w-8">Size:</span>
                                        <input
                                            type="range"
                                            min="10"
                                            max="200"
                                            value={aiBrushSize}
                                            onChange={(e) => onAiBrushSizeChange?.(parseInt(e.target.value))}
                                            className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                                                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                                                       [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                                                       [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:cursor-pointer"
                                        />
                                        <span className="text-xs text-gray-400 w-10 text-right">{aiBrushSize}px</span>
                                    </div>
                                    <p className="text-[10px] text-gray-600">Paint on canvas to mark area</p>
                                    {aiMaskStrokes.length > 0 && (
                                        <button
                                            onClick={onClearAiMask}
                                            className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                            Clear Brush Marks
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="border-t border-white/5 my-4" />

                {/* Prompt Textarea */}
                <div className="mb-4">
                    <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                        Describe your edit
                    </label>
                    <textarea
                        value={aiPrompt}
                        onChange={(e) => onAiPromptChange?.(e.target.value)}
                        placeholder={smartPlaceholder ? `e.g., "${smartPlaceholder}"` : 'What should the AI do in the marked area?'}
                        maxLength={200}
                        className={`w-full min-h-[80px] max-h-[150px] px-4 py-3 rounded-xl bg-white/[0.03] border 
                                   text-gray-300 text-sm placeholder:text-gray-600 focus:outline-none 
                                   resize-y transition-colors
                                   ${aiPromptError
                                ? 'border-red-500/50 focus:border-red-500'
                                : aiPrompt.length >= 180
                                    ? 'border-yellow-500/50'
                                    : 'border-white/10 focus:border-orange-500/50'}`}
                    />
                    <div className="flex items-center justify-between mt-2">
                        {aiPromptError ? (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                                <AlertTriangle size={10} /> {aiPromptError}
                            </span>
                        ) : aiPrompt.length > 0 && aiPrompt.length < 10 ? (
                            <span className="text-xs text-gray-500">Min 10 characters</span>
                        ) : (
                            <span className="text-xs text-gray-600 opacity-0">placeholder</span>
                        )}
                        {aiPrompt.length > 0 && (
                            <span className={`text-xs ${aiPrompt.length >= 180 ? 'text-yellow-400' : 'text-gray-600'}`}>
                                {aiPrompt.length}/200
                            </span>
                        )}
                    </div>
                </div>

                <div className="border-t border-white/5 my-4" />

                {/* Reference Image - Collapsible */}
                <div className="mb-6">
                    {aiReferencePreview ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                            <img
                                src={aiReferencePreview}
                                alt="Reference"
                                className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-300 truncate">Reference Image</p>
                                <p className="text-[10px] text-gray-600">Helps AI understand style</p>
                            </div>
                            <button
                                onClick={onAiReferenceRemove}
                                className="p-1.5 rounded-md hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-3 text-sm text-gray-500 hover:text-orange-400 transition-colors"
                        >
                            <Upload size={16} />
                            <span>Add style reference (optional)</span>
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleReferenceFileChange}
                        className="hidden"
                    />
                </div>

                {/* Apply Button - Right Aligned, Minimal */}
                <div className="flex justify-end">
                    <button
                        onClick={onApplyAiEdit}
                        disabled={!canApplyAiEdit || isAiApplying}
                        className={`px-6 py-3 rounded-xl text-sm font-medium transition-all
                                   ${canApplyAiEdit && !isAiApplying
                                ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white'
                                : 'bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed'}`}
                    >
                        {isAiApplying ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                                Applying...
                            </span>
                        ) : (
                            <>Apply Custom Edit →</>
                        )}
                    </button>
                </div>
                {canApplyAiEdit && !isAiApplying && (
                    <p className="text-[10px] text-gray-600 text-right mt-2">Uses 1 credit</p>
                )}
            </div>
        );
    };

    // ============================================
    // PLACEMENT LIST (Product Placement Mode)
    // ============================================
    const renderPlacementList = () => {
        if (pendingPlacements.length === 0) return null;

        return (
            <div className="p-6 border-b border-white/5">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                    Products to Place
                </h4>
                <div className="space-y-3">
                    {pendingPlacements.map((placement) => {
                        const isActive = activePlacementId === placement.id;
                        return (
                            <div
                                key={placement.id}
                                onClick={() => onSetActivePlacement?.(isActive ? null : placement.id)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3
                                    ${isActive
                                        ? 'border-orange-500 bg-orange-500/10'
                                        : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                                    }`}
                            >
                                {/* Color Indicator */}
                                <div
                                    className="w-5 h-5 rounded-full shrink-0 ring-2 ring-white/20"
                                    style={{ backgroundColor: placement.color }}
                                />

                                {/* Thumbnail */}
                                {placement.thumbnail ? (
                                    <img
                                        src={placement.thumbnail}
                                        alt={placement.name}
                                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                                        <Package size={20} className="text-gray-600" />
                                    </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-200 font-medium truncate">{placement.name}</p>
                                    <p className="text-xs text-gray-500">{placement.brand}</p>
                                    <p className="text-xs text-orange-400 font-medium">₹{placement.price.toLocaleString()}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {placement.buyLink && (
                                        <a
                                            href={placement.buyLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-blue-400 transition-colors"
                                            title="Buy Link"
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemovePlacement?.(placement.id);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                                        title="Remove"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <p className="text-xs text-gray-600 mt-3 text-center">
                    Click a product to select it, then brush on the canvas to mark placement
                </p>

                {/* Apply Placements Button - Removed, moved to global ApplyChangesPill */}
            </div>
        );
    };

    // ============================================
    // TOOL CONTENT ROUTER
    // ============================================
    const renderToolContent = () => {
        switch (activeTool) {
            case 'walls':
                return renderWallEditor();
            case 'flooring':
                return (
                    <FlooringPanel
                        pendingChange={pendingChanges.floor}
                        onUpdateChange={(data) => {
                            if (data) {
                                onUpdatePendingChange('floor', 'floor', data);
                            } else if (onClearFloorChange) {
                                onClearFloorChange();
                            }
                        }}
                        onOpenCatalog={() => onOpenCatalog?.('flooring')}
                    />
                );
            case 'windows':
                return (
                    <WindowsPanel
                        onOpenCatalog={onOpenCatalog}
                    />
                );
            case 'doors':
                return (
                    <DoorsPanel
                        onOpenCatalog={onOpenCatalog}
                    />
                );
            case 'products':
                return (
                    <ProductsPanel
                        roomType={roomType}
                        onOpenCatalog={onOpenCatalog}
                        onSelectProduct={(productId) => setSelectedProductId(productId)}
                    />
                );
            case 'ai':
                return renderAIPanel();
            case 'boq':
                return (
                    <BOQPanel
                        onExport={() => toast.success('Exporting Spec Sheet...')}
                    />
                );
            case 'history':
                return (
                    <HistoryPanel
                        onUndo={(id) => toast.success(`Undoing action ${id}`)}
                    />
                );
            default:
                return renderEmptyState();
        }
    };

    return (
        <div
            className="w-[450px] bg-slate-950/80 backdrop-blur-xl border-l border-white/5 flex flex-col 
                       overflow-hidden relative h-full"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <div
                className="flex-1 overflow-y-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {/* Placement List - Always visible when products are pending */}
                {renderPlacementList()}

                {/* Tool-specific content with fade-slide transition */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTool || 'empty'}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="h-full"
                    >
                        {renderToolContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
