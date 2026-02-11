import React from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

const comparisons = [
    {
        old: 'WhatsApp chaos for client feedback',
        new: 'Professional client portal with tracked approvals',
    },
    {
        old: 'Manual Excel BOQs that nobody reads',
        new: '1-click BOQ generation with live pricing',
    },
    {
        old: 'Cold-calling builders for referrals',
        new: 'High-intent leads delivered to your inbox',
    },
    {
        old: 'Sharing PDFs over email threads',
        new: 'Interactive workspace with real-time renders',
    },
    {
        old: 'Zero income from product recommendations',
        new: '5-10% commissions on every product sold',
    },
];

const CompetitiveTransform: React.FC = () => {
    return (
        <section className="py-32 bg-stone">
            <div className="max-w-[1000px] mx-auto px-8">
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-16"
                >
                    <span className="text-orange-600 font-display font-semibold text-sm tracking-widest uppercase mb-4 block">
                        The Transformation
                    </span>
                    <h2 className="font-display text-5xl font-bold text-charcoal tracking-tight mb-4">
                        Before & After Specialy
                    </h2>
                    <p className="text-charcoal/40 text-lg max-w-[450px] mx-auto">
                        Same talent. Better tools. Dramatically different outcomes.
                    </p>
                </motion.div>

                {/* Comparison table */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-card"
                >
                    {/* Headers */}
                    <div className="grid grid-cols-2 border-b border-stone-200">
                        <div className="p-6 text-center">
                            <span className="font-display font-semibold text-charcoal/30 text-sm">
                                The Old Way 😩
                            </span>
                        </div>
                        <div className="p-6 text-center bg-charcoal/[0.02]">
                            <span className="font-display font-semibold text-orange-600 text-sm">
                                The Specialy Way ✨
                            </span>
                        </div>
                    </div>

                    {/* Rows */}
                    {comparisons.map((row, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.08, duration: 0.4 }}
                            className={`grid grid-cols-2 ${index < comparisons.length - 1 ? 'border-b border-stone-200/60' : ''}`}
                        >
                            {/* Old way */}
                            <div className="p-5 flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                    <X size={12} className="text-red-400" />
                                </div>
                                <span className="text-sm text-charcoal/30 line-through">
                                    {row.old}
                                </span>
                            </div>

                            {/* New way */}
                            <div className="p-5 flex items-center gap-3 bg-charcoal/[0.02]">
                                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                    <Check size={12} className="text-emerald-500" />
                                </div>
                                <span className="text-sm text-charcoal font-medium">
                                    {row.new}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default CompetitiveTransform;
