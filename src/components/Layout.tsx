import React, { ReactNode } from 'react';
import { Header } from './Header';
import '../styles/design-tokens.css';

interface AuthenticatedLayoutProps {
    children: ReactNode;
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen text-gray-100 font-sans selection:bg-orange-500/30" style={{ backgroundColor: '#0A0E27' }}>
            <Header />
            {children}
        </div>
    );
};
