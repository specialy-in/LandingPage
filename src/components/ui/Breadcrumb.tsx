import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
            <Link
                to="/dashboard"
                className="text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
            >
                <Home size={14} />
                <span className="sr-only">Home</span>
            </Link>

            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <ChevronRight size={12} className="text-gray-600" />
                    {item.href ? (
                        <Link
                            to={item.href}
                            className="text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-gray-300">{item.label}</span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};
