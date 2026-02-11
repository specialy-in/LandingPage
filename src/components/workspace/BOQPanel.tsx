import React, { useState, useEffect } from 'react';
import { FileText, Download, Share2, Printer, ChevronRight, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

// ============================================
// TYPES
// ============================================

export interface BOQItem {
    id: string;
    name: string;
    thumbnail: string;
    specs: string;
    quantity: number;
    unit: string; // 'pcs' | 'sqft' | 'm'
    rate: number;
    category: 'Surfaces' | 'Openings' | 'Furniture' | 'Electrical' | 'Other';
}

interface BOQPanelProps {
    // In a real app, these would come from a store
    items?: BOQItem[];
    onExport?: () => void;
}

// ============================================
// MOCK DATA (If no props provided)
// ============================================
const MOCK_BOQ_ITEMS: BOQItem[] = [
    {
        id: 'w1',
        name: 'Asian Paints Royale',
        thumbnail: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=60&q=80',
        specs: 'Matte Finish - Morning Glory',
        quantity: 450,
        unit: 'sqft',
        rate: 65,
        category: 'Surfaces'
    },
    {
        id: 'f1',
        name: 'Kajaria Vitrified Tiles',
        thumbnail: 'https://images.unsplash.com/photo-1502005229766-93976a1773ab?auto=format&fit=crop&w=60&q=80',
        specs: '600x600mm - Marble Touch',
        quantity: 220,
        unit: 'sqft',
        rate: 120,
        category: 'Surfaces'
    },
    {
        id: 'win1',
        name: 'Fenesta Casement Window',
        thumbnail: 'https://images.unsplash.com/photo-1506180376378-5711ccba9a4e?auto=format&fit=crop&w=60&q=80',
        specs: '4x5ft - uPVC Frame',
        quantity: 2,
        unit: 'pcs',
        rate: 18000,
        category: 'Openings'
    },
    {
        id: 'fur1',
        name: 'Urban Ladder Sofa',
        thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=60&q=80',
        specs: '3-Seater - Grey Fabric',
        quantity: 1,
        unit: 'pcs',
        rate: 45000,
        category: 'Furniture'
    }
];

// ============================================
// COMPONENT
// ============================================

export const BOQPanel: React.FC<BOQPanelProps> = ({
    items = MOCK_BOQ_ITEMS,
    onExport
}) => {
    // Local state for quantities if we want to make them editable
    const [localItems, setLocalItems] = useState<BOQItem[]>(items);

    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    const handleQuantityChange = (id: string, newQty: string) => {
        const qty = parseFloat(newQty);
        if (isNaN(qty)) return;

        setLocalItems(prev => prev.map(item =>
            item.id === id ? { ...item, quantity: qty } : item
        ));
    };

    const calculateTotal = () => {
        return localItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    };

    const grandTotal = calculateTotal();

    return (
        <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-xl">
            {/* Valid for RightPanel container */}
            <div className="flex flex-col h-full">

                {/* HEAD */}
                <div className="p-6 border-b border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-serif text-white leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Bill of Quantities
                            </h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">
                                Estimate & Specifications
                            </p>
                        </div>
                    </div>
                </div>

                {/* TABLE HEADER */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-white/[0.04] border-b border-white/[0.06] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-1">#</div>
                    <div className="col-span-5">Item & Specs</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Rate</div>
                    <div className="col-span-2 text-right">Amt</div>
                </div>

                {/* SCROLLABLE LIST */}
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="p-2 space-y-1">
                        {localItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group"
                            >
                                {/* Index */}
                                <div className="col-span-1 text-[10px] text-gray-600 font-mono">
                                    {(index + 1).toString().padStart(2, '0')}
                                </div>

                                {/* Item Info */}
                                <div className="col-span-5 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-gray-800 overflow-hidden flex-shrink-0 border border-white/10">
                                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-gray-200 truncate">{item.name}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{item.specs}</p>
                                    </div>
                                </div>

                                {/* Qty (Editable) */}
                                <div className="col-span-2 flex items-center justify-center">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                        className="w-12 bg-black/40 border border-white/10 rounded px-1 py-1 text-center text-xs text-orange-300 focus:border-orange-500/50 outline-none"
                                    />
                                    <span className="text-[9px] text-gray-600 ml-1">{item.unit}</span>
                                </div>

                                {/* Rate */}
                                <div className="col-span-2 text-right text-xs text-gray-500 font-mono">
                                    {item.rate.toLocaleString()}
                                </div>

                                {/* Amount */}
                                <div className="col-span-2 text-right text-xs text-white font-mono font-medium">
                                    {(item.quantity * item.rate).toLocaleString()}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* FOOTER TOTALS */}
                <div className="p-6 bg-slate-950 border-t border-white/[0.06] space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Grand Total Estimate</p>
                            <p className="text-xs text-gray-600">Inclusive of all taxes</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-serif text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                                ₹{grandTotal.toLocaleString()}
                            </h2>
                        </div>
                    </div>

                    <button
                        onClick={onExport}
                        className="w-full py-4 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-lg shadow-white/5 active:scale-95 duration-200"
                    >
                        <Download size={18} />
                        Export Spec Sheet
                    </button>

                    <p className="text-[9px] text-center text-gray-600">
                        * Prices are indicative based on market averages. Actual vendor quotes may vary.
                    </p>
                </div>

            </div>
        </div>
    );
};
