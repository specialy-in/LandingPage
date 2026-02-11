import React from 'react';
import { Clock, RotateCcw, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

// ============================================
// TYPES
// ============================================

export interface HistoryEvent {
    id: string;
    action: string;
    details: string;
    timestamp: string; // ISO string or time string
    type: 'edit' | 'ai' | 'undo' | 'system';
}

interface HistoryPanelProps {
    events?: HistoryEvent[];
    onUndo?: (id: string) => void;
}

// ============================================
// MOCK DATA
// ============================================
const MOCK_HISTORY: HistoryEvent[] = [
    {
        id: 'h1',
        action: 'System Ready',
        details: 'Workspace initialized successfully',
        timestamp: '10:00 AM',
        type: 'system'
    },
    {
        id: 'h2',
        action: 'Wall Created',
        details: 'Added 4 wall segments for Living Room',
        timestamp: '10:05 AM',
        type: 'edit'
    },
    {
        id: 'h3',
        action: 'Flooring Updated',
        details: 'Applied Marble Texture to Floor 1',
        timestamp: '10:12 AM',
        type: 'edit'
    },
    {
        id: 'h4',
        action: 'AI Enhancement',
        details: 'Generated mood board variations',
        timestamp: '10:15 AM',
        type: 'ai'
    },
    {
        id: 'h5',
        action: 'Product Added',
        details: 'Placed "Urban Ladder Sofa" in Master Bedroom',
        timestamp: '10:22 AM',
        type: 'edit'
    }
];

// ============================================
// COMPONENT
// ============================================

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
    events = MOCK_HISTORY,
    onUndo
}) => {
    // Reverse events to show newest first
    const reversedEvents = [...events].reverse();

    return (
        <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-xl">
            <div className="flex flex-col h-full">

                {/* HEAD */}
                <div className="p-6 border-b border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-serif text-white leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Session History
                            </h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">
                                Recent Actions & Logs
                            </p>
                        </div>
                    </div>
                </div>

                {/* TIMELINE LIST */}
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="relative p-6">
                        {/* Timeline Line */}
                        <div className="absolute left-9 top-6 bottom-6 w-px bg-white/10" />

                        <div className="space-y-6">
                            {reversedEvents.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="relative pl-8"
                                >
                                    {/* Timeline Dot */}
                                    <div className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 z-10
                                        ${item.type === 'ai' ? 'bg-purple-500' :
                                            item.type === 'system' ? 'bg-gray-500' :
                                                'bg-blue-500'}`}
                                    />

                                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 hover:bg-white/[0.05] transition-colors group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider
                                                ${item.type === 'ai' ? 'text-purple-400' :
                                                    item.type === 'system' ? 'text-gray-500' :
                                                        'text-blue-400'}`}>
                                                {item.action}
                                            </span>
                                            <span className="text-[10px] font-mono text-gray-600">
                                                {item.timestamp}
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-300 leading-relaxed">
                                            {item.details}
                                        </p>

                                        {item.type !== 'system' && (
                                            <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onUndo?.(item.id)}
                                                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <RotateCcw size={10} />
                                                    Undo Action
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-white/[0.06] bg-slate-950/50">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 justify-center">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span>All changes saved to cloud</span>
                    </div>
                </div>

            </div>
        </div>
    );
};
