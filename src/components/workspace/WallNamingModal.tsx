import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WallNamingModalProps {
    isOpen: boolean;
    defaultName: string;
    existingNames: string[];
    onSave: (name: string) => void;
    onCancel: () => void;
}

export const WallNamingModal: React.FC<WallNamingModalProps> = ({
    isOpen,
    defaultName,
    existingNames,
    onSave,
    onCancel
}) => {
    const [name, setName] = useState(defaultName);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setName(defaultName);
            setError(null);
            setTimeout(() => inputRef.current?.select(), 100);
        }
    }, [isOpen, defaultName]);

    const handleSave = () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Name cannot be empty');
            return;
        }
        if (existingNames.includes(trimmed)) {
            setError('A wall with this name already exists');
            return;
        }
        onSave(trimmed);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onCancel}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                    >
                        <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden pointer-events-auto">
                            <div className="p-5 border-b border-white/10">
                                <h3 className="text-base font-medium text-white">Name this wall</h3>
                            </div>
                            <div className="p-5">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); setError(null); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                    placeholder="e.g., Living Room Wall"
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-100 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                                />
                                {error && (
                                    <p className="text-red-400 text-xs mt-2">{error}</p>
                                )}
                            </div>
                            <div className="p-4 bg-white/[0.02] border-t border-white/10 flex justify-end gap-3">
                                <button
                                    onClick={onCancel}
                                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Check size={14} /> Save Wall
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
