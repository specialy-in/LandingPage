import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

interface ApplyChangesPillProps {
    pendingCount: number;
    isLoading: boolean;
    onApply: () => void;
}

export const ApplyChangesPill: React.FC<ApplyChangesPillProps> = ({
    pendingCount,
    isLoading,
    onApply
}) => {
    return (
        <AnimatePresence>
            {pendingCount > 0 && (
                <motion.button
                    initial={{ y: 100, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 100, opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50
                               bg-gradient-to-r from-orange-600 to-orange-500 
                               text-white px-8 py-4 rounded-full 
                               shadow-[0_8px_32px_rgba(249,115,22,0.4)]
                               font-medium flex items-center gap-3 
                               hover:from-orange-500 hover:to-orange-400 
                               hover:shadow-[0_12px_40px_rgba(249,115,22,0.5)]
                               active:scale-95 transition-all duration-200
                               disabled:opacity-70 disabled:cursor-not-allowed"
                    onClick={onApply}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            <span>Applying...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            <span>
                                {pendingCount} Pending Change{pendingCount > 1 ? 's' : ''}
                            </span>
                        </>
                    )}
                </motion.button>
            )}
        </AnimatePresence>
    );
};
