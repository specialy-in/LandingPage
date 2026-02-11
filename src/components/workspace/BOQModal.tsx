import React, { useState, useMemo } from 'react';
import { X, Download, FileArchive, ExternalLink, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// TYPES
// ============================================

export interface BOQItem {
    id: string;
    sku: string;
    name: string;
    brand: string;
    thumbnail: string;
    category: 'fixed' | 'loose';
    type: 'wall_finish' | 'flooring' | 'window' | 'door' | 'furniture' | 'decor';
    quantity: number;
    unit: string;
    rate: number;
    buyLink?: string;
    // For wall finishes
    width?: number;
    height?: number;
}

interface BOQModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectName: string;
    selectedImageUrl?: string;
    selectedImageName?: string;
    items?: BOQItem[];
    onExportPDF?: () => void;
    onExportZIP?: () => void;
}

// ============================================
// MOCK DATA
// ============================================
const MOCK_BOQ_ITEMS: BOQItem[] = [
    {
        id: 'w1', sku: 'AP-ROYALE-001', name: 'Asian Paints Royale', brand: 'Asian Paints',
        thumbnail: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=60&q=80',
        category: 'fixed', type: 'wall_finish', quantity: 1, unit: 'sqft', rate: 65, width: 12, height: 10
    },
    {
        id: 'f1', sku: 'KAJ-VIT-002', name: 'Kajaria Vitrified', brand: 'Kajaria',
        thumbnail: 'https://images.unsplash.com/photo-1502005229766-93976a1773ab?auto=format&fit=crop&w=60&q=80',
        category: 'fixed', type: 'flooring', quantity: 220, unit: 'sqft', rate: 120
    },
    {
        id: 'fur1', sku: 'OSLO-001', name: 'Oslo Chair', brand: 'Urban Ladder',
        thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=60&q=80',
        category: 'loose', type: 'furniture', quantity: 3, unit: 'pcs', rate: 62271,
        buyLink: 'https://urbanladder.com'
    },
    {
        id: 'fur2', sku: 'OSLO-001', name: 'Oslo Chair', brand: 'Urban Ladder',
        thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=60&q=80',
        category: 'loose', type: 'furniture', quantity: 1, unit: 'pcs', rate: 62271,
        buyLink: 'https://urbanladder.com'
    },
    {
        id: 'dec1', sku: 'LAMP-001', name: 'Arc Floor Lamp', brand: 'Pepperfry',
        thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=60&q=80',
        category: 'loose', type: 'decor', quantity: 1, unit: 'pcs', rate: 8500,
        buyLink: 'https://pepperfry.com'
    }
];

// ============================================
// COMPONENT
// ============================================

export const BOQModal: React.FC<BOQModalProps> = ({
    isOpen,
    onClose,
    projectName,
    selectedImageUrl,
    selectedImageName = 'Render',
    items = MOCK_BOQ_ITEMS,
    onExportPDF,
    onExportZIP
}) => {
    // Local state for wall dimension overrides
    const [dimensionOverrides, setDimensionOverrides] = useState<Record<string, { width: number; height: number }>>({});

    // Group items by SKU and aggregate quantities
    const aggregatedItems = useMemo(() => {
        const grouped: Record<string, BOQItem & { totalQty: number }> = {};

        items.forEach(item => {
            if (grouped[item.sku]) {
                grouped[item.sku].totalQty += item.quantity;
            } else {
                grouped[item.sku] = { ...item, totalQty: item.quantity };
            }
        });

        return Object.values(grouped);
    }, [items]);

    // Separate into fixed and loose assets
    const fixedAssets = aggregatedItems.filter(i => i.category === 'fixed');
    const looseAssets = aggregatedItems.filter(i => i.category === 'loose');

    // Calculate amount for an item
    const calculateAmount = (item: BOQItem & { totalQty: number }) => {
        if (item.type === 'wall_finish') {
            const dims = dimensionOverrides[item.id] || { width: item.width || 10, height: item.height || 10 };
            return dims.width * dims.height * item.rate;
        }
        return item.totalQty * item.rate;
    };

    // Grand total
    const grandTotal = useMemo(() => {
        return [...fixedAssets, ...looseAssets].reduce((sum, item) => sum + calculateAmount(item), 0);
    }, [fixedAssets, looseAssets, dimensionOverrides]);

    const handleDimensionChange = (id: string, field: 'width' | 'height', value: string) => {
        const num = parseFloat(value) || 0;
        setDimensionOverrides(prev => ({
            ...prev,
            [id]: {
                width: field === 'width' ? num : (prev[id]?.width || 10),
                height: field === 'height' ? num : (prev[id]?.height || 10)
            }
        }));
    };

    const renderItemRow = (item: BOQItem & { totalQty: number }, index: number) => {
        const amount = calculateAmount(item);
        const isWallFinish = item.type === 'wall_finish';
        const dims = dimensionOverrides[item.id] || { width: item.width || 10, height: item.height || 10 };

        return (
            <motion.tr
                key={item.sku + index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
            >
                {/* Item */}
                <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 border border-white/10 flex-shrink-0">
                            <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{item.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{item.brand}</p>
                        </div>
                    </div>
                </td>

                {/* Qty / Dimensions */}
                <td className="py-3 px-4 text-center">
                    {isWallFinish ? (
                        <div className="flex items-center justify-center gap-1">
                            <input
                                type="number"
                                value={dims.width}
                                onChange={(e) => handleDimensionChange(item.id, 'width', e.target.value)}
                                className="w-12 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-center text-xs text-orange-300 focus:border-orange-500/50 outline-none"
                            />
                            <span className="text-gray-500 text-xs">×</span>
                            <input
                                type="number"
                                value={dims.height}
                                onChange={(e) => handleDimensionChange(item.id, 'height', e.target.value)}
                                className="w-12 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-center text-xs text-orange-300 focus:border-orange-500/50 outline-none"
                            />
                            <span className="text-[10px] text-gray-600">ft</span>
                        </div>
                    ) : (
                        <span className="text-sm text-gray-300">{item.totalQty} {item.unit}</span>
                    )}
                </td>

                {/* Rate */}
                <td className="py-3 px-4 text-right">
                    <span className="text-sm text-gray-400 font-mono">₹{item.rate.toLocaleString()}</span>
                    {isWallFinish && <span className="text-[10px] text-gray-600 block">/sqft</span>}
                </td>

                {/* Amount */}
                <td className="py-3 px-4 text-right">
                    <span className="text-sm text-white font-mono font-medium">₹{amount.toLocaleString()}</span>
                </td>

                {/* Buy Link */}
                <td className="py-3 px-4 text-center">
                    {item.buyLink ? (
                        <a
                            href={item.buyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-orange-500/20 text-gray-500 hover:text-orange-400 transition-colors inline-flex"
                        >
                            <ExternalLink size={14} />
                        </a>
                    ) : (
                        <span className="text-gray-700">—</span>
                    )}
                </td>
            </motion.tr>
        );
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative w-[90vw] max-w-6xl h-[85vh] bg-slate-950/95 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex"
                >
                    {/* Left: Image Preview */}
                    <div className="w-[400px] flex-shrink-0 border-r border-white/[0.06] bg-black/40 flex flex-col">
                        <div className="p-4 border-b border-white/[0.06]">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Selected Render</p>
                            <p className="text-sm text-white mt-1">{selectedImageName}</p>
                        </div>
                        <div className="flex-1 p-4">
                            {selectedImageUrl ? (
                                <img
                                    src={selectedImageUrl}
                                    alt={selectedImageName}
                                    className="w-full h-full object-contain rounded-xl border border-white/10"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/[0.02] rounded-xl border border-dashed border-white/10">
                                    <span className="text-gray-600 text-sm">No image selected</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: BOQ Table */}
                    <div className="flex-1 flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-white/[0.06] flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-serif text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Design Specification & Quote
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">{projectName}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                            {/* Fixed Assets */}
                            <div className="mb-8">
                                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    Fixed Assets
                                    <span className="text-gray-600">({fixedAssets.length})</span>
                                </h3>
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/[0.08]">
                                            <th className="text-left py-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Item</th>
                                            <th className="text-center py-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Qty / Dims</th>
                                            <th className="text-right py-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Rate</th>
                                            <th className="text-right py-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amt</th>
                                            <th className="text-center py-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Buy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fixedAssets.map((item, i) => renderItemRow(item, i))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Loose Assets */}
                            <div>
                                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    Loose Assets
                                    <span className="text-gray-600">({looseAssets.length})</span>
                                </h3>
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/[0.08]">
                                            <th className="text-left py-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Item</th>
                                            <th className="text-center py-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                                            <th className="text-right py-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Rate</th>
                                            <th className="text-right py-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amt</th>
                                            <th className="text-center py-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Buy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {looseAssets.map((item, i) => renderItemRow(item, i))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/[0.06] bg-black/30">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Grand Total</p>
                                    <p className="text-[10px] text-gray-600">Estimated quote</p>
                                </div>
                                <h2 className="text-3xl font-serif text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    ₹{grandTotal.toLocaleString()}
                                </h2>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={onExportPDF}
                                    className="flex-1 py-3 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                                >
                                    <Download size={18} />
                                    Download Client Proposal
                                </button>
                                <button
                                    onClick={onExportZIP}
                                    className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-colors border border-white/10"
                                >
                                    <FileArchive size={18} />
                                    Export Images
                                </button>
                            </div>

                            <p className="text-[9px] text-center text-gray-600 mt-4">
                                * Prices are estimated. Final quotes subject to Architect review.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
