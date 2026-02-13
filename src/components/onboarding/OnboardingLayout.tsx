import React from 'react';

interface OnboardingLayoutProps {
    children: React.ReactNode;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col relative overflow-hidden selection:bg-orange-500/30">
            {/* Architectural Grid Background */}
            <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Subtle noise/grain overlay */}
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                }}
            />

            {/* Header Logo */}
            <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
                <div className="flex items-center gap-1">
                    <span className="font-display text-xl font-bold text-white tracking-tight">
                        Specialy
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1" />
                </div>
            </div>

            {/* Content Container — centered modal style, sharp corners */}
            <div className="relative z-10 flex-grow flex flex-col items-center justify-center w-full">
                <div className="w-full max-w-[800px] mx-auto border border-white/[0.08] bg-[#0A0A0F]/80 backdrop-blur-sm" style={{ borderRadius: 0 }}>
                    <div className="p-6 md:p-12">
                        {children}
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10">
                <p className="text-white/10 text-[10px] font-mono uppercase tracking-[0.25em]">
                    Founder's Circle
                </p>
            </div>
        </div>
    );
};
