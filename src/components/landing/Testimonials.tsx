import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, DollarSign } from 'lucide-react';

const testimonials = [
    {
        name: 'Ananya Krishnan',
        title: 'Principal Designer, Studio AK',
        initials: 'AK',
        color: '#EA580C',
        quote:
            'Specialy turned my one-person studio into a machine. Leads come in pre-qualified and the workspace eliminates 80% of the back-and-forth.',
        metric: 'Admin time reduced by 15 hrs/week',
        metricIcon: Clock,
    },
    {
        name: 'Rajesh Malhotra',
        title: 'Founder, Malhotra Interiors',
        initials: 'RM',
        color: '#3B82F6',
        quote:
            'The product commissions alone cover my subscription cost 10x over. And the clients are actually serious about their projects.',
        metric: '₹1.2L/mo in referral earnings',
        metricIcon: DollarSign,
    },
    {
        name: 'Sneha Patil',
        title: 'Interior Architect, DesignCraft',
        initials: 'SP',
        color: '#10B981',
        quote:
            'I went from 3 projects a quarter to 8 — without hiring anyone. The lead engine is genuinely game-changing for independent designers.',
        metric: 'Project volume up 2.7×',
        metricIcon: TrendingUp,
    },
];

const Testimonials: React.FC = () => {
    return (
        <section className="py-32 bg-stone">
            <div className="max-w-[1100px] mx-auto px-8">
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-16"
                >
                    <span className="text-orange-600 font-display font-semibold text-sm tracking-widest uppercase mb-4 block">
                        Testimonials
                    </span>
                    <h2 className="font-display text-5xl font-bold text-charcoal tracking-tight mb-4">
                        From the professionals themselves
                    </h2>
                </motion.div>

                {/* Cards */}
                <div className="grid grid-cols-3 gap-6">
                    {testimonials.map((t, index) => (
                        <motion.div
                            key={t.name}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ delay: index * 0.12, duration: 0.6 }}
                        >
                            <motion.div
                                whileHover={{ y: -4 }}
                                className="bg-white rounded-2xl border border-stone-200 p-7 h-full flex flex-col shadow-card"
                            >
                                {/* Header */}
                                <div className="flex items-center gap-4 mb-5">
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0"
                                        style={{ backgroundColor: t.color }}
                                    >
                                        {t.initials}
                                    </div>
                                    <div>
                                        <h4 className="font-display font-semibold text-charcoal text-sm">
                                            {t.name}
                                        </h4>
                                        <p className="text-xs text-charcoal/40">{t.title}</p>
                                    </div>
                                </div>

                                {/* Quote */}
                                <p className="text-sm text-charcoal/60 leading-relaxed flex-1 mb-5">
                                    "{t.quote}"
                                </p>

                                {/* Metric card */}
                                <div
                                    className="flex items-center gap-3 p-3 rounded-xl"
                                    style={{ backgroundColor: t.color + '08' }}
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: t.color + '15' }}
                                    >
                                        <t.metricIcon size={16} color={t.color} />
                                    </div>
                                    <span className="text-xs font-semibold text-charcoal">
                                        {t.metric}
                                    </span>
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
