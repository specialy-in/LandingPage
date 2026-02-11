import React from 'react';
import { motion } from 'framer-motion';
import { Target, Layout, Percent, ChevronRight } from 'lucide-react';

const steps = [
    {
        icon: Target,
        title: 'Get Leads',
        description: 'Homeowners send you project briefs with designs already started. No cold calling ever again.',
        color: '#EA580C',
        bgColor: 'from-orange-50 to-amber-50',
    },
    {
        icon: Layout,
        title: 'Unified Workspace',
        description: 'Manage projects, BOQs, renders, and client approvals in one powerful dashboard.',
        color: '#1A1A1A',
        bgColor: 'from-slate-50 to-stone',
    },
    {
        icon: Percent,
        title: '5% Product Commissions',
        description: 'Earn on every sponsored product your client purchases. Passive income, unlocked.',
        color: '#10B981',
        bgColor: 'from-emerald-50 to-teal-50',
    },
];

const ThreeWayWin: React.FC = () => {
    return (
        <section className="py-32 bg-stone relative">
            <div className="max-w-[1200px] mx-auto px-8">
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-6"
                >
                    <span className="text-orange-600 font-display font-semibold text-sm tracking-widest uppercase mb-4 block">
                        The Three-Way Win
                    </span>
                    <h2 className="font-display text-5xl font-bold text-charcoal tracking-tight mb-4">
                        One platform, three revenue streams
                    </h2>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-center text-charcoal/40 italic text-base mb-20 max-w-[500px] mx-auto"
                >
                    Finally, an end to 2 AM WhatsApp client feedback loops.
                </motion.p>

                {/* Flow cards */}
                <div className="grid grid-cols-3 gap-6 relative">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ delay: index * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="relative"
                        >
                            <motion.div
                                whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(0,0,0,0.08)' }}
                                className={`bg-gradient-to-br ${step.bgColor} rounded-2xl p-8 border border-white/80 h-full`}
                            >
                                {/* Icon */}
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                                    style={{ backgroundColor: step.color + '12' }}
                                >
                                    <step.icon size={26} color={step.color} strokeWidth={1.5} />
                                </div>

                                {/* Content */}
                                <h3 className="font-display text-xl font-bold text-charcoal mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-charcoal/50 leading-relaxed">
                                    {step.description}
                                </p>
                            </motion.div>

                            {/* Arrow between cards */}
                            {index < steps.length - 1 && (
                                <div className="absolute top-1/2 -right-[18px] z-10 -translate-y-1/2">
                                    <ChevronRight size={24} className="text-charcoal/15" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ThreeWayWin;
