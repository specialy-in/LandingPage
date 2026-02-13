import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageContainerProps {
    children: ReactNode;
    className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`max-w-[1600px] mx-auto px-8 md:px-20 py-12 ${className}`}
        >
            {children}
        </motion.div>
    );
};
