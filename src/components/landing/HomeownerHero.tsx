import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue, useScroll } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import sofa from '../../assets/images/hero/sofa.jpg';
import lamp from '../../assets/images/hero/lamp.jpg';
import marble from '../../assets/images/hero/marble.jpg';
import compass from '../../assets/images/hero/compass.jpg';
import { FlickeringGrid } from '../ui/FlickeringGrid';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const floatingItems = [
    {
        id: 'sofa',
        img: sofa,
        name: 'Velvet Sofa',
        x: '5%', y: '15%', depth: 2, scale: 1.1, rotate: -5,
        floatDuration: 6
    },
    {
        id: 'marble',
        img: marble,
        name: 'Marble Slab',
        x: '88%', y: '35%', depth: 1.5, scale: 0.8, rotate: 5,
        floatDuration: 7
    },
    {
        id: 'compass',
        img: compass,
        name: 'Drafting Compass',
        x: '12%', y: '75%', depth: 3, scale: 0.9, rotate: -15,
        floatDuration: 5
    },
    {
        id: 'lamp',
        img: lamp,
        name: 'Modern Lamp',
        x: '85%', y: '70%', depth: 2.5, scale: 1, rotate: 10,
        floatDuration: 4
    },
];

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
        x.set((e.clientX - centerX) * 0.3);
        y.set((e.clientY - centerY) * 0.3);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            ref={ref}
            className="relative px-10 py-5 bg-orange-600 text-white font-display font-bold text-lg rounded-full shadow-lg hover:bg-orange-700 transition-colors cursor-pointer interactive overflow-hidden group"
            style={{ x: springX, y: springY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            whileTap={{ scale: 0.95 }}
        >
            <span className="relative z-10">{children}</span>
        </motion.button>
    );
};

const HomeownerHero: React.FC = () => {
    const { signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothX = useSpring(mouseX, { stiffness: 40, damping: 30 });
    const smoothY = useSpring(mouseY, { stiffness: 40, damping: 30 });

    const handleJoin = async () => {
        try {
            await signInWithGoogle();
            navigate('/dashboard');
        } catch (error) {
            console.error("Sign in failed", error);
        }
    };

    useEffect(() => {
        const handleMouse = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouse);
        return () => window.removeEventListener('mousemove', handleMouse);
    }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center pt-[72px] overflow-hidden bg-[#Fdfdfd]">
            <FlickeringGrid
                className="absolute inset-0 z-0 size-full"
                squareSize={4}
                gridGap={6}
                color="#ea580c"
                maxOpacity={0.2}
                flickerChance={0.05}
            />

            {/* Ambient Background Gradient for Light Ray Visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-orange-50/30 to-transparent pointer-events-none z-0" />

            {/* 3D Parallax Items */}
            {floatingItems.map((item, i) => (
                <FloatingImage
                    key={item.id}
                    {...item}
                    mouseX={smoothX}
                    mouseY={smoothY}
                    index={i}
                />
            ))}

            <div className="relative z-10 max-w-[1100px] mx-auto text-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h1 className="font-display text-[84px] leading-[0.95] font-bold text-charcoal tracking-tighter mb-8 drop-shadow-sm flex items-baseline justify-center gap-4">
                        Home, but make it
                        <span className="font-serif italic text-orange-600 font-light tracking-normal">
                            special
                        </span>
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 1 }}
                    className="text-2xl text-charcoal/60 mb-14 max-w-[650px] mx-auto font-light leading-relaxed"
                >
                    Try before you buy. Consult before you cry.
                </motion.p>

                <div className="flex items-center gap-4 text-charcoal/60 text-sm justify-center mb-14">
                    <span className="flex items-center gap-1">
                        <CheckCircle2 size={16} className="text-orange-600" /> Limited spots available
                    </span>
                    <span className="flex items-center gap-1">
                        <CheckCircle2 size={16} className="text-orange-600" /> Secure your rank
                    </span>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.8, type: 'spring' }}
                    className="flex flex-col items-center gap-6"
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

                    <motion.button
                        whileHover={{ y: 2 }}
                        className="text-sm font-medium text-charcoal/40 hover:text-charcoal transition-colors interactive cursor-pointer"
                    >
                        See how it works ↓
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
};

interface FloatingImageProps {
    img: string;
    x: string;
    y: string;
    depth: number;
    scale: number;
    rotate: number;
    mouseX: any;
    mouseY: any;
    index: number;
    floatDuration: number;
}

const FloatingImage: React.FC<FloatingImageProps> = ({ img, x, y, depth, scale, rotate, mouseX, mouseY, index, floatDuration }) => {
    // Parallax: Inverse direction for depth feeling
    const range = 20 * depth;
    const moveX = useTransform(mouseX, [0, window.innerWidth], [range, -range]); // Inverted
    const moveY = useTransform(mouseY, [0, window.innerHeight], [range, -range]); // Inverted

    // Scroll Blur
    const { scrollY } = useScroll();
    const blur = useTransform(scrollY, [0, 400], ['blur(0px)', 'blur(8px)']);
    const opacity = useTransform(scrollY, [0, 400], [0.9, 0.4]);

    return (
        <motion.div
            className="absolute z-0 pointer-events-none"
            style={{
                left: x,
                top: y,
                x: moveX,
                y: moveY,
                filter: blur,
                opacity: opacity,
                width: 240 * scale,
            }}
            initial={{ opacity: 0, scale: 0.8, rotate: rotate - 10 }}
            animate={{ opacity: 1, scale: 1, rotate: rotate }}
            transition={{ delay: 0.2 + index * 0.1, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
            {/* Floating Loop Container */}
            <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{
                    duration: floatDuration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatType: "reverse"
                }}
            >
                <img
                    src={img}
                    alt="decor"
                    className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
                />
            </motion.div>
        </motion.div>
    );
}

export default HomeownerHero;
