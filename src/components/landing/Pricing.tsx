import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const plans = [
    {
        name: 'SPECIALY PLUS',
        tagline: 'For the Independent Hustler',
        price: '₹999',
        period: '/mo',
        featured: false,
        cta: 'Join Early Access',
        features: [
            '50 AI renders / month',
            'Pay-per-lead model',
            'Full workspace access',
            'BOQ generator',
            'Basic analytics',
            'Email support',
        ],
    },
    {
        name: 'SPECIALY MAX',
        tagline: 'For the Power Firm',
        price: '₹3,000',
        period: '/mo',
        annualPrice: '₹2,000/mo billed annually',
        featured: true,
        badge: 'BEST VALUE',
        cta: 'Join Early Access',
        features: [
            'Unlimited AI renders',
            'UNLIMITED FREE LEADS',
            '5-10% product commissions',
            '3 team seats included',
            'Priority workspace + CRM',
            'Advanced analytics dashboard',
            'Dedicated account manager',
            'Custom branding on proposals',
        ],
    },
];

const Pricing: React.FC = () => {
    const { signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleJoin = async () => {
        try {
            await signInWithGoogle();
            navigate('/dashboard');
        } catch (error) {
            console.error("Sign in failed", error);
        }
    };

    return (
        <section id="pricing" className="py-32 bg-white">
            <div className="max-w-[900px] mx-auto px-8">
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-16"
                >
                    <span className="text-orange-600 font-display font-semibold text-sm tracking-widest uppercase mb-4 block">
                        Pricing
                    </span>
                    <h2 className="font-display text-5xl font-bold text-charcoal tracking-tight mb-4">
                        Simple, transparent plans
                    </h2>
                    <p className="text-charcoal/40 text-lg max-w-[400px] mx-auto">
                        Start small, scale fast. Cancel anytime.
                    </p>
                </motion.div>

                {/* Cards */}
                <div className="grid grid-cols-2 gap-6">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ delay: index * 0.15, duration: 0.6 }}
                        >
                            <motion.div
                                whileHover={{ y: -6 }}
                                className={`relative rounded-3xl p-8 h-full flex flex-col ${plan.featured
                                    ? 'border-2 border-orange-600 bg-white shadow-lift'
                                    : 'border border-stone-200 bg-white shadow-card'
                                    }`}
                            >
                                {/* Badge */}
                                {plan.badge && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 text-white text-[11px] font-bold tracking-wider uppercase rounded-full shadow-lg">
                                            <Star size={12} fill="currentColor" />
                                            {plan.badge}
                                        </span>
                                    </div>
                                )}

                                {/* Plan header */}
                                <div className="mb-8">
                                    <h3 className="font-display text-sm font-bold tracking-widest text-charcoal/30 uppercase mb-1">
                                        {plan.name}
                                    </h3>
                                    <p className="text-sm text-charcoal/50 mb-5">{plan.tagline}</p>

                                    <div className="flex items-baseline gap-1">
                                        <span className="font-display text-5xl font-bold text-charcoal">
                                            {plan.price}
                                        </span>
                                        <span className="text-charcoal/40 text-sm">{plan.period}</span>
                                    </div>

                                    {plan.annualPrice && (
                                        <p className="text-xs text-orange-600 font-medium mt-2 flex items-center gap-1">
                                            <Zap size={12} />
                                            {plan.annualPrice}
                                        </p>
                                    )}
                                </div>

                                {/* Features */}
                                <div className="flex-1 space-y-3 mb-8">
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-3">
                                            <div
                                                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${plan.featured ? 'bg-orange-600' : 'bg-charcoal'
                                                    }`}
                                            >
                                                <Check size={11} className="text-white" strokeWidth={3} />
                                            </div>
                                            <span
                                                className={`text-sm ${feature.includes('UNLIMITED')
                                                    ? 'font-bold text-charcoal'
                                                    : 'text-charcoal/60'
                                                    }`}
                                            >
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA */}
                                <motion.button
                                    onClick={handleJoin}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full py-4 rounded-full font-display font-semibold text-base transition-all cursor-pointer ${plan.featured
                                        ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg'
                                        : 'bg-charcoal text-white hover:bg-black'
                                        }`}
                                >
                                    {plan.cta}
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
