import React, { useRef, useState } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { Sparkles, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoopPassProps {
    username: string;
    role: 'HOMEOWNER' | 'PROFESSIONAL' | null;
    loopId: string;
    onFlip?: () => void;
    isAdmin?: boolean;
    preLaunchMode?: boolean;
}

export const LoopPass: React.FC<LoopPassProps> = ({
    username,
    role,
    loopId,
    onFlip,
    isAdmin = false,
    preLaunchMode = false
}) => {
    const navigate = useNavigate();
    const [isFlipped, setIsFlipped] = useState(false);

    // Mouse Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const handleFlip = () => {
        if (onFlip) onFlip();
        setIsFlipped(!isFlipped);
    };

    return (
        <div
            className="perspective-1000 w-full max-w-md mx-auto h-[260px] cursor-pointer group"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleFlip}
        >
            <motion.div
                style={{
                    rotateX: rotateX,
                    rotateY: rotateY,
                    transformStyle: "preserve-3d",
                }}
                className="w-full h-full relative"
            >
                <motion.div
                    className="w-full h-full relative"
                    initial={false}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* --- FRONT SIDE --- */}
                    <div
                        className="absolute inset-0 bg-[#0A0A0F] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between p-8"
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    >
                        {/* Gradient Mesh Background */}
                        <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-orange-500/20 via-blue-500/10 to-purple-500/20" />

                        {/* Noise Texture */}
                        <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
                        />

                        {/* Card Content (Mapping user data) */}
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                        <Sparkles size={14} className="text-orange-500" />
                                    </div>
                                    <span className="font-display font-bold text-white tracking-widest text-lg">Specialy</span>
                                </div>
                                <span className="text-[10px] font-mono text-white/40 border border-white/10 px-3 py-1 rounded-full uppercase tracking-[0.2em] bg-white/5">
                                    Loop Pass
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-3xl font-display font-bold text-white tracking-tight capitalize">
                                    {username || 'Member'}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-white/40 tracking-wider">
                                        {loopId || `#${loopId?.slice(0, 5).toUpperCase()}`}
                                    </span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500/40" />
                                    <span className="text-xs font-mono text-orange-500 font-bold uppercase tracking-widest">
                                        {role === 'PROFESSIONAL' ? 'Pro Member' : 'Homeowner'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
                                    <span className="text-[10px] font-mono text-white tracking-[0.3em] uppercase">Flip to Access</span>
                                    <ArrowRight size={12} className="text-white animate-pulse" />
                                </div>

                                <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                                    Est. 2026
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- BACK SIDE --- */}
                    <div
                        className="absolute inset-0 bg-neutral-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-8 text-center"
                        style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: "rotateY(180deg)"
                        }}
                    >
                        <div className="relative z-10">
                            {role === 'PROFESSIONAL' ? (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-blue-500/5 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
                                        <ShieldCheck size={32} className="text-blue-400 opacity-80" />
                                    </div>
                                    <h3 className="text-white font-display font-bold text-xl mb-2 tracking-tight">Under Review</h3>
                                    <p className="text-white/40 text-sm leading-relaxed max-w-[240px] mx-auto font-light">
                                        Our team is reviewing your portfolio for Founder's Circle access. We'll ping you soon.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-white font-display font-bold text-xl mb-2 tracking-tight">The Loop is Polishing</h3>
                                        <p className="text-white/40 text-sm leading-relaxed max-w-[240px] mx-auto font-light">
                                            We're putting the final touches on your workspace. We'll notify you when the doors open.
                                        </p>
                                    </div>

                                    <div className="mt-8 flex flex-col items-center gap-4">
                                        <div className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/40 tracking-widest flex items-center gap-2">
                                            <Lock size={14} className="opacity-50" /> OPENING SOON
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Optional Dashboard Redirect for Admins */}
                            {isAdmin && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate('/dashboard');
                                    }}
                                    className="mt-8 text-orange-500 font-mono text-[10px] uppercase tracking-[0.3em] hover:text-white transition-colors"
                                >
                                    Admin: Enter Dashboard →
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};
