import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LandingHeader from './landing/LandingHeader';
import HomeownerHero from './landing/HomeownerHero';
import HowItWorks from './landing/HowItWorks';
import MagicalFinds from './landing/MagicalFinds';
import ProNetwork from './landing/ProNetwork';
import ProHero from './landing/ProHero';
import ThreeWayWin from './landing/ThreeWayWin';
import FeatureStacks from './landing/FeatureStacks';
import CompetitiveTransform from './landing/CompetitiveTransform';
import Pricing from './landing/Pricing';
import Testimonials from './landing/Testimonials';
import Footer from './landing/Footer';
import { SmoothCursor } from './ui/SmoothCursor';

const LandingPage: React.FC = () => {
    const [role, setRole] = useState<'homeowner' | 'pro'>('homeowner');
    const [direction, setDirection] = useState(0);

    const handleToggle = () => {
        setDirection(role === 'homeowner' ? 1 : -1);
        setRole((prev) => (prev === 'homeowner' ? 'pro' : 'homeowner'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- Referral Capture ---
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
            console.log("Captured Referral:", ref);
            sessionStorage.setItem('referredBy', ref);
        }
    }, []);

    // Enhanced Wipe Transition Variants
    const pageVariants = {
        initial: (direction: number) => ({
            clipPath: direction > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)',
            opacity: 1,
            zIndex: 10
        }),
        animate: {
            clipPath: 'inset(0 0 0 0)',
            opacity: 1,
            zIndex: 10,
            transition: {
                duration: 0.8,
                ease: [0.76, 0, 0.24, 1],
                opacity: { duration: 0.2 }
            }
        },
        exit: (direction: number) => ({
            clipPath: direction > 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)',
            opacity: 1,
            zIndex: 1,
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
        })
    };

    const overlayVariants = {
        initial: (direction: number) => ({
            scaleX: 0,
            originX: direction > 0 ? 1 : 0
        }),
        animate: {
            scaleX: [0, 1, 0],
            originX: [null, null, direction > 0 ? 0 : 1],
            transition: {
                duration: 1.2,
                times: [0, 0.5, 1],
                ease: [0.76, 0, 0.24, 1]
            }
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 overflow-x-hidden relative selection:bg-orange-200 selection:text-orange-900 cursor-none">
            {/* Global Grain Texture */}
            <div className="grain-texture" />

            <SmoothCursor />
            <DraggableSticker />

            <LandingHeader role={role} onToggle={handleToggle} />

            {/* Transition Overlay */}
            <motion.div
                key={`overlay-${role}`}
                custom={direction}
                variants={overlayVariants}
                initial="initial"
                animate="animate"
                className="fixed inset-0 bg-charcoal z-[100] pointer-events-none"
            />

            <AnimatePresence mode="wait" custom={direction}>
                {role === 'homeowner' ? (
                    <motion.div
                        key="homeowner"
                        custom={direction}
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="bg-white min-h-screen relative z-10 origin-top"
                    >
                        <HomeownerHero />
                        <HowItWorks />
                        <MagicalFinds />
                        <ProNetwork />
                    </motion.div>
                ) : (
                    <motion.div
                        key="pro"
                        custom={direction}
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="bg-slate-50 min-h-screen relative z-10 origin-top"
                    >
                        <ProHero />
                        <ThreeWayWin />
                        <FeatureStacks />
                        <CompetitiveTransform />
                        <Pricing />
                        <Testimonials />
                    </motion.div>
                )}
            </AnimatePresence>
            <Footer />
        </div>
    );
};

const DraggableSticker = () => {
    return (
        <motion.div
            drag
            dragConstraints={{ left: 0, right: 300, top: 0, bottom: 500 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileDrag={{ scale: 1.2, rotate: 10, cursor: 'grabbing' }}
            className="fixed bottom-8 right-8 z-[500] pointer-events-auto cursor-grab hidden lg:block"
        >
            <div className="bg-yellow-300 text-charcoal border-2 border-charcoal px-4 py-3 rounded-tr-xl rounded-bl-xl shadow-[4px_4px_0px_#1a1a1a] font-display font-bold text-xs uppercase tracking-wider transform -rotate-6">
                I'm just here for<br />the aesthetic ✨
            </div>
        </motion.div>
    );
}

export default LandingPage;
