import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Move, Users } from 'lucide-react';

import step1 from '../../assets/images/step1.jpg';
import step2 from '../../assets/images/step2.jpg';
import step3 from '../../assets/images/step3.jpg';

const steps = [
    {
        id: 'step1',
        number: '01',
        title: 'Take a photo',
        icon: Camera,
        text: 'Even a blurry one works. We\'re not judging.',
        image: step1
    },
    {
        id: 'step2',
        number: '02',
        title: 'Visualize instantly',
        icon: Move,
        text: 'Drag, drop, visualize. Feel the relief.',
        image: step2
    },
    {
        id: 'step3',
        number: '03',
        title: 'Hire a pro',
        icon: Users,
        text: 'Literally. They\'ll move the furniture too.',
        image: step3
    }
];

const HowItWorks: React.FC = () => {
    const [activeStep, setActiveStep] = useState<string | null>(null);

    return (
        <section className="py-32 bg-stone-50 relative overflow-hidden">
            {/* Background Hover Preview */}
            <div className="absolute inset-0 pointer-events-none">
                <AnimatePresence>
                    {activeStep && (
                        <motion.div
                            key={activeStep}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0"
                        >
                            <img
                                src={steps.find(s => s.id === activeStep)?.image}
                                alt=""
                                className="w-full h-full object-cover opacity-60"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="max-w-[1200px] mx-auto px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-24"
                >
                    <span className="text-orange-600 font-display font-semibold text-sm tracking-widest uppercase mb-4 block">
                        How it works
                    </span>
                    <h2 className="font-display text-[56px] leading-tight font-bold text-charcoal tracking-tighter">
                        Three steps to a<br />better home
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            onMouseEnter={() => setActiveStep(step.id)}
                            onMouseLeave={() => setActiveStep(null)}
                            className="flex flex-col items-center text-center group interactive cursor-pointer"
                        >
                            {/* Icon Circle */}
                            <div className="w-24 h-24 rounded-full border border-stone-200 bg-white flex items-center justify-center mb-8 relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:border-orange-600 group-hover:shadow-[0_0_30px_rgba(234,88,12,0.15)]">
                                <step.icon size={32} className="text-charcoal group-hover:text-orange-600 transition-colors" />
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-charcoal text-white flex items-center justify-center text-xs font-bold">
                                    {step.number}
                                </div>
                            </div>

                            <h3 className="font-display text-2xl font-bold text-charcoal mb-3 group-hover:text-orange-600 transition-colors">
                                {step.title}
                            </h3>
                            <p className="font-serif italic text-charcoal/50 max-w-[240px]">
                                {step.text}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
