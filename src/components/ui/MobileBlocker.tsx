import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Layout } from 'lucide-react';

export const MobileBlocker: React.FC = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            // Check for common mobile touch points or narrow screen width
            const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isNarrow = window.innerWidth < 1024; // Industry standard for desktop breakpoint
            setIsMobile(isNarrow || (isTouch && window.innerWidth < 768));
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!isMobile) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0A0A0F] flex items-center justify-center p-6 text-center overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative max-w-md w-full"
            >
                {/* Visual Icon */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute inset-0 bg-orange-600/20 blur-2xl rounded-full"
                        />
                        <div className="relative bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
                            <Monitor size={48} className="text-orange-600" />
                            <motion.div
                                animate={{ x: [0, 10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -bottom-2 -right-2 bg-charcoal p-2 rounded-xl border border-white/10"
                            >
                                <Smartphone size={20} className="text-white/40" />
                            </motion.div>
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl font-display font-bold text-white mb-4 tracking-tight">
                    Desktop Experience Only
                </h1>

                <p className="text-white/40 text-lg leading-relaxed mb-8 font-light">
                    Specialy is a powerful design workspace currently optimized for <span className="text-white">Desktop environments</span>.
                    Please switch to a computer to start designing.
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-white/60 text-sm font-mono tracking-wider uppercase">
                    <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
                    Mobile Version Coming Soon
                </div>

                <div className="mt-16 flex flex-col items-center gap-6 opacity-30">
                    <div className="flex items-center gap-4">
                        <Layout size={24} className="text-white" />
                        <div className="h-6 w-px bg-white/20" />
                        <span className="font-display font-bold text-white tracking-widest uppercase text-xs">Specialy</span>
                    </div>

                    <a
                        href="mailto:contact@specialy.in"
                        className="text-[10px] font-mono tracking-[0.3em] uppercase text-white hover:text-orange-600 transition-colors"
                    >
                        contact@specialy.in
                    </a>
                </div>
            </motion.div>
        </div>
    );
};
