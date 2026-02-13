import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Settings, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

    const handleSignOut = async () => {
        try {
            if (signOut) await signOut();
            navigate('/');
        } catch (error) {
            console.error('Failed to sign out', error);
        }
    };

    return (
        <nav className="sticky top-0 z-50 h-20 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
            <div className="w-full h-full max-w-[1800px] mx-auto px-8 md:px-12 flex items-center justify-between">

                {/* 1. Logo */}
                <Link to="/dashboard" className="flex items-center gap-1 group">
                    <span className="text-2xl font-bold text-white tracking-tight group-hover:text-orange-500 transition-colors">
                        Specialy
                    </span>
                    <span className="w-2 h-2 rounded-full bg-orange-600 mt-1 group-hover:scale-125 transition-transform" />
                </Link>

                {/* 2. Navigation Tabs (Centered) */}
                <div className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2 h-full gap-8">
                    {navTabs.map((tab) => {
                        const isActive = currentTab === tab.id;
                        return (
                            <Link
                                key={tab.id}
                                to={tab.path}
                                className="relative h-full flex items-center px-2 group"
                            >
                                <span className={`text-xs font-bold tracking-[0.15em] transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
                                    }`}>
                                    {tab.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-underline"
                                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.5)]"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
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
                            className="flex items-center gap-3 py-1 pl-1 pr-3 rounded-full hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
                        >
                            {user?.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt="User"
                                    className="w-9 h-9 rounded-full object-cover border border-white/10 group-hover:border-orange-500/50 transition-colors"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-[#1A1A20] flex items-center justify-center text-gray-500 border border-white/10">
                                    <UserIcon size={16} />
                                </div>
                            )}
                            <div className="hidden sm:block text-left">
                                <p className="text-xs font-bold text-white group-hover:text-orange-500 transition-colors">
                                    {user?.displayName?.split(' ')[0] || 'Member'}
                                </p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Premium</p>
                            </div>
                            <ChevronDown size={14} className="text-gray-600 group-hover:text-white transition-colors" />
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute right-0 top-full mt-4 w-56 bg-[#0A0A0F] border border-white/10 rounded-xl shadow-2xl py-2 z-50 overflow-hidden"
                                >
                                    <div className="px-4 py-3 border-b border-white/10 mb-2">
                                        <p className="text-sm font-medium text-white truncate">{user?.displayName || 'User'}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors">
                                        <Settings size={16} /> Account Settings
                                    </button>
                                    <div className="h-px bg-white/5 my-2" />
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-500/80 hover:bg-red-500/10 hover:text-red-500 flex items-center gap-3 transition-colors"
                                    >
                                        <LogOut size={16} /> Sign Out
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
