import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, Check, Trash2 } from 'lucide-react';
import { PendingChanges } from './types';

interface PendingChangesIndicatorProps {
    pendingChanges: PendingChanges;
    onClearAll: () => void;
    onRemoveChange: (type: 'walls' | 'floor', id?: string) => void;
}

export const PendingChangesIndicator: React.FC<PendingChangesIndicatorProps> = ({
    pendingChanges,
    onClearAll,
    onRemoveChange
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const wallChangeCount = Object.keys(pendingChanges.walls).length;
    const floorChangeCount = pendingChanges.floor ? 1 : 0;
    const totalCount = wallChangeCount + floorChangeCount;

    if (totalCount === 0) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${isOpen ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}
                `}
            >
                <div className="relative">
                    <Bell size={14} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                </div>
                <span>{totalCount} pending</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop to close on click outside */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                                <span className="text-xs font-medium text-gray-400">Pending Changes</span>
                                <button
                                    onClick={() => { onClearAll(); setIsOpen(false); }}
                                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                                >
                                    Clear All
                                </button>
                            </div>

                            <div className="max-h-60 overflow-y-auto p-1">
                                {(Object.entries(pendingChanges.walls) as [string, any][]).map(([id, change]) => (
                                    <div key={id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg group">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div
                                                className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                                                style={{ backgroundColor: change.color }}
                                            />
                                            <div className="truncate">
                                                <p className="text-xs text-gray-200 truncate">{change.label}</p>
                                                <p className="text-[10px] text-gray-500 truncate">
                                                    {change.sponsoredProductName || change.color}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onRemoveChange('walls', id)}
                                            className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}

                                {pendingChanges.floor && (
                                    <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg group">
                                        <div className="truncate">
                                            <p className="text-xs text-gray-200">Flooring</p>
                                            <p className="text-[10px] text-gray-500 truncate">{pendingChanges.floor.label}</p>
                                        </div>
                                        <button
                                            onClick={() => onRemoveChange('floor')}
                                            className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
