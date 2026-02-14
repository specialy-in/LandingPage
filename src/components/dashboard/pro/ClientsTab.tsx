import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { db } from '../../../lib/firebase';
import {
    collection, query, where, onSnapshot, addDoc, serverTimestamp,
    Timestamp, doc, setDoc
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Lock, Unlock, Zap, Phone, Mail, FileText,
    Loader2, Crown, Sparkles, CreditCard, X, Eye
} from 'lucide-react';

// --- Types ---
interface Lead {
    id: string;
    homeownerId: string;
    homeownerName: string;
    homeownerEmail?: string;
    homeownerPhone?: string;
    projectName: string;
    message: string;
    roomType?: string;
    budget?: string;
    createdAt: Timestamp;
    status: string;
}

interface UnlockedLead {
    id: string;
    leadId: string;
    homeownerName: string;
    homeownerEmail: string;
    homeownerPhone: string;
    projectName: string;
    unlockedAt: Timestamp;
}

interface ClientsTabProps {
    userPlan: string;
    userRole: string;
}

const ClientsTab: React.FC<ClientsTabProps> = ({ userPlan, userRole }) => {
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [unlockedLeads, setUnlockedLeads] = useState<UnlockedLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [unlockingId, setUnlockingId] = useState<string | null>(null);
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

    const isMaxPlan = userRole === 'professional3k' || userPlan?.toLowerCase() === 'max';

    useEffect(() => {
        if (!user) return;

        // Fetch proposals as leads
        const qLeads = query(
            collection(db, 'proposals'),
            where('architectId', '==', user.uid)
        );
        const unsubLeads = onSnapshot(qLeads, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead));
            docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setLeads(docs);
            setLoading(false);
        });

        // Fetch unlocked leads
        const unsubUnlocked = onSnapshot(
            collection(db, 'users', user.uid, 'unlockedLeads'),
            (snap) => {
                setUnlockedLeads(snap.docs.map(d => ({ id: d.id, ...d.data() } as UnlockedLead)));
            }
        );

        return () => { unsubLeads(); unsubUnlocked(); };
    }, [user]);

    const handleUnlockLead = async (lead: Lead) => {
        if (!user) return;
        setUnlockingId(lead.id);

        try {
            // Save to unlocked leads subcollection
            await setDoc(doc(db, 'users', user.uid, 'unlockedLeads', lead.id), {
                leadId: lead.id,
                homeownerName: lead.homeownerName || 'Homeowner',
                homeownerEmail: lead.homeownerEmail || '',
                homeownerPhone: lead.homeownerPhone || '',
                projectName: lead.projectName || 'Project',
                unlockedAt: serverTimestamp(),
            });

            // Animate reveal
            setRevealedIds(prev => new Set(prev).add(lead.id));
            toast.success(isMaxPlan ? 'Lead claimed!' : 'Lead unlocked!', { icon: '🔓' });
        } catch (err) {
            console.error(err);
            toast.error('Failed to unlock lead');
        }
        setUnlockingId(null);
    };

    const isUnlocked = (leadId: string) =>
        unlockedLeads.some(u => u.leadId === leadId) || revealedIds.has(leadId);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 size={32} className="text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Section A: My Clients */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Users size={18} className="text-orange-400" />
                    <h2 className="text-lg font-semibold text-white">My Clients</h2>
                    <span className="text-xs text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-full">{unlockedLeads.length}</span>
                </div>

                {unlockedLeads.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
                        <Lock size={32} className="mx-auto text-gray-600 mb-3" />
                        <p className="text-sm text-gray-500">No clients yet. Unlock leads from the Opportunities section below.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {unlockedLeads.map((client, idx) => (
                            <motion.div
                                key={client.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-3"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">{client.homeownerName}</h3>
                                        <p className="text-xs text-gray-500">{client.projectName}</p>
                                    </div>
                                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                                        Active
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    {client.homeownerEmail && (
                                        <p className="text-xs text-gray-400 flex items-center gap-2">
                                            <Mail size={12} /> {client.homeownerEmail}
                                        </p>
                                    )}
                                    {client.homeownerPhone && (
                                        <p className="text-xs text-gray-400 flex items-center gap-2">
                                            <Phone size={12} /> {client.homeownerPhone}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {/* Section B: Opportunities */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-400" />
                        <h2 className="text-lg font-semibold text-white">Opportunities</h2>
                        <span className="text-xs text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-full">{leads.length}</span>
                    </div>
                    {!isMaxPlan && (
                        <button
                            onClick={() => setShowPurchaseModal(true)}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-orange-900/20"
                        >
                            <CreditCard size={13} /> Buy Credits
                        </button>
                    )}
                </div>

                {leads.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
                        <FileText size={32} className="mx-auto text-gray-600 mb-3" />
                        <p className="text-sm text-gray-500">No new leads at the moment. Check back soon!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {leads.map((lead, idx) => {
                            const unlocked = isUnlocked(lead.id) || isMaxPlan;
                            const justRevealed = revealedIds.has(lead.id);

                            return (
                                <motion.div
                                    key={lead.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className="bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] rounded-xl p-4 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex items-center gap-2">
                                                {/* Priority badge for Max */}
                                                {isMaxPlan && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1">
                                                        <Zap size={10} /> Priority
                                                    </span>
                                                )}
                                                <motion.span
                                                    animate={justRevealed ? { filter: ['blur(12px)', 'blur(0px)'] } : {}}
                                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                                    className="text-sm font-semibold text-white"
                                                    style={{ filter: unlocked ? 'blur(0px)' : 'blur(8px)' }}
                                                >
                                                    {lead.homeownerName || 'Homeowner'}
                                                </motion.span>
                                            </div>

                                            <p className="text-xs text-gray-400">
                                                {lead.projectName || 'Project'} · {lead.roomType || 'Room'}
                                                {lead.budget && ` · Budget: ${lead.budget}`}
                                            </p>

                                            <motion.p
                                                animate={justRevealed ? { filter: ['blur(12px)', 'blur(0px)'] } : {}}
                                                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                                                className="text-xs text-gray-500 line-clamp-2"
                                                style={{ filter: unlocked ? 'blur(0px)' : 'blur(6px)' }}
                                            >
                                                {lead.message || 'Looking for a designer to help with my renovation...'}
                                            </motion.p>
                                        </div>

                                        {/* CTA */}
                                        <div className="flex-shrink-0">
                                            {unlocked ? (
                                                <button className="px-3 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                                                    <Eye size={13} /> View
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => isMaxPlan ? handleUnlockLead(lead) : handleUnlockLead(lead)}
                                                    disabled={unlockingId === lead.id}
                                                    className="px-3 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-orange-900/20"
                                                >
                                                    {unlockingId === lead.id ? (
                                                        <Loader2 size={13} className="animate-spin" />
                                                    ) : isMaxPlan ? (
                                                        <>
                                                            <Unlock size={13} /> Claim Lead (Free)
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Lock size={13} /> Unlock for ₹500
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Purchase Credits Modal */}
            <AnimatePresence>
                {showPurchaseModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowPurchaseModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#12121A] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <CreditCard size={20} className="text-orange-400" />
                                        Purchase Credits
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Unlock leads and power AI renders.</p>
                                </div>
                                <button onClick={() => setShowPurchaseModal(false)} className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors">
                                    <X size={18} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {/* Bundle 1 */}
                                <div className="bg-white/[0.03] border border-white/[0.08] hover:border-orange-500/30 rounded-xl p-5 cursor-pointer transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-white group-hover:text-orange-300 transition-colors">Starter Pack</h4>
                                            <p className="text-xs text-gray-500 mt-1">1 Lead Unlock + 5 AI Renders</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-white">₹500</p>
                                            <p className="text-[10px] text-gray-500">one-time</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            toast.success('Credits added!', { icon: '💳' });
                                            setShowPurchaseModal(false);
                                        }}
                                        className="w-full mt-4 px-4 py-2.5 bg-orange-600/90 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        Purchase
                                    </button>
                                </div>

                                {/* Bundle 2 */}
                                <div className="bg-white/[0.03] border-2 border-amber-500/30 rounded-xl p-5 cursor-pointer transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-amber-500 to-orange-500 text-[10px] font-bold text-white rounded-bl-lg">
                                        BEST VALUE
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                                                <Crown size={14} className="text-amber-400" /> Pro Bundle
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1">10 Lead Unlocks + 50 AI Renders</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-white">₹3,000</p>
                                            <p className="text-[10px] text-gray-500">save 40%</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            toast.success('Pro bundle activated!', { icon: '👑' });
                                            setShowPurchaseModal(false);
                                        }}
                                        className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-amber-900/20"
                                    >
                                        Purchase
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClientsTab;
