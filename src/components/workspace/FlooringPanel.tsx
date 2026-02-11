
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Upload, Check } from 'lucide-react';
import { FLOORING_DATA, getSponsoredItems, FlooringItem } from './catalogTypes';

interface FlooringPanelProps {
    pendingChange?: any;
    onUpdateChange: (data: any) => void;
    onOpenCatalog: () => void;
}

export const FlooringPanel: React.FC<FlooringPanelProps> = ({
    pendingChange,
    onUpdateChange,
    onOpenCatalog,
}) => {
    const [uploadDescription, setUploadDescription] = useState('');
    const sponsoredItems = getSponsoredItems('flooring') as FlooringItem[];
    const quickPicks = FLOORING_DATA.slice(0, 6);

    const handleSelectMaterial = (item: FlooringItem) => {
        onUpdateChange({
            materialId: item.id,
            sponsoredProductId: item.id,
            materialName: item.name,
            brand: item.brand,
            price: item.price,
            thumbnailUrl: item.imageUrl,
            textureImageUrl: item.imageUrl,
            category: 'flooring'
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpdateChange({
                materialId: 'custom',
                materialName: 'Custom Material',
                customImageFile: file,
                customPrompt: uploadDescription,
                category: 'flooring'
            });
        }
    };

    const handleDescriptionChange = (desc: string) => {
        setUploadDescription(desc);
        if (pendingChange?.materialId === 'custom') {
            onUpdateChange({
                ...pendingChange,
                customPrompt: desc
            });
        }
    };

    const handleDeselect = () => {
        onUpdateChange(null);
    };

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a] text-white overflow-hidden relative">
            <input
                type="file"
                id="flooring-upload"
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*"
            />
            {/* Header */}
            <div className="p-6 flex flex-col gap-1 border-b border-white/5 relative bg-[#0a0a0a]/80 backdrop-blur-md z-10">
                <div className="flex justify-between items-start">
                    <h2 className="text-3xl font-serif text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Flooring
                    </h2>
                    {pendingChange && (
                        <button
                            onClick={handleDeselect}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xs border border-white/5"
                        >
                            <X size={14} />
                            <span>Deselect</span>
                        </button>
                    )}
                </div>
                <p className="text-gray-500 text-sm">
                    Select a material to transform your floor surface.
                </p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10 pb-24">

                {/* Visual Quick Picks */}
                <section className="space-y-4">
                    <h4 className="font-serif text-[10px] uppercase tracking-[0.25em] text-gray-400 font-bold">
                        Quick Picks
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                        {quickPicks.map((item) => {
                            const isSelected = pendingChange?.materialId === item.id;
                            return (
                                <motion.div
                                    key={item.id}
                                    className="group relative"
                                    onClick={() => handleSelectMaterial(item)}
                                >
                                    <motion.div
                                        className={`aspect-square rounded-xl overflow-hidden cursor-pointer relative shadow-lg transition-all
                                            ${isSelected ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#0a0a0a]' : 'border border-white/5'}
                                        `}
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    >
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pb-1.5">
                                            <span className="text-[10px] text-white font-medium truncate">
                                                {item.name}
                                            </span>
                                        </div>
                                    </motion.div>
                                    {isSelected && (
                                        <div className="absolute top-1 right-1 bg-orange-500 text-white p-0.5 rounded-full shadow-lg">
                                            <Check size={8} strokeWidth={4} />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* Premium Specification List */}
                <section className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
                        Recommended Materials
                    </h4>
                    <div className="space-y-2.5">
                        {sponsoredItems.slice(0, 4).map((item) => {
                            const isSelected = pendingChange?.materialId === item.id;
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => handleSelectMaterial(item)}
                                    className={`
                                        flex items-center justify-between p-4 cursor-pointer transition-all
                                        bg-white/[0.02] backdrop-blur-xl border rounded-xl group
                                        ${isSelected ? 'border-orange-500/50 bg-orange-500/5 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'border-white/[0.06] hover:border-white/20'}
                                    `}
                                    whileHover={{ x: 4 }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-gray-800">
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">{item.name}</span>
                                            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{item.brand}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-bold text-orange-400">₹{item.price}</span>
                                        <span className="text-[10px] text-gray-500">/{item.priceUnit || 'sq ft'}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* Browse Action */}
                <button
                    onClick={onOpenCatalog}
                    className="w-full py-4 px-5 rounded-xl bg-transparent border border-white/10 text-gray-300 flex justify-between items-center hover:bg-white/5 transition-all group mt-2 shadow-lg"
                >
                    <span className="text-sm font-medium">Browse All Flooring</span>
                    <ChevronRight size={18} className="text-gray-500 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </button>

                {/* Custom Finish Section */}
                <section className="space-y-4 pt-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
                        Custom Finish
                    </h4>
                    <div className="space-y-4">
                        <label
                            htmlFor="flooring-upload"
                            className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer group"
                        >
                            <div className="p-3 rounded-full bg-white/5 text-gray-400 group-hover:text-white transition-all">
                                <Upload size={24} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-300">Drop reference or <span className="text-orange-400 font-semibold">Upload</span></p>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-tighter font-bold">PNG, JPG up to 10MB</p>
                            </div>
                            {pendingChange?.customImageFile && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                                    <Check size={12} />
                                    <span>{pendingChange.customImageFile.name}</span>
                                </div>
                            )}
                        </label>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                                Text Reference (Optional)
                            </label>
                            <textarea
                                value={uploadDescription}
                                onChange={(e) => handleDescriptionChange(e.target.value)}
                                placeholder="e.g., Light oak with herringbone pattern..."
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all min-h-[80px] resize-none"
                            />
                        </div>
                    </div>
                </section>
            </div>

            {/* Bottom Gradient Overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none z-10" />
        </div>
    );
};
