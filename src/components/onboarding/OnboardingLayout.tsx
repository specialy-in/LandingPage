import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingLayoutProps {
    children: React.ReactNode;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#0A0A0F] text-white font-sans flex flex-col relative overflow-hidden">
            {/* Background Texture/Grain can go here if needed */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
            />

            {/* Content Container */}
            <div className="relative z-10 flex-grow flex flex-col items-center justify-center p-6 md:p-12 w-full max-w-5xl mx-auto">
                <AnimatePresence mode="wait">
                    {children}
                </AnimatePresence>
            </div>

            {/* Minimal Footer / Progress (Optional) */}
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
                <p className="text-white/20 text-xs font-mono uppercase tracking-[0.2em]">
                    Setting up your space
                </p>
            </div>
        </div>
    );
};
