import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, PlayCircle, Trash2, AlertCircle } from 'lucide-react';
import { Wall } from './types';

export interface EditQueueItem {
    id: string;
    type: 'wall' | 'flooring' | 'product';
    label: string;
    description: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface EditQueueProps {
    queue: EditQueueItem[];
    onDismiss: (id: string) => void;
    onClearAll: () => void;
    onApplyChanges: () => void;
    isApplying: boolean;
}

export const EditQueue: React.FC<EditQueueProps> = ({
    queue,
    onDismiss,
    onClearAll,
    onApplyChanges,
    isApplying
}) => {
    const totalItems = queue.length;

    if (totalItems === 0) return null;

    const estimatedTime = totalItems * 10; // 10 seconds per change

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg"
        >
            <div className="flex items-center gap-2 text-amber-400">
                <Clock size={14} />
                <span className="text-xs font-medium">Pending Changes ({totalItems})</span>
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>~{estimatedTime}s</span>
            </div>

            <div className="flex items-center gap-2 ml-2">
                <button
                    onClick={onClearAll}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                    Clear
                </button>
                <button
                    onClick={onApplyChanges}
                    disabled={isApplying}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium rounded flex items-center gap-1 disabled:opacity-50"
                >
                    {isApplying ? (
                        <>Processing...</>
                    ) : (
                        <>
                            <PlayCircle size={12} /> Apply Changes
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};
