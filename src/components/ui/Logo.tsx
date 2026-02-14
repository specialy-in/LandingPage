import React from 'react';

interface LogoProps {
    className?: string;
    variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'dark' }) => {
    return (
        <div className={`flex items-center gap-1 group select-none ${className}`}>
            <span className={`font-display text-2xl font-bold tracking-tight transition-colors ${variant === 'light' ? 'text-white' : 'text-charcoal'
                }`}>
                Specialy
            </span>
            <span className="w-2 h-2 rounded-full bg-orange-600 mt-1" />
        </div>
    );
};
