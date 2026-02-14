import React, { ReactNode } from 'react';
import { Header } from './Header';
import '../styles/design-tokens.css';

interface AuthenticatedLayoutProps {
    children: ReactNode;
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] to-[#111827] text-gray-100 font-sans selection:bg-orange-500/30 relative">
            {/* Grain Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
            />
            <Header />
            {children}
        </div>
    );
};
