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
            className={`max-w-7xl mx-auto px-8 py-12 ${className}`}
        >
            {children}
        </motion.div>
    );
};
