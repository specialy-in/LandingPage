import React, { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue, useScroll } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import collageImg from '../../assets/images/hero/collage.jpg';

const HomeownerHero: React.FC = () => {
    const { signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    // Mouse Parallax & Tilt
    const mouseX = useMotionValue(0.5); // Normalized 0-1
    const mouseY = useMotionValue(0.5); // Normalized 0-1

    const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    // Scroll Effects
    const { scrollY } = useScroll();
    const scrollScale = useTransform(scrollY, [0, 500], [1, 1.1]);
    const scrollOpacity = useTransform(scrollY, [0, 500], [1, 0.8]);

    // Tilt Transforms (max 5 degrees)
    const rotateX = useTransform(smoothMouseY, [0, 1], [5, -5]);
    const rotateY = useTransform(smoothMouseX, [0, 1], [-5, 5]);

    // Parallax Layer Shifts
    // Background (Slowest)
    const bgX = useTransform(smoothMouseX, [0, 1], [10, -10]);
    const bgY = useTransform(smoothMouseY, [0, 1], [10, -10]);

    // Mid Layer (Medium: Marble & Compass)
    const midX = useTransform(smoothMouseX, [0, 1], [25, -25]);
    const midY = useTransform(smoothMouseY, [0, 1], [25, -25]);

    // Top Layer (Fastest: Swatches)
    const topX = useTransform(smoothMouseX, [0, 1], [40, -40]);
    const topY = useTransform(smoothMouseY, [0, 1], [40, -40]);

    const handleJoin = async () => {
        try {
            await signInWithGoogle();
            navigate('/dashboard');
        } catch (error) {
            console.error("Sign in failed", error);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX / window.innerWidth);
            mouseY.set(e.clientY / window.innerHeight);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <section className="relative min-h-screen flex items-center justify-center pt-[72px] overflow-hidden bg-white">
            {/* 1. LAYERED COLLAGE BACKGROUND */}
            <motion.div
                className="absolute inset-0 z-0 origin-center pointer-events-none"
                style={{
                    scale: scrollScale,
                    opacity: scrollOpacity,
                    rotateX,
                    rotateY,
                    perspective: 1000
                }}
            >
                {/* --- Background Layer (Full Image) --- */}
                <motion.div
                    className="absolute inset-[-5%] bg-cover bg-center"
                    style={{
                        backgroundImage: `url(${collageImg})`,
                        x: bgX,
                        y: bgY,
                    }}
                />

                {/* --- Mid Layer (Marble & Compass Focus) --- */}
                {/* We use the same image but clipped to the central objects for a depth effect */}
                <motion.div
                    className="absolute inset-[-5%] bg-cover bg-center z-10"
                    style={{
                        backgroundImage: `url(${collageImg})`,
                        x: midX,
                        y: midY,
                        clipPath: 'circle(35% at 50% 55%)',
                        filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.3))'
                    }}
                />

                {/* --- Top Layer (Swatches Focus) --- */}
                <motion.div
                    className="absolute inset-[-5%] bg-cover bg-center z-20"
                    style={{
                        backgroundImage: `url(${collageImg})`,
                        x: topX,
                        y: topY,
                        // Clip to corner swatches regions
                        clipPath: 'polygon(0% 0%, 40% 0%, 40% 40%, 0% 40%, 0% 0%, 60% 60%, 100% 60%, 100% 100%, 60% 100%, 60% 60%)',
                        opacity: 0.9
                    }}
                />

                {/* 1.1 READABILITY OVERLAY */}
                <div
                    className="absolute inset-0 z-30 pointer-events-none"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.8) 100%)'
                    }}
                />
            </motion.div>

            {/* 5. GRAIN TEXTURE */}
            <div className="absolute inset-0 z-40 opacity-[0.03] pointer-events-none mix-blend-overlay grain-texture" />

            {/* HERO CONTENT */}
            <div className="relative z-50 max-w-[1100px] mx-auto text-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h1 className="font-display text-[84px] leading-[0.95] font-bold text-charcoal tracking-tighter mb-8 flex items-baseline justify-center gap-4">
                        Home, but make it
                        <span className="font-serif italic text-orange-600 font-light tracking-normal">
                            special
                        </span>
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 1 }}
                    className="text-2xl text-charcoal/60 mb-14 max-w-[650px] mx-auto font-light leading-relaxed"
                >
                    Experience the first intelligent design workspace.
                    <br />
                    Visualize, collaborate, and create better than ever.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="flex flex-col items-center gap-8"
                >
                    <div className="flex items-center gap-4">
                        <MagneticButton onClick={handleJoin}>
                            Join Early Access
                        </MagneticButton>
                        <button
                            className="px-10 py-5 border border-charcoal/10 text-charcoal font-display font-bold text-lg rounded-full hover:bg-charcoal/5 transition-all flex items-center gap-2 group"
                            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            See how it works
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <p className="text-xs font-mono tracking-[0.3em] uppercase text-charcoal/20">
                        Crafted for Visionaries
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

const MagneticButton: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => {
    const ref = useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
    const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        x.set((e.clientX - centerX) * 0.4);
        y.set((e.clientY - centerY) * 0.4);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{ x: springX, y: springY }}
            whileTap={{ scale: 0.95 }}
            className="px-12 py-5 bg-charcoal text-white rounded-full font-display font-bold text-lg relative overflow-hidden group shadow-2xl hover:bg-black transition-colors"
        >
            <span className="relative z-10">{children}</span>
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"
            />
        </motion.button>
    );
};

export default HomeownerHero;
