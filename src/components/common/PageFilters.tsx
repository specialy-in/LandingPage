import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, AlignLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterOption {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}

interface PageFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    filters: FilterOption[];
    count: number;
    countLabel?: string;
    sortOptions: string[];
    sortBy: string;
    onSortChange: (value: string) => void;
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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${value !== label && value !== `All ${label}s` && value !== `Any ${label}`
                        ? 'text-orange-500 bg-orange-500/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
            >
                <span className="truncate max-w-[120px]">{value === `All ${label}s` || value === `Any ${label}` ? label : value}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute top-full left-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl py-1 z-50 shadow-2xl shadow-black/50 overflow-hidden"
                    >
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => { onChange(option); setIsOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${value === option ? 'text-orange-500 bg-white/[0.03]' : 'text-gray-300 hover:bg-white/5'
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

export const PageFilters: React.FC<PageFiltersProps> = ({
    searchQuery,
    onSearchChange,
    searchPlaceholder = "Search...",
    filters,
    count,
    countLabel = "items",
    sortOptions,
    sortBy,
    onSortChange
}) => {
    return (
        <div className="h-14 w-full flex items-center justify-between border-b border-white/[0.05] mb-10">
            {/* Left Section: Search & Filters */}
            <div className="flex items-center h-full">
                {/* Search Input - Fixed Width */}
                <div className="relative w-[400px] h-full flex items-center">
                    <Search className="absolute left-0 text-gray-500" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full h-full pl-8 pr-4 bg-transparent border-none text-gray-200 placeholder-gray-600 text-sm focus:ring-0 outline-none"
                    />
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-white/[0.1] mx-6" />

                {/* Dynamic Filters */}
                <div className="flex items-center gap-4">
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
            </div>

            {/* Right Section: Stats & Sort */}
            <div className="flex items-center gap-6">
                <span className="text-xs text-gray-500">{count} {countLabel}</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 uppercase tracking-wider font-medium">Sort by</span>
                    <FilterDropdown
                        label="Sort"
                        value={sortBy}
                        options={sortOptions}
                        onChange={onSortChange}
                    />
                </div>
            </div>
        </div>
    );
};
