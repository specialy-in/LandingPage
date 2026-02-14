import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Settings, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './ui/Logo';

export const Header: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const currentTab = searchParams.get('tab') || 'projects';

    const navTabs = [
        { id: 'projects', label: 'PROJECTS', path: '/dashboard?tab=projects' },
        { id: 'marketplace', label: 'MAGICAL FINDS', path: '/dashboard?tab=marketplace' },
        { id: 'architects', label: 'BROWSE PROS', path: '/dashboard?tab=architects' },
    ];

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSignOut = async () => {
        try {
            if (signOut) await signOut();
            navigate('/');
        } catch (error) {
            console.error('Failed to sign out', error);
        }
    };

    return (
        <nav className="sticky top-0 z-50 border-b border-white/[0.06] transition-all duration-300"
            style={{
                background: 'linear-gradient(to right, rgba(10,10,15,0.85), rgba(17,24,39,0.85))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            }}
        >
            <div className="w-full h-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

                {/* 1. Logo */}
                <Link to="/dashboard">
                    <Logo variant="light" />
                </Link>

                {/* 2. Navigation Tabs — Pill Style (matching Pro Dashboard) */}
                <div className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
                    {navTabs.map((tab) => {
                        const isActive = currentTab === tab.id;
                        return (
                            <Link
                                key={tab.id}
                                to={tab.path}
                                className={`relative px-5 py-2.5 text-xs font-semibold tracking-wider rounded-lg transition-all flex items-center gap-2 ${isActive
                                    ? 'text-white'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeHomeTab"
                                        className="absolute inset-0 bg-white/[0.08] border border-white/[0.1] rounded-lg"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                    />
                                )}
                                <span className="relative z-10">{tab.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* 3. Profile */}
                <div className="flex items-center gap-6">

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-3 py-1 pl-1 pr-3 rounded-full hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all group"
                        >
                            {user?.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt="User"
                                    className="w-8 h-8 rounded-full object-cover border border-white/10 group-hover:border-orange-500/50 transition-colors"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-gray-500 border border-white/[0.08]">
                                    <UserIcon size={14} />
                                </div>
                            )}
                            <div className="hidden sm:block text-left">
                                <p className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors">
                                    {user?.displayName?.split(' ')[0] || 'Member'}
                                </p>
                            </div>
                            <ChevronDown size={13} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-3 w-56 bg-[#12121A] border border-white/[0.08] rounded-xl shadow-2xl py-2 z-50 overflow-hidden"
                                >
                                    <div className="px-4 py-3 border-b border-white/[0.06] mb-2">
                                        <p className="text-sm font-medium text-white truncate">{user?.displayName || 'User'}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-white/[0.04] hover:text-white flex items-center gap-3 transition-colors">
                                        <Settings size={15} /> Account Settings
                                    </button>
                                    <div className="h-px bg-white/[0.04] my-1.5 mx-3" />
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-500/70 hover:bg-red-500/10 hover:text-red-400 flex items-center gap-3 transition-colors"
                                    >
                                        <LogOut size={15} /> Sign Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </nav>
    );
};
