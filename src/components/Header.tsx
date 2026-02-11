import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Search, Settings, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Header: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const navLinks = [
        { name: 'Projects', path: '/dashboard' },
        { name: 'Our Magical Finds', path: '/marketplace' },
        { name: 'Browse Architects', path: '/architects' },
    ];

    const handleSignOut = async () => {
        try {
            // Assuming signOut is available from useAuth, otherwise just clear and nav
            if (signOut) await signOut();
            navigate('/');
        } catch (error) {
            console.error('Failed to sign out', error);
        }
    };

    // Close profile dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="sticky top-0 z-50 h-16 bg-gradient-to-r from-navy-start to-navy-end/90 backdrop-blur-md border-b border-white/10 transition-all duration-300">
            <div className="w-full px-12 h-full flex items-center justify-between relative">
                {/* Brand - Absolute Left or just Flex left */}
                <div className="flex items-center gap-12 h-full z-10">
                    <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-3 group">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-white to-gray-400 group-hover:opacity-90 transition-opacity shadow-lg shadow-white/10" />
                        <span className="text-lg font-sans font-bold tracking-tight text-white mb-0.5">dimensionloop</span>
                    </Link>
                </div>

                {/* Navigation - Absolute Center */}
                <div className="hidden md:flex items-center gap-8 h-full absolute left-1/2 -translate-x-1/2">
                    {navLinks.map((link) => {
                        const isActive = location.pathname.startsWith(link.path);
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`relative h-full flex items-center text-[14px] font-medium transition-colors duration-200 ${isActive
                                    ? 'text-orange-500'
                                    : 'text-gray-300 hover:text-white'
                                    }`}
                            >
                                {link.name}
                                {isActive && (
                                    <motion.span
                                        layoutId="nav-underline"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-6 z-10">
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group"
                        >
                            <span className="text-xs text-gray-400 font-medium hidden sm:block">
                                Hi, {user?.displayName?.split(' ')[0] || 'Designer'}
                            </span>
                            {user?.photoURL ? (
                                <div className="p-[2px] rounded-full bg-gradient-to-br from-cyan-400 to-purple-500">
                                    <img
                                        src={user.photoURL}
                                        alt="User"
                                        className="w-8 h-8 rounded-full border-2 border-[#0A0E27] object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-[#0A0E27] flex items-center justify-center text-gray-400">
                                        <UserIcon size={14} />
                                    </div>
                                </div>
                            )}
                            <div className="w-5 h-5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                                <ChevronDown size={14} />
                            </div>
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute right-0 top-full mt-2 w-60 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl py-2 z-50 overflow-hidden"
                                >
                                    <div className="px-4 py-3 border-b border-white/10 mb-2">
                                        <p className="text-sm font-medium text-white truncate">{user?.displayName || 'User'}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors">
                                        <Settings size={16} /> Account Settings
                                    </button>
                                    <div className="h-px bg-white/5 my-2" />
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
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
