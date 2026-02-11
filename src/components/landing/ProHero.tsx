import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Shield, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const ProHero: React.FC = () => {
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
        <section className="relative min-h-screen flex items-center pt-[72px] bg-slate-50 overflow-hidden">
            {/* Blueprint Grid Background */}
            <div className="absolute inset-0 blueprint-grid opacity-30 pointer-events-none" />

            <div className="relative z-10 max-w-[1400px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                {/* Left - Copy */}
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100/50 border border-blue-200 text-blue-700 text-xs font-mono font-semibold tracking-wider uppercase rounded-full mb-8">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            Professional Workspace v2.0
                        </div>

                        <h1 className="font-display text-[80px] leading-[0.95] font-bold text-charcoal tracking-tighter mb-8">
                            Your Design Business,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                Optimized.
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-xl text-charcoal/60 mb-12 leading-relaxed max-w-[540px]"
                    >
                        The professional operating system to manage clients, close high-intent leads, and earn commissions on autopilot.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="flex items-center gap-6"
                    >
                        <motion.button
                            onClick={handleJoin}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-10 py-5 bg-charcoal text-white font-display font-bold text-lg rounded-full shadow-xl hover:bg-black transition-all cursor-pointer interactive flex items-center gap-2 group"
                        >
                            Join Early Access
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                        <div className="flex items-center gap-2 text-sm text-charcoal/40 font-medium">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            Secure your priority rank
                        </div>
                    </motion.div>
                </div>

                {/* Right - Stat Dashboard Visualization */}
                <motion.div
                    initial={{ opacity: 0, x: 50, rotateY: 10 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    transition={{ delay: 0.3, duration: 1, ease: 'backOut' }}
                    className="relative perspective-1000"
                >
                    {/* Main Dashboard Card */}
                    <div className="relative z-10 bg-white rounded-3xl border border-stone-200 shadow-2xl p-8 max-w-[500px] mx-auto rotate-y-12 transition-transform duration-700 hover:rotate-y-0">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="font-display font-bold text-charcoal text-lg">Monthly Overview</h3>
                                <p className="text-xs text-charcoal/40">Last 30 days</p>
                            </div>
                            <div className="p-2 bg-stone-50 rounded-lg border border-stone-100">
                                <BarChart3 size={20} className="text-charcoal/40" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: 'Active Leads', value: '12', change: '+4', color: 'bg-orange-500' },
                                { label: 'Commission Pending', value: '₹42,500', change: '+18%', color: 'bg-emerald-500' },
                                { label: 'Proposals Sent', value: '8', change: '100% conversion', color: 'bg-blue-500' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-stone-50 border border-stone-100 hover:bg-blue-50/50 hover:border-blue-100 transition-colors cursor-default">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-10 rounded-full ${item.color}`} />
                                        <div>
                                            <p className="text-xs text-charcoal/40 font-semibold uppercase tracking-wider">{item.label}</p>
                                            <p className="font-display font-bold text-xl text-charcoal">{item.value}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                        {item.change}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Floating Elements */}
                    <motion.div
                        animate={{ y: [-10, 10, -10] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-10 -right-10 bg-white p-4 rounded-2xl shadow-xl border border-stone-100 z-20"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Zap size={20} className="text-emerald-600 fill-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-charcoal/40 font-bold">Revenue Uplift</p>
                                <p className="font-display font-bold text-charcoal">+3.2x</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default ProHero;
