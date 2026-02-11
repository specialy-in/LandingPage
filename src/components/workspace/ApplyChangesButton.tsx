import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface ApplyChangesButtonProps {
    pendingCount: number;
    onApply: () => void;
    isApplying: boolean;
}

export const ApplyChangesButton: React.FC<ApplyChangesButtonProps> = ({
    pendingCount,
    onApply,
    isApplying
}) => {
    return (
        <AnimatePresence>
            {pendingCount > 0 && !isApplying && (
                <motion.button
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onApply}
                    className="fixed bottom-8 right-8 z-50 px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 text-white font-medium text-lg bg-orange-600 hover:bg-orange-500 transition-colors"
                >
                    Apply {pendingCount} Change{pendingCount > 1 ? 's' : ''}
                    <ArrowRight size={20} />
                    <span className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping opacity-50" />
                </motion.button>
            )}
        </AnimatePresence>
    );
};

interface FullScreenLoaderProps {
    isVisible: boolean;
    count: number;
    progress: number;
    currentStep: string;
    changes: { label: string; color?: string; material?: string }[];
    error?: string;
    onDismissError?: () => void;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
    isVisible,
    count,
    progress,
    currentStep,
    changes,
    error,
    onDismissError
}) => (
    <AnimatePresence>
        {isVisible && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
            >
                {error ? (
                    // Error State
                    <div className="max-w-md">
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                            <AlertCircle size={40} className="text-red-400" />
                        </div>
                        <h2 className="text-2xl font-medium text-white mb-3">Rendering Failed</h2>
                        <p className="text-gray-400 mb-6">{error}</p>
                        <button
                            onClick={onDismissError}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    // Loading State
                    <>
                        <div className="relative w-24 h-24 mb-6">
                            <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                            <div
                                className="absolute inset-0 border-4 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold text-orange-400">{Math.round(progress)}%</span>
                            </div>
                        </div>

                        <h2 className="text-2xl font-medium text-white mb-2">
                            🎨 Rendering Your Changes...
                        </h2>

                        <p className="text-gray-400 mb-6 max-w-md">
                            {currentStep}
                        </p>

                        {/* Progress bar */}
                        <div className="w-80 h-2 bg-white/10 rounded-full overflow-hidden mb-6">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                                className="h-full bg-gradient-to-r from-orange-500 to-orange-400"
                            />
                        </div>

                        {/* Changes summary */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-sm">
                            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Applying {count} change{count > 1 ? 's' : ''}</p>
                            <div className="space-y-1">
                                {changes.slice(0, 3).map((change, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                        {change.color && (
                                            <div
                                                className="w-3 h-3 rounded-full border border-white/20"
                                                style={{ backgroundColor: change.color }}
                                            />
                                        )}
                                        <span>{change.label} → {change.material || change.color}</span>
                                    </div>
                                ))}
                                {changes.length > 3 && (
                                    <p className="text-xs text-gray-500">+{changes.length - 3} more</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        )}
    </AnimatePresence>
);
