import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Eye, ArrowRight } from 'lucide-react';
import chair from '../../assets/images/products/chair.jpg';
import diffuser from '../../assets/images/products/diffuser.jpg';
import pendant from '../../assets/images/products/pendant.jpg';
import vases from '../../assets/images/products/vases.jpg';

const products = [
    {
        id: 1,
        name: 'Terra Trio Vases',
        brand: 'Earth & Fire',
        price: '₹4,499',
        image: vases,
        gridClass: 'md:col-span-2 md:row-span-2 aspect-square', // Prominent 2x2
    },
    {
        id: 2,
        name: 'Cloud Armchair',
        brand: 'Specialy Studio',
        price: '₹28,000',
        image: chair,
        gridClass: 'md:col-span-2 md:row-span-1 aspect-video', // Wide 2x1
    },
    {
        id: 3,
        name: 'Lunar Diffuser',
        brand: 'Aroma Lab',
        price: '₹3,200',
        image: diffuser,
        gridClass: 'md:col-span-1 md:row-span-1 aspect-square', // Small 1x1
    },
    {
        id: 4,
        name: 'Amber Globe',
        brand: 'Glow Design',
        price: '₹12,500',
        image: pendant,
        gridClass: 'md:col-span-1 md:row-span-1 aspect-square', // Small 1x1
    },
];

const MagneticLink = ({ children }: { children: React.ReactNode }) => {
    const ref = useRef<HTMLDivElement>(null);
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
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: springX, y: springY }}
            className="cursor-pointer group"
        >
            {children}
            <motion.div
                className="h-[1px] bg-charcoal w-0 group-hover:w-full transition-all duration-300 mt-1"
            />
        </motion.div>
    );
};

const MagicalFinds: React.FC = () => {
    return (
        <section className="py-32 bg-white relative overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-6">

                {/* Header Section with Overlap */}
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 relative z-20">
                    <div className="relative">
                        <motion.h2
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="font-display text-[64px] md:text-[96px] leading-[0.9] font-bold text-charcoal tracking-tighter"
                        >
                            Our Magical<br />
                            <span className="font-serif italic text-orange-600 font-light">Finds</span>
                        </motion.h2>

                    </div>

                    <div className="mb-4 md:mb-8">
                        <MagneticLink>
                            <span className="flex items-center gap-2 font-medium text-lg text-charcoal">
                                Explore the full library <ArrowRight size={20} />
                            </span>
                        </MagneticLink>
                    </div>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 -mt-10 relative z-10">
                    {products.map((product, index) => (
                        <Card key={product.id} product={product} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};

interface CardProps {
    product: any;
    index: number;
}

const Card: React.FC<CardProps> = ({ product, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
                delay: index * 0.1,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1]
            }}
            className={`group relative rounded-2xl overflow-hidden bg-stone-200 ${product.gridClass}`}
        >
            <div className="absolute inset-0 border border-white/10 pointer-events-none z-20 rounded-2xl" />

            {/* Image */}
            <motion.div
                className="w-full h-full"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:brightness-110 group-hover:sepia-[.15] transition-all duration-500"
                />
            </motion.div>

            {/* Glass Reveal Info Panel */}
            <div className="absolute inset-x-0 bottom-0 p-6 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.22,1,0.36,1]">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] flex items-end justify-between">
                    <div>
                        <p className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-1">
                            {product.brand}
                        </p>
                        <h3 className="font-serif italic text-2xl text-white mb-2 leading-none">
                            {product.name}
                        </h3>
                    </div>

                    <button className="h-10 px-5 rounded-full border border-white/30 text-white text-sm font-semibold hover:bg-white hover:text-charcoal transition-all duration-300">
                        Visualise
                    </button>
                </div>
            </div>

            {/* Default State Gradient (To ensure text legibility before hover if needed, though we hide text) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />
        </motion.div>
    );
};

export default MagicalFinds;
