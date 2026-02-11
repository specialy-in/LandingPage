import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterOption {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}

interface UniversalFilterBarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    filters: FilterOption[];
    count: number;
    countLabel?: string;
    sortOptions: string[];
    sortBy: string;
    onSortChange: (value: string) => void;
    rightAction?: ReactNode;
}

const FilterDropdown: React.FC<{
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}> = ({ label, value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${value !== label && value !== `All ${label}s` && value !== `Any ${label}` && value !== `All ${label}`
                    ? 'text-orange-500 bg-orange-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/[0.05]'
                    }`}
            >
                <span className="truncate max-w-[120px]">{value === `All ${label}s` || value === `Any ${label}` || value === `All ${label}` ? label : value}</span>
                <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute top-full left-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl py-1 z-50 shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl"
                    >
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => { onChange(option); setIsOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === option ? 'text-orange-500 bg-white/[0.03]' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const UniversalFilterBar: React.FC<UniversalFilterBarProps> = ({
    searchQuery,
    onSearchChange,
    searchPlaceholder = "Search...",
    filters,
    count,
    countLabel = "items",
    sortOptions,
    sortBy,
    onSortChange,
    rightAction
}) => {
    return (
        <div className="relative z-40 h-14 w-full flex items-center bg-slate-950/20 backdrop-blur-md border-y border-white/[0.05] px-4 mb-8">
            {/* Left Section: Search */}
            <div className="relative w-[400px] h-full flex items-center">
                <Search className="absolute left-0 text-gray-500" size={18} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full h-full pl-8 pr-4 bg-transparent border-none text-gray-200 placeholder-gray-600 text-sm focus:ring-0 outline-none"
                />
            </div>

            {/* Vertical Divider */}
            <div className="w-px h-6 bg-white/[0.1] mx-6" />

            {/* Center Section: Filters */}
            <div className="flex items-center gap-2">
                {filters.map((filter, idx) => (
                    <FilterDropdown
                        key={idx}
                        label={filter.label}
                        value={filter.value}
                        options={filter.options}
                        onChange={filter.onChange}
                    />
                ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right Section: Stats, Sort & Action */}
            <div className="flex items-center gap-8">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                    {count} {countLabel}
                </span>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Sort by</span>
                    <FilterDropdown
                        label="Sort"
                        value={sortBy}
                        options={sortOptions}
                        onChange={onSortChange}
                    />
                </div>

                {rightAction && (
                    <div className="pl-6 border-l border-white/[0.1]">
                        {rightAction}
                    </div>
                )}
            </div>
        </div>
    );
};
