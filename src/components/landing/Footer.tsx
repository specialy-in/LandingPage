import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Instagram, Twitter, Linkedin } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../ui/Logo';

const Footer: React.FC = () => {
    const footerRef = useRef<HTMLElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const { signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    // Parallax effect for the background text
    const springConfig = { stiffness: 100, damping: 30, mass: 0.5 };
    const bgX = useSpring(useTransform(mouseX, [0, 1920], [20, -20]), springConfig);
    const bgY = useSpring(useTransform(mouseY, [0, 1080], [10, -10]), springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    const handleJoin = async () => {
        try {
            await signInWithGoogle();
            navigate('/dashboard');
        } catch (error) {
            console.error("Sign in failed", error);
        }
    };

    return (
        <footer
            ref={footerRef}
            className="relative bg-[#0A0A0F] text-white pt-48 pb-12 overflow-hidden"
        >
            {/* Massive Background Parallax Text */}
            <motion.div
                style={{ x: bgX, y: bgY }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
            >
                <h2 className="text-[25vw] font-display font-black text-white/[0.03] leading-none select-none tracking-tighter">
                    SPECIALY
                </h2>
            </motion.div>

            <div className="relative z-10 max-w-[1200px] mx-auto px-8 flex flex-col items-center text-center">
                {/* Reveal Animation for Content */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h2 className="font-serif text-6xl md:text-8xl mb-6 tracking-tight italic font-light">
                        Stay special.
                    </h2>
                    <p className="text-white/40 font-mono text-sm tracking-[0.2em] uppercase mb-12">
                        The loop is open. Join us.
                    </p>

                    <MagneticButton onClick={handleJoin}>
                        Join the Loop
                    </MagneticButton>
                </motion.div>

                {/* Bottom Bar */}
                <div className="w-full mt-48 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    {/* Left: Metadata */}
                    <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.3em] uppercase text-white/30">
                        <span>© 2026</span>
                        <Logo className="scale-75 origin-left" variant="light" />
                    </div>

                    {/* Center: Crafted Message */}
                    <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/20">
                        Crafted with <span className="text-lg vertical-middle">☕</span> in India
                    </div>

                    {/* Right: Socials */}
                    <div className="flex items-center gap-6">
                        <SocialIcon icon={<Instagram size={16} />} href="#" />
                        <SocialIcon icon={<Twitter size={16} />} href="#" />
                        <SocialIcon icon={<Linkedin size={16} />} href="#" />
                        <div className="w-px h-4 bg-white/10 mx-2" />
                        <SocialIcon
                            icon={<div className="p-1.5 bg-white/5 rounded-lg border border-white/10 group-hover:border-orange-600/50 transition-colors"><Instagram size={14} className="opacity-0 absolute" /><span className="text-xs">✉️</span></div>}
                            href="mailto:contact@specialy.in"
                            label="contact@specialy.in"
                        />
                    </div>
                </div>
            </div>

            {/* Draggable Easter Egg */}
            <motion.div
                drag
                dragConstraints={footerRef}
                whileHover={{ scale: 1.1 }}
                className="absolute right-8 bottom-8 z-20 group cursor-grab active:cursor-grabbing hidden md:block"
            >
                <div className="relative">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full right-0 mb-4 whitespace-nowrap bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-mono tracking-widest text-white/40 pointer-events-none">
                        You scrolled all the way down here? 🫡
                    </div>
                    <div className="w-10 h-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-xl grayscale hover:grayscale-0 transition-all duration-300">
                        🛋️
                    </div>
                </div>
            </motion.div>
        </footer>
    );
};

const MagneticButton: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => {
    const ref = useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        x.set((e.clientX - centerX) * 0.5);
        y.set((e.clientY - centerY) * 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            ref={ref}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: springX, y: springY }}
            className="group relative px-12 py-5 bg-orange-600 text-white rounded-full font-display font-bold text-lg overflow-hidden shadow-[0_10px_40px_rgba(234,88,12,0.3)] hover:bg-orange-700 transition-colors"
        >
            <span className="relative z-10">{children}</span>
            <motion.div
                className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
            />
        </motion.button>
    );
};

const SocialIcon: React.FC<{ icon: React.ReactNode; href: string; label?: string }> = ({ icon, href, label }) => (
    <motion.a
        href={href}
        whileHover={{ y: -2, scale: 1.1 }}
        className="flex items-center gap-2 text-[#94949F] hover:text-white transition-colors duration-300"
    >
        {icon}
        {label && <span className="text-[10px] font-mono tracking-widest uppercase">{label}</span>}
    </motion.a>
);

export default Footer;
