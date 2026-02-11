import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue, useScroll, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import polaroidFrame from '../../assets/images/hero/polaroid-frame.png';
import sofaImg from '../../assets/images/hero/sofa-new.jpg';
import lampImg from '../../assets/images/hero/lamp-new.jpg';
import roomImg from '../../assets/images/hero/room-split.jpg';
import marbleImg from '../../assets/images/hero/marble.jpg';

import { FlickeringGrid } from '../ui/FlickeringGrid';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const polaroidItems = [
    {
        id: 'frame1',
        photo: roomImg,
        noteText: 'The Perfect Split',
        position: { top: '10%', left: '8%' },
        rotate: -5,
        parallaxWeight: -0.2,
        noteColor: '#FEF9C3' // Soft Yellow
    },
    {
        id: 'frame2',
        photo: lampImg,
        noteText: 'Golden Hour',
        position: { top: '15%', right: '12%' },
        rotate: 8,
        parallaxWeight: -0.25,
        noteColor: '#FFEDD5' // Soft Orange
    },
    {
        id: 'frame3',
        photo: sofaImg,
        noteText: 'Level Up',
        position: { bottom: '20%', left: '15%' },
        rotate: -12,
        parallaxWeight: -0.35,
        noteColor: '#DCFCE7' // Soft Green
    },
    {
        id: 'frame4',
        photo: marbleImg,
        noteText: 'Texture & Tone',
        position: { bottom: '25%', right: '18%' },
        rotate: 3,
        parallaxWeight: -0.4,
        noteColor: '#DBEAFE' // Soft Blue
    },
];

const PolaroidItem: React.FC<{
    photo: string;
    noteText: string;
    position: React.CSSProperties;
    rotate: number;
    parallaxWeight: number;
    noteColor: string;
    mouseX: any;
    mouseY: any;
}> = ({ photo, noteText, position, rotate, parallaxWeight, noteColor, mouseX, mouseY }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Parallax movement
    const moveX = useTransform(mouseX, [0, window.innerWidth], [100 * parallaxWeight, -100 * parallaxWeight]);
    const moveY = useTransform(mouseY, [0, window.innerHeight], [100 * parallaxWeight, -100 * parallaxWeight]);

    return (
        <motion.div
            className="absolute z-0 pointer-events-auto"
            style={{
                ...position,
                x: moveX,
                y: moveY,
                rotate: rotate,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{
                y: isHovered ? -10 : 0,
                scale: isHovered ? 1.05 : 1
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            <div className="relative w-64 aspect-[4/5] drop-shadow-2xl group cursor-pointer">
                {/* Product Photo - The "Developing" Effect */}
                <motion.div
                    className="absolute inset-x-[11.5%] top-[9.5%] bottom-[23.5%] overflow-hidden bg-[#222]"
                    initial={{ opacity: 0, filter: 'blur(10px) grayscale(100%)' }}
                    animate={{
                        opacity: isHovered ? 1 : 0,
                        filter: isHovered ? 'blur(0px) grayscale(0%)' : 'blur(10px) grayscale(100%)',
                    }}
                    transition={{
                        duration: 1.2,
                        ease: "easeOut",
                        delay: isHovered ? 0.2 : 0
                    }}
                >
                    <img
                        src={photo}
                        className="w-full h-full object-cover"
                        alt="Product"
                    />
                </motion.div>

                {/* Sticky Note - The Cover */}
                <motion.div
                    className="absolute top-4 left-4 right-4 h-24 z-20 shadow-lg flex items-center justify-center p-4 origin-top"
                    style={{ backgroundColor: noteColor }}
                    initial={{ rotateX: 0 }}
                    animate={{
                        rotateX: isHovered ? 110 : 0,
                        opacity: isHovered ? 0 : 1
                    }}
                    transition={{
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1]
                    }}
                >
                    <p className="font-['Kalam'] text-charcoal/80 text-xl font-bold rotate-[-2deg]">
                        {noteText}
                    </p>
                    {/* Tape piece effect */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-white/40 backdrop-blur-sm rotate-2" />
                </motion.div>

                {/* Polaroid Frame Image */}
                <img
                    src={polaroidFrame}
                    className="relative z-10 w-full h-full pointer-events-none select-none"
                    alt="Polaroid Frame"
                />
            </div>
        </motion.div>
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
    const smoothX = useSpring(mouseX, { stiffness: 50, damping: 30 });
    const smoothY = useSpring(mouseY, { stiffness: 50, damping: 30 });

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

            {/* Ambient Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-orange-50/30 to-transparent pointer-events-none z-0" />

            {/* Interactive Polaroids */}
            {polaroidItems.map((item) => (
                <PolaroidItem
                    key={item.id}
                    {...item}
                    mouseX={smoothX}
                    mouseY={smoothY}
                />
            ))}

            <div className="relative z-10 max-w-[1100px] mx-auto text-center px-4 pointer-events-none">
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

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.8, type: 'spring' }}
                    className="flex flex-col items-center gap-6 pointer-events-auto"
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

export default HomeownerHero;
