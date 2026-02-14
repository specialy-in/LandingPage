import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { LogOut, FolderKanban, Users, Wallet, Loader2 } from 'lucide-react';

import { LayoutPro } from './LayoutPro';
import ProjectsTab from './pro/ProjectsTab';
import ClientsTab from './pro/ClientsTab';
import EarningsTab from './pro/EarningsTab';

// Allowed email for dev access
const PRO_ALLOWED_EMAIL = 'safasoudagar06@gmail.com';

type TabKey = 'projects' | 'clients' | 'earnings';

const TAB_CONFIG: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'projects', label: 'PROJECTS', icon: <FolderKanban size={16} /> },
    { key: 'clients', label: 'CLIENTS', icon: <Users size={16} /> },
    { key: 'earnings', label: 'EARNINGS', icon: <Wallet size={16} /> },
];

const ProDashboard: React.FC = () => {
    const { user, loading: authLoading, signOut } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [userPlan, setUserPlan] = useState<string>('plus');
    const [userRole, setUserRole] = useState<string>('');
    const [dataLoading, setDataLoading] = useState(true);

    const activeTab = (searchParams.get('view') as TabKey) || 'projects';

    // Guard: Only allowed email
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate('/', { replace: true });
            return;
        }
        if (user.email !== PRO_ALLOWED_EMAIL) {
            toast.error('Dev Access Only', { icon: '🔒', duration: 3000 });
            navigate('/onboarding', { replace: true });
        }
    }, [user, authLoading, navigate]);

    // Fetch user data
    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setUserPlan(data.selectedPlan || 'plus');
                setUserRole(data.role || '');
            }
            setDataLoading(false);
        });
        return () => unsub();
    }, [user]);

    const switchTab = (tab: TabKey) => {
        setSearchParams({ view: tab });
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    // Determine plan display
    const isMaxPlan = userRole === 'professional3k' || userPlan?.toLowerCase() === 'max';
    const planLabel = isMaxPlan ? 'Max' : 'Plus';

    if (authLoading || dataLoading) {
        return (
            <LayoutPro>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 size={32} className="text-orange-500 animate-spin" />
                </div>
            </LayoutPro>
        );
    }

    if (!user || user.email !== PRO_ALLOWED_EMAIL) return null;

    return (
        <LayoutPro>
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: '#1a1a2e',
                        color: '#e2e8f0',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        fontSize: '13px'
                    }
                }}
            />

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Pro Header */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        {/* Branded Logo */}
                        <div className="flex items-center gap-1 select-none">
                            <span className="font-display text-2xl font-bold tracking-tight text-white">
                                Specialy
                            </span>
                            <span className="w-2 h-2 rounded-full bg-orange-600 mt-1" />
                        </div>
                        <div className="h-6 w-px bg-white/10" />
                        {isMaxPlan ? (
                            <span className="text-sm font-bold tracking-wide bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
                                MAX
                            </span>
                        ) : (
                            <span className="text-sm font-bold tracking-wide text-orange-400">
                                PLUS
                            </span>
                        )}
                    </div>

                    {/* User */}
                    <div className="flex items-center gap-3">
                        {user.photoURL && (
                            <img
                                src={user.photoURL}
                                alt=""
                                className="w-8 h-8 rounded-full border border-white/10"
                            />
                        )}
                        <span className="text-sm text-gray-400 hidden sm:block">{user.displayName || user.email}</span>
                        <button
                            onClick={handleSignOut}
                            className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors text-gray-500 hover:text-gray-300"
                            title="Sign Out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </header>

                {/* Tabs */}
                <nav className="flex gap-1 mb-8 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
                    {TAB_CONFIG.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => switchTab(tab.key)}
                            className={`relative px-5 py-2.5 text-xs font-semibold tracking-wider rounded-lg transition-all flex items-center gap-2 ${activeTab === tab.key
                                    ? 'text-white'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                                }`}
                        >
                            {activeTab === tab.key && (
                                <motion.div
                                    layoutId="activeProTab"
                                    className="absolute inset-0 bg-white/[0.08] border border-white/[0.1] rounded-lg"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                {tab.icon} {tab.label}
                            </span>
                        </button>
                    ))}
                </nav>

                {/* Tab Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    {activeTab === 'projects' && <ProjectsTab userPlan={userPlan} />}
                    {activeTab === 'clients' && <ClientsTab userPlan={userPlan} userRole={userRole} />}
                    {activeTab === 'earnings' && <EarningsTab userPlan={userPlan} />}
                </motion.div>
            </div>
        </LayoutPro>
    );
};

export default ProDashboard;
