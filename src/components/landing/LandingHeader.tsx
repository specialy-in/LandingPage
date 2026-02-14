import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../ui/Logo';

import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface LandingHeaderProps {
    role: 'homeowner' | 'pro';
    onToggle: () => void;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ role, onToggle }) => {
    const [scrolled, setScrolled] = useState(false);
    const { signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleJoin = async () => {
        try {
            await signInWithGoogle();
            navigate('/dashboard');
        } catch (error) {
            console.error("Sign in failed", error);
        }
    };

    const headerVariants = {
        top: {
            backgroundColor: 'rgba(255, 255, 255, 0)',
            backdropFilter: 'blur(0px)',
            borderBottomColor: 'rgba(0, 0, 0, 0)',
            paddingTop: '24px',
            paddingBottom: '24px',
        },
        scrolled: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            borderBottomColor: 'rgba(0, 0, 0, 0.05)',
            paddingTop: '12px',
            paddingBottom: '12px',
        }
    };

    return (
        <motion.header
            initial="top"
            animate={scrolled ? 'scrolled' : 'top'}
            variants={headerVariants}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 right-0 z-50 border-b"
        >
            <div className="max-w-[1400px] mx-auto px-8 flex items-center justify-between">
                {/* Logo */}
                <a href="/" className="interactive">
                    <Logo variant={role === 'homeowner' ? 'dark' : 'light'} />
                </a>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    {/* Sign In */}
                    <button
                        onClick={handleJoin}
                        className="text-sm font-medium text-charcoal/60 hover:text-charcoal transition-colors px-4 interactive"
                    >
                        Join the Loop
                    </button>

                    {/* Role Toggle - High Contrast Pill */}
                    <motion.button
                        onClick={onToggle}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 interactive shadow-lg relative overflow-hidden ${role === 'homeowner'
                            ? 'bg-charcoal text-white hover:bg-black'
                            : 'bg-white text-charcoal border-2 border-charcoal hover:bg-stone-50'
                            }`}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {role === 'homeowner' ? 'For Professionals' : 'For Homeowners'}
                            <ArrowIcon direction={role === 'homeowner' ? 'right' : 'left'} />
                        </span>
                    </motion.button>
                </div>
            </div>
        </motion.header>
    );
};

const ArrowIcon: React.FC<{ direction: 'left' | 'right' }> = ({ direction }) => (
    <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className={`transition-transform ${direction === 'left' ? 'rotate-180' : ''}`}
    >
        <path d="M5 12h14" />
        <path d="M12 5l7 7-7 7" />
    </svg>
);

export default LandingHeader;
