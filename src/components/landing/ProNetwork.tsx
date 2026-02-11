import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const designers = [
    { name: 'Priya Sharma', specialty: 'Modern Minimalist', color: '#EA580C', initials: 'PS' },
    { name: 'Arjun Mehta', specialty: 'Industrial Chic', color: '#1A1A1A', initials: 'AM' },
    { name: 'Nishtha Kapoor', specialty: 'Bohemian Luxury', color: '#8B5CF6', initials: 'NK' },
    { name: 'Ravi Desai', specialty: 'Scandinavian Clean', color: '#3B82F6', initials: 'RD' },
    { name: 'Kavya Reddy', specialty: 'Art Deco Revival', color: '#EC4899', initials: 'KR' },
    { name: 'Siddharth Jain', specialty: 'Smart Home Integration', color: '#10B981', initials: 'SJ' },
    { name: 'Meera Patel', specialty: 'Heritage Contemporary', color: '#F59E0B', initials: 'MP' },
    { name: 'Vikram Singh', specialty: 'Urban Compact', color: '#EF4444', initials: 'VS' },
];

const ProNetwork: React.FC = () => {
    const allDesigners = [...designers, ...designers]; // Duplicate for seamless loop

    return (
        <section className="py-32 bg-white overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-8 mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.7 }}
                    className="text-center"
                >
                    <span className="text-orange-600 font-display font-semibold text-sm tracking-widest uppercase mb-4 block">
                        The Pro Network
                    </span>
                    <h2 className="font-display text-5xl font-bold text-charcoal tracking-tight mb-4">
                        Meet the experts
                    </h2>
                    <p className="text-charcoal/40 text-lg max-w-[500px] mx-auto">
                        People who turn "meh" rooms into "wow" spaces. Vetted, talented, and ready to go.
                    </p>
                </motion.div>
            </div>

            {/* Marquee */}
            <div className="relative">
                {/* Left/right fades */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />

                <div className="flex animate-marquee marquee-track">
                    {allDesigners.map((designer, index) => (
                        <div
                            key={`${designer.name}-${index}`}
                            className="flex-shrink-0 w-[280px] mx-4"
                        >
                            <motion.div
                                whileHover={{ y: -6, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}
                                className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card cursor-pointer"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    {/* Avatar */}
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-display font-bold text-sm"
                                        style={{ backgroundColor: designer.color }}
                                    >
                                        {designer.initials}
                                    </div>
                                    <div>
                                        <h4 className="font-display font-semibold text-charcoal text-sm">
                                            {designer.name}
                                        </h4>
                                        <p className="text-xs text-charcoal/40">{designer.specialty}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            size={14}
                                            fill="#F59E0B"
                                            color="#F59E0B"
                                        />
                                    ))}
                                    <span className="text-xs text-charcoal/30 ml-2">5.0</span>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProNetwork;
