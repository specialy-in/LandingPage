import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Star, Edit3, ExternalLink, Search as ZoomIcon,
    MessageCircle, Lightbulb, MapPin, Clock, Linkedin, Instagram, Globe,
    ChevronRight, X
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────
interface ProfileData {
    username: string;
    yearsExperience: number;
    expertiseTags: string[];
    designPhilosophy: string;
    pinCode: string;
    city: string;
    linkedIn: string;
    instagram: string;
    website: string;
    profilePhotoURL: string;
    portfolioURLs: string[];
    verificationStatus: 'pending' | 'verified' | 'rejected';
    loopId?: string;
    role?: string;
    hasCompletedOnboarding?: boolean;
    email?: string;
    displayName?: string;
}

interface ProProfilePreviewProps {
    /** Pass initial data from onboarding to skip re-fetch */
    initialData?: Partial<ProfileData>;
    /** If true, component is rendered inside the onboarding layout */
    isOnboardingFinale?: boolean;
}

// ─── Stagger animation helpers ──────────────────────────────────
const stagger = {
    container: { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } },
    item: { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } },
};

// ─── Inline Editable Text ───────────────────────────────────────
const InlineEdit: React.FC<{
    value: string;
    fieldKey: string;
    as?: 'input' | 'textarea';
    className?: string;
    inputClassName?: string;
    editMode: boolean;
    onSave: (key: string, value: string) => void;
}> = ({ value, fieldKey, as = 'input', className = '', inputClassName = '', editMode, onSave }) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => { setDraft(value); }, [value]);
    useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

    const commit = () => {
        setEditing(false);
        if (draft !== value) onSave(fieldKey, draft);
    };

    if (!editMode) return <span className={className}>{value}</span>;

    if (editing) {
        const shared = `bg-transparent border border-orange-500/40 focus:border-orange-500 outline-none px-2 py-1 ${inputClassName}`;
        return as === 'textarea' ? (
            <textarea ref={inputRef as any} value={draft} onChange={e => setDraft(e.target.value)}
                onBlur={commit} onKeyDown={e => e.key === 'Escape' && commit()}
                rows={5} className={`${shared} resize-none w-full`} />
        ) : (
            <input ref={inputRef as any} value={draft} onChange={e => setDraft(e.target.value)}
                onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') commit(); }}
                className={`${shared} w-full`} />
        );
    }

    return (
        <span className={`${className} group/edit relative cursor-pointer`} onClick={() => setEditing(true)}>
            {value}
            <Edit3 size={12} className="inline ml-2 opacity-0 group-hover/edit:opacity-60 transition-opacity text-orange-400" />
        </span>
    );
};

// ─── Inline Number Edit ─────────────────────────────────────────
const InlineNumberEdit: React.FC<{
    value: number;
    fieldKey: string;
    suffix?: string;
    className?: string;
    editMode: boolean;
    onSave: (key: string, value: number) => void;
}> = ({ value, fieldKey, suffix = '', className = '', editMode, onSave }) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(String(value));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setDraft(String(value)); }, [value]);
    useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

    const commit = () => {
        setEditing(false);
        const num = parseInt(draft, 10);
        if (!isNaN(num) && num !== value) onSave(fieldKey, num);
    };

    if (!editMode) return <span className={className}>{value}{suffix}</span>;

    if (editing) {
        return (
            <input ref={inputRef} value={draft} type="number" min={0} max={50}
                onChange={e => setDraft(e.target.value)} onBlur={commit}
                onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') commit(); }}
                className="bg-transparent border border-orange-500/40 focus:border-orange-500 outline-none px-2 py-1 w-16 text-center" />
        );
    }

    return (
        <span className={`${className} group/edit relative cursor-pointer`} onClick={() => setEditing(true)}>
            {value}{suffix}
            <Edit3 size={12} className="inline ml-1 opacity-0 group-hover/edit:opacity-60 transition-opacity text-orange-400" />
        </span>
    );
};

// ═════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export const ProProfilePreview: React.FC<ProProfilePreviewProps> = ({ initialData, isOnboardingFinale = false }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<ProfileData>({
        username: '', yearsExperience: 0, expertiseTags: [], designPhilosophy: '',
        pinCode: '', city: '', linkedIn: '', instagram: '', website: '',
        profilePhotoURL: '', portfolioURLs: [], verificationStatus: 'pending',
        ...initialData,
    });

    const [lightbox, setLightbox] = useState<string | null>(null);
    const [tooltipVisible, setTooltipVisible] = useState(false);

    // ── Live sync from Firestore ──
    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
            if (snap.exists()) {
                setProfile(prev => ({ ...prev, ...snap.data() } as ProfileData));
            }
        });
        return () => unsub();
    }, [user]);

    // ── Save on blur ──
    const handleSave = useCallback(async (key: string, value: any) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), { [key]: value });
            setProfile(prev => ({ ...prev, [key]: value }));
        } catch (err) {
            console.error('Save error:', err);
        }
    }, [user]);

    const coverImage = profile.portfolioURLs?.[0] || '';
    const avatarURL = profile.profilePhotoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&background=EA580C&color=fff&size=256`;

    // ════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-[#0A0A0F] text-white relative overflow-x-hidden">
            {/* Grain Texture */}
            <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat' }} />

            {/* Architectural Grid */}
            <div className="fixed inset-0 pointer-events-none z-0"
                style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

            <motion.div variants={stagger.container} initial="hidden" animate="show" className="relative z-10 pb-32">

                <motion.div variants={stagger.item} className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Logo variant="light" />
                        <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] border-l border-white/10 pl-3 ml-1">Profile Hub</span>
                    </div>
                </motion.div>

                {/* ── COVER BANNER ── */}
                <motion.div variants={stagger.item} className="relative w-full h-[300px] overflow-hidden">
                    {coverImage ? (
                        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1a1a24] to-[#0A0A0F]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/40 to-transparent" />
                </motion.div>

                {/* ── PROFILE HEADER ── */}
                <motion.div variants={stagger.item} className="relative max-w-5xl mx-auto px-6 md:px-12 -mt-20">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-32 h-32 rounded-full border-4 border-[#0A0A0F] overflow-hidden shadow-[0_0_40px_rgba(234,88,12,0.15)]">
                                <img src={avatarURL} alt={profile.username} className="w-full h-full object-cover" />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 pt-2">
                            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
                                    <InlineEdit value={profile.username} fieldKey="username" editMode={true} onSave={handleSave}
                                        className="text-3xl md:text-4xl font-serif font-bold text-white"
                                        inputClassName="text-3xl md:text-4xl font-serif font-bold text-white" />
                                </h1>

                                {/* Badges Removed */}
                            </div>

                            {/* Meta Line */}
                            <div className="flex items-center gap-3 text-sm text-white/40 font-medium mt-1 flex-wrap">
                                <span className="flex items-center gap-1"><MapPin size={13} /> {profile.city || 'Location'}</span>
                                <span className="text-white/10">•</span>
                                <span className="flex items-center gap-1"><Clock size={13} />
                                    <InlineNumberEdit value={profile.yearsExperience} fieldKey="yearsExperience" suffix=" Years Exp" editMode={true}
                                        onSave={(k, v) => handleSave(k, v)} className="text-white/40" />
                                </span>
                                {profile.loopId && (
                                    <>
                                        <span className="text-white/10">•</span>
                                        <span className="font-mono text-white/20 text-xs">{profile.loopId}</span>
                                    </>
                                )}
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {profile.expertiseTags.map(tag => (
                                    <span key={tag} className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-white/50 border border-white/8 bg-white/[0.03]">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Social Links */}
                            {(profile.linkedIn || profile.instagram || profile.website) && (
                                <div className="flex items-center gap-4 mt-4">
                                    {profile.linkedIn && (
                                        <a href={profile.linkedIn.startsWith('http') ? profile.linkedIn : `https://${profile.linkedIn}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="text-white/30 hover:text-orange-400 transition-colors"><Linkedin size={16} /></a>
                                    )}
                                    {profile.instagram && (
                                        <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram.replace('@', '')}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="text-white/30 hover:text-orange-400 transition-colors"><Instagram size={16} /></a>
                                    )}
                                    {profile.website && (
                                        <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="text-white/30 hover:text-orange-400 transition-colors"><Globe size={16} /></a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ── DESIGN PHILOSOPHY ── */}
                <motion.div variants={stagger.item} className="max-w-5xl mx-auto px-6 md:px-12 mt-12">
                    <div className="relative group/section">
                        <h3 className="text-[11px] font-mono text-white/20 uppercase tracking-[0.3em] mb-6">Design Philosophy</h3>
                        <div className="text-white/60 text-xl md:text-3xl leading-[1.6] font-serif italic font-light max-w-4xl relative">
                            <span className="absolute -left-10 -top-4 text-orange-500/20 text-8xl font-serif select-none">“</span>
                            <InlineEdit value={profile.designPhilosophy} fieldKey="designPhilosophy" as="textarea"
                                editMode={true} onSave={handleSave}
                                className="text-white/60 text-xl md:text-3xl leading-[1.6] font-serif italic font-light whitespace-pre-wrap"
                                inputClassName="text-white/60 text-xl md:text-3xl leading-[1.6] font-serif italic font-light" />
                        </div>
                    </div>
                </motion.div>

                {/* ── PORTFOLIO MASONRY ── */}
                <motion.div variants={stagger.item} className="max-w-5xl mx-auto px-6 md:px-12 mt-14">
                    <h3 className="text-[11px] font-mono text-white/25 uppercase tracking-[0.2em] mb-6">Portfolio</h3>
                    <div className="columns-2 md:columns-3 gap-3 space-y-3">
                        {profile.portfolioURLs.map((url, i) => (
                            <div key={i}
                                onClick={() => setLightbox(url)}
                                className="break-inside-avoid rounded-sm overflow-hidden cursor-zoom-in group/img relative">
                                <img src={url} alt={`Work ${i + 1}`}
                                    className="w-full h-auto object-cover transition-transform duration-500 group-hover/img:scale-[1.03]" />
                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-all flex items-center justify-center">
                                    <ZoomIcon size={24} className="text-white opacity-0 group-hover/img:opacity-70 transition-opacity" />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ── NAVIGATION CTAs ── */}
                <motion.div variants={stagger.item} className="max-w-5xl mx-auto px-6 md:px-12 mt-14 flex flex-col md:flex-row items-center gap-4">
                    {/* Go to Workspace — disabled with tooltip */}
                    <div className="relative group/btn">
                        <button
                            onMouseEnter={() => setTooltipVisible(true)}
                            onMouseLeave={() => setTooltipVisible(false)}
                            className="px-10 py-4 bg-white/[0.03] text-white/20 font-display font-semibold text-sm tracking-widest cursor-not-allowed border border-white/5 flex items-center gap-3 transition-all group-hover/btn:bg-white/[0.05]">
                            GO TO WORKSPACE <ChevronRight size={14} className="opacity-50" />
                        </button>
                        {tooltipVisible && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-5 py-3 bg-[#111116] border border-orange-500/20 text-[11px] text-orange-200/60 whitespace-nowrap shadow-2xl z-50 font-mono tracking-wider">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                    Curators are verifying your profile. Access in ~48h.
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* ══════════════════════════════════════════════════════
                 PERKS PANEL (fixed bottom bar)
                 ══════════════════════════════════════════════════════ */}
            <motion.div
                initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0F]/40 backdrop-blur-3xl border-t border-white/[0.05]">
                <div className="max-w-6xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
                    {/* Left: Premium Plan Badge */}
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-amber-500/20 blur-md rounded-full group-hover:bg-amber-500/40 transition-colors" />
                            <div className="relative p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <Star size={16} className="text-amber-500" fill="currentColor" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] text-white font-bold tracking-tight">
                                Specialy Plus <span className="text-green-400 ml-1.5 px-2 py-0.5 bg-green-400/10 border border-green-400/20 rounded text-[10px] uppercase font-mono tracking-widest">Claimed</span>
                            </span>
                            <span className="text-[10px] text-white/30 font-mono tracking-wider uppercase">Founder's License • 365 Days remaining</span>
                        </div>
                    </div>

                    {/* Right: Contact Email */}
                    <div className="flex items-center gap-3 group/mail">
                        <div className="text-right flex flex-col items-end">
                            <span className="text-[10px] text-white/20 font-mono uppercase tracking-[0.2em]">Support & Concierge</span>
                            <a href="mailto:specialy.in" className="text-sm font-display font-medium text-white/60 group-hover/mail:text-orange-400 transition-colors tracking-tight">
                                specialy.in
                            </a>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover/mail:border-orange-500/30 transition-all">
                            <Globe size={16} className="text-white/20 group-hover/mail:text-orange-400 transition-colors" />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── LIGHTBOX ── */}
            {lightbox && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-8"
                    onClick={() => setLightbox(null)}>
                    <button onClick={() => setLightbox(null)} className="absolute top-8 right-8 text-white/50 hover:text-white">
                        <X size={32} />
                    </button>
                    <img src={lightbox} alt="Full size" className="max-w-full max-h-full object-contain shadow-2xl" />
                </motion.div>
            )}
        </div>
    );
};
