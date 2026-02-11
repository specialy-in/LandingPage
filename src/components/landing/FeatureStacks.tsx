import React from 'react';
import { motion } from 'framer-motion';
import { Users, LayoutDashboard, DollarSign } from 'lucide-react';

const features = [
    {
        icon: Users,
        title: 'Lead Engine',
        subtitle: 'High-intent, design-ready clients.',
        description:
            'Homeowners send you project briefs with designs already started. They\'ve picked colors, tried products, and are ready to hire. No more tire-kickers.',
        accent: '#EA580C',
        tag: 'Acquisition',
    },
    {
        icon: LayoutDashboard,
        title: 'Workspace + CRM',
        subtitle: 'Everything, one tab.',
        description:
            'Manage BOQs, client approvals, render history, and project timelines in a single professional dashboard. Say goodbye to spreadsheet chaos.',
        accent: '#3B82F6',
        tag: 'Management',
    },
    {
        icon: DollarSign,
        title: 'Referral Earnings',
        subtitle: 'The gift that keeps giving.',
        description:
            'Get 5% commission on every sponsored product your client buys through your workspace. It\'s like a design fee that keeps on giving.',
        accent: '#10B981',
        tag: 'Revenue',
    },
];

const FeatureStacks: React.FC = () => {
    return (
        <section className="py-32 bg-white">
            <div className="max-w-[1200px] mx-auto px-8">
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-20"
                >
                    <span className="text-orange-600 font-display font-semibold text-sm tracking-widest uppercase mb-4 block">
                        Feature Deep-Dive
                    </span>
                    <h2 className="font-display text-5xl font-bold text-charcoal tracking-tight">
                        Built for how you actually work
                    </h2>
                </motion.div>

                {/* Feature Grid */}
                <div className="grid grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ delay: index * 0.12, duration: 0.6 }}
                        >
                            <motion.div
                                whileHover={{ y: -4, borderColor: feature.accent + '30' }}
                                className="h-full p-8 rounded-2xl border border-stone-200 bg-white hover:shadow-card-hover transition-shadow"
                            >
                                {/* Tag */}
                                <span
                                    className="inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
                                    style={{
                                        color: feature.accent,
                                        backgroundColor: feature.accent + '10',
                                    }}
                                >
                                    {feature.tag}
                                </span>

                                {/* Icon */}
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                                    style={{ backgroundColor: feature.accent + '08' }}
                                >
                                    <feature.icon size={26} color={feature.accent} strokeWidth={1.5} />
                                </div>

                                {/* Content */}
                                <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
                                    {feature.title}
                                </h3>
                                <p className="font-display text-sm font-semibold text-charcoal/50 mb-4">
                                    {feature.subtitle}
                                </p>
                                <p className="text-sm text-charcoal/40 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeatureStacks;
