import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ShoppingCart, ChevronDown, X, CheckCircle,
    MapPin, Send, Users, Star, ArrowRight, Clock
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
// import { PageFilters } from '../common/PageFilters'; // No longer used
import { UniversalFilterBar } from '../common/UniversalFilterBar';
import { PageContainer } from '../common/PageContainer';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase';
import { collection, addDoc, Timestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';

// --- Helpers ---
const getPortfolioImages = (data: any): string[] => {
    // 1. Check portfolioImages (standard typed field)
    if (Array.isArray(data.portfolioImages) && data.portfolioImages.length > 0) {
        return data.portfolioImages;
    }

    // 2. Check portfolioURLs — the actual field name used during onboarding
    if (data.portfolioURLs) {
        if (Array.isArray(data.portfolioURLs)) {
            const urls = data.portfolioURLs.filter((v: any) => typeof v === 'string' && v.startsWith('http'));
            if (urls.length > 0) return urls;
        } else if (typeof data.portfolioURLs === 'object') {
            const urls = Object.values(data.portfolioURLs).filter(
                (v: any) => typeof v === 'string' && v.startsWith('http')
            ) as string[];
            if (urls.length > 0) return urls;
        }
    }

    // 3. Fallback: scan all fields for nested Firebase Storage URLs
    const images: string[] = [];
    const skipKeys = ['createdAt', 'updatedAt', 'selectedPlan', 'specialties', 'specializations', 'photoURL', 'profilePhotoURL'];
    Object.keys(data).forEach(key => {
        if (skipKeys.includes(key)) return;
        const value = data[key];
        if (typeof value === 'string' && value.startsWith('http') && value.includes('firebasestorage')) {
            images.push(value);
        } else if (typeof value === 'object' && value !== null) {
            const vals = Array.isArray(value) ? value : Object.values(value);
            vals.forEach((v: any) => {
                if (typeof v === 'string' && v.startsWith('http') && v.includes('firebasestorage')) {
                    images.push(v);
                }
            });
        }
    });

    return images;
};
interface Architect {
    id: string;
    username?: string;
    firmName?: string;
    photoURL: string;
    email: string;
    city: string;
    specialties?: string[];
    specializations?: string[]; // Legacy support
    yearsExperience: number;
    tagline?: string;
    bio?: string;
    designPhilosophy?: string;
    portfolioImages: string[];
    verificationStatus: boolean;
    selectedPlan?: 'specialy-max' | 'freelancer' | 'student';
    createdAt?: any;
}

interface Project {
    id: string;
    name: string;
}

// --- Mock Data Removed ---
const mockProjects: Project[] = [
    { id: 'proj-1', name: 'Living Room Makeover' },
    { id: 'proj-2', name: 'Master Bedroom Redesign' },
    { id: 'proj-3', name: 'Kitchen Renovation' },
];

const cities = ['All Cities', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata'];
const specializations = ['All Styles', 'Modern', 'Minimalist', 'Traditional', 'Industrial', 'Scandinavian', 'Contemporary', 'Luxury', 'Tropical', 'Japanese', 'Colonial'];
const experienceRanges = ['Any Experience', '0-2 years', '2-5 years', '5-10 years', '10+ years'];
const sortOptions = ['Best Match', 'Most Experienced', 'Newest'];
const budgetRanges = ['Under ₹2L', '₹2L - ₹5L', '₹5L - ₹10L', '₹10L+', 'Flexible'];
const timelines = ['Urgent (< 1 month)', '1-2 months', '3-6 months', '6+ months', 'Flexible'];

// --- Components ---

const FilterDropdown: React.FC<{
    label: string;
    options: string[];
    value: string;
    onChange: (value: string) => void;
}> = ({ label, options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/[0.08] hover:border-white/20 transition-all min-w-[140px] justify-between"
            >
                <span className="truncate max-w-[100px]">{value}</span>
                <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-2 w-56 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 py-1 max-h-60 overflow-y-auto"
                    >
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => { onChange(option); setIsOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${value === option ? 'text-orange-500 bg-orange-500/10' : 'text-gray-300 hover:bg-white/5'}`}
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

const ArchitectCard: React.FC<{
    architect: Architect;
    onViewPortfolio: () => void;
    onSendProposal: () => void;
}> = ({ architect, onViewPortfolio, onSendProposal }) => {
    const isPremium = architect.selectedPlan === 'specialy-max';
    const displayTags = architect.specialties?.slice(0, 3) || architect.specializations?.slice(0, 3) || [];
    const displayName = architect.firmName || architect.username || 'Unnamed Professional';
    const profileImg = architect.photoURL || (architect as any).profilePhotoURL || `https://ui-avatars.com/api/?name=${displayName}`;

    // Robust extraction
    const derivedPortfolio = getPortfolioImages(architect);
    const thumbnail = derivedPortfolio[0] || profileImg;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative bg-[#0D0D12] border border-white/5 rounded-2xl overflow-hidden flex flex-col md:flex-row gap-0 hover:border-orange-500/20 transition-all duration-500"
        >
            {/* Left: Project Thumbnail (The "Hook") */}
            <div className="w-full md:w-[320px] aspect-[4/3] md:aspect-auto relative overflow-hidden flex-shrink-0">
                <img
                    src={thumbnail}
                    alt={displayName}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Profile Overlay */}
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                    <img src={profileImg} alt="" className="w-10 h-10 rounded-full border-2 border-white/20 shadow-xl" />
                    <div>
                        <div className="flex items-center gap-1.5 font-display font-bold text-white text-sm shadow-sm">
                            {displayName}
                            {(architect.verificationStatus === true || architect.verificationStatus === ("true" as any)) && (
                                <CheckCircle size={12} className="text-blue-400 fill-blue-400/20" />
                            )}
                        </div>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-white/50">Verified Pro</span>
                    </div>
                </div>
            </div>

            {/* Right: Dossier Details */}
            <div className="flex-grow p-6 md:p-8 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-wrap gap-3">
                            {isPremium && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] font-bold text-amber-500 uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                    <Star size={10} fill="currentColor" /> Premium
                                </span>
                            )}
                            <span className="flex items-center gap-1.5 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                                <MapPin size={12} /> {architect.city}
                            </span>
                        </div>
                        <div className="px-3 py-1 bg-white/[0.03] border border-white/5 rounded text-[10px] font-mono text-white/60">
                            {architect.yearsExperience} YRS EXP
                        </div>
                    </div>

                    <h3 className="text-xl md:text-2xl font-serif font-bold text-white mb-3 tracking-tight group-hover:text-orange-400 transition-colors">
                        {architect.tagline || (architect.firmName ? `Principal Architect at ${architect.firmName}` : 'Interior Architect')}
                    </h3>

                    <p className="text-white/40 text-sm leading-relaxed mb-6 font-light line-clamp-2 max-w-2xl italic">
                        "{architect.designPhilosophy || architect.bio || 'Creating spaces that resonate with the soul.'}"
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                        {displayTags.map((tag, idx) => (
                            <span key={idx} className="px-3 py-1 bg-white/5 border border-white/[0.05] rounded-md text-[10px] font-mono uppercase tracking-widest text-white/30">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                    <button
                        onClick={onViewPortfolio}
                        className="flex-1 md:flex-none px-6 py-3 rounded-lg border border-white/10 text-white/40 text-[11px] font-mono font-bold uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
                    >
                        View Profile
                    </button>
                    <button
                        onClick={onSendProposal}
                        className="flex-1 md:flex-none px-8 py-3 bg-white text-black font-display font-black text-[11px] uppercase tracking-widest rounded-lg hover:bg-orange-500 hover:text-white transition-all transform hover:-translate-y-0.5 shadow-xl shadow-black/40"
                    >
                        Start Project
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// ... Skeleton Card ...
const SkeletonCard: React.FC = () => (
    <div className="bg-[#0D0D12] border border-white/5 rounded-2xl overflow-hidden flex flex-col md:flex-row gap-0 animate-pulse">
        <div className="w-full md:w-[320px] aspect-[4/3] md:aspect-auto bg-white/5 flex-shrink-0" />
        <div className="flex-grow p-8">
            <div className="flex justify-between mb-8">
                <div className="h-4 bg-white/5 rounded w-1/4" />
                <div className="h-6 bg-white/5 rounded w-20" />
            </div>
            <div className="h-8 bg-white/5 rounded w-3/4 mb-4" />
            <div className="h-4 bg-white/5 rounded w-full mb-2" />
            <div className="h-4 bg-white/5 rounded w-2/3 mb-10" />
            <div className="flex gap-4">
                <div className="h-10 bg-white/5 rounded w-32" />
                <div className="h-10 bg-white/5 rounded w-40" />
            </div>
        </div>
    </div>
);

// ... Profile Modal ...
const ProfileModal: React.FC<{
    architect: Architect;
    onClose: () => void;
    onSendProposal: () => void;
}> = ({ architect, onClose, onSendProposal }) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl shadow-black/60"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-30 p-2 text-gray-400 hover:text-white transition-colors bg-black/40 rounded-full backdrop-blur-sm"
                >
                    <X size={20} />
                </button>

                {/* Left - Portfolio Masonry */}
                <div className="w-full md:w-[60%] bg-zinc-950 p-6 overflow-y-auto hide-scrollbar border-r border-white/[0.06]">
                    <h3 className="text-2xl font-serif font-bold text-white mb-6 sticky top-0 bg-zinc-950 py-2 z-10">Portfolio</h3>
                    <div className="columns-1 sm:columns-2 gap-4 space-y-4">
                        {getPortfolioImages(architect).length > 0 ? (
                            getPortfolioImages(architect).map((img, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedImage(img)}
                                    className="break-inside-avoid rounded-xl overflow-hidden cursor-zoom-in group relative mb-4"
                                >
                                    <img src={img} alt="" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center py-20 text-gray-600 font-mono text-xs uppercase tracking-widest">
                                No portfolio images uploaded
                            </div>
                        )}
                    </div>
                </div>

                {/* Right - Minimal Profile Info */}
                <div className="w-full md:w-[40%] bg-[#0f1115] p-8 flex flex-col">
                    <div className="flex-1 overflow-y-auto hide-scrollbar">
                        <div className="flex items-center gap-5 mb-8">
                            <img
                                src={architect.photoURL || (architect as any).profilePhotoURL}
                                alt={architect.username}
                                className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10"
                            />
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-white mb-1">{architect.firmName || architect.username}</h2>
                                <p className="text-orange-500 text-xs font-mono uppercase tracking-[0.3em]">Verified Architect</p>
                            </div>
                        </div>

                        <div className="space-y-8 pr-2">
                            <div>
                                <h4 className="text-[10px] font-mono font-bold text-gray-500 mb-3 uppercase tracking-[0.2em]">Design Philosophy</h4>
                                <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line font-serif italic text-lg decoration-orange-500/20">
                                    {architect.designPhilosophy || architect.bio}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-mono font-bold text-gray-500 mb-3 uppercase tracking-[0.2em]">Expertise</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(architect.specialties || architect.specializations || []).map((spec) => (
                                        <span key={spec} className="px-3 py-1 bg-white/[0.03] border border-white/5 text-gray-400 text-[10px] font-mono uppercase tracking-widest rounded">
                                            {spec}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Experience</div>
                                    <div className="text-white font-medium">{architect.yearsExperience} Years</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Location</div>
                                    <div className="text-white font-medium">{architect.city}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Projects</div>
                                    {/* Fallback for legacy data */}
                                    <div className="text-white font-medium">{(architect as any).projectsCompleted || (architect.yearsExperience * 3)}+ Done</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Response</div>
                                    <div className="text-white font-medium">{(architect as any).avgResponseTime || (architect.selectedPlan === 'specialy-max' ? '< 4h' : '24h')}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/[0.08]">
                        <button
                            onClick={onSendProposal}
                            className="w-full py-4 bg-white text-black font-display font-black text-xs tracking-[0.2em] rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-lg transform hover:-translate-y-1 uppercase"
                        >
                            START PROJECT WITH {architect.username?.split(' ')[0] || 'PRO'}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-8"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button onClick={() => setSelectedImage(null)} className="absolute top-8 right-8 text-white/50 hover:text-white">
                            <X size={32} />
                        </button>
                        <img src={selectedImage} alt="Full size" className="max-w-full max-h-full object-contain rounded shadow-2xl" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ... ProposalModal stays mostly same, just styling ...
const ProposalModal: React.FC<{
    architect: Architect;
    projects: Project[];
    onClose: () => void;
    onSuccess: () => void;
}> = ({ architect, projects, onClose, onSuccess }) => {
    // ... logic same ...
    const { user } = useAuth();
    const [selectedProject, setSelectedProject] = useState('');
    const [budgetRange, setBudgetRange] = useState('');
    const [timeline, setTimeline] = useState('');
    const [message, setMessage] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const isValid = selectedProject && budgetRange && timeline && message.length >= 50 && agreed;

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSubmit = async () => {
        // ... same submit logic ...
        if (!isValid || !user) return;
        setSubmitting(true);
        try {
            // ... firebase addDoc ...
            const project = projects.find(p => p.id === selectedProject);
            await addDoc(collection(db, 'proposals'), {
                homeownerId: user.uid,
                homeownerName: user.displayName || 'Anonymous',
                homeownerEmail: user.email,
                architectId: architect.id,
                projectId: selectedProject,
                projectName: project?.name || 'New Project',
                budgetRange,
                timeline,
                message,
                status: 'pending',
                unlocked: false,
                createdAt: Timestamp.now()
            });
            onSuccess();
            onClose();
            toast.success(`Proposal sent to ${architect.firmName || architect.username}`);
        } catch (e) {
            setSubmitting(false);
            toast.error('Failed to send');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-serif font-bold text-white">Send Proposal</h2>
                    <button onClick={onClose}><X className="text-gray-500 hover:text-white" size={20} /></button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Inputs ... */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Project</label>
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 text-sm focus:border-orange-500/50 outline-none"
                        >
                            <option value="">Select Project</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Budget</label>
                            <select value={budgetRange} onChange={e => setBudgetRange(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 text-sm focus:border-orange-500/50 outline-none">
                                <option value="">Select Range</option>
                                {budgetRanges.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Timeline</label>
                            <select value={timeline} onChange={e => setTimeline(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-200 text-sm focus:border-orange-500/50 outline-none">
                                <option value="">Select Timeline</option>
                                {timelines.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Message</label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value.slice(0, 500))}
                            rows={4}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-200 text-sm focus:border-orange-500/50 outline-none resize-none"
                            placeholder="Describe your vision..."
                        />
                        <div className="flex justify-end mt-1">
                            <span className="text-xs text-gray-500">{message.length}/500</span>
                        </div>
                    </div>

                    <label className="flex gap-3 cursor-pointer group">
                        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5" />
                        <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">I understand pricing is discussed later.</span>
                    </label>
                </div>

                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || submitting}
                        className="px-6 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Sending...' : 'Send Proposal'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- Main Page ---
const BrowseArchitects: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const urlQuery = searchParams.get('q') || '';
    const [loading, setLoading] = useState(true);
    const [architects, setArchitects] = useState<Architect[]>([]);
    const [searchQuery, setSearchQuery] = useState(urlQuery);
    const [selectedCity, setSelectedCity] = useState('All Cities');
    const [selectedSpecialization, setSelectedSpecialization] = useState('All Styles');
    const [selectedExperience, setSelectedExperience] = useState('Any Experience');
    const [sortBy, setSortBy] = useState('Best Match');
    const [selectedArchitect, setSelectedArchitect] = useState<Architect | null>(null);
    const [proposalArchitect, setProposalArchitect] = useState<Architect | null>(null);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const [error, setError] = useState<string | null>(null);
    const [notified, setNotified] = useState(false);

    useEffect(() => {
        // Query for professionals. We'll filter and sort client-side to handle 
        // string vs boolean and avoid immediate composite index requirements.
        const q = query(
            collection(db, 'users'),
            where('role', '==', 'PROFESSIONAL')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const fetchedArchitects = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter((user: any) =>
                        user.verificationStatus === true ||
                        user.verificationStatus === "true"
                    ) as Architect[];

                // Sort by createdAt client-side
                fetchedArchitects.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis?.() || 0;
                    const timeB = b.createdAt?.toMillis?.() || 0;
                    return timeA - timeB;
                });

                console.log("Fetched Architects:", fetchedArchitects.map(a => ({
                    id: a.id,
                    name: a.firmName || a.username,
                    photoURL: a.photoURL,
                    profilePhotoURL: (a as any).profilePhotoURL,
                    portfolioImages: a.portfolioImages,
                    projectImages: (a as any).projectImages
                })));

                setArchitects(fetchedArchitects);
                setLoading(false);
                setError(null);
            },
            (err: any) => {
                console.error("Firestore Fetch error:", err);
                if (err.code === 'permission-denied') {
                    setError("Permission Denied: meaningful-access to 'users' collection is blocked. Please update your Firestore Rules.");
                } else {
                    setError("Our architect list is currently in a meeting. Try refreshing in a moment.");
                }
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        setSearchQuery(urlQuery);
    }, [urlQuery]);

    // Filter logic ...
    const filteredArchitects = useMemo(() => {
        let result = [...architects];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(a =>
                (a.firmName || a.username || '').toLowerCase().includes(q) ||
                a.city.toLowerCase().includes(q) ||
                (a.specialties || a.specializations || []).some(s => s.toLowerCase().includes(q))
            );
        }
        if (selectedCity !== 'All Cities') result = result.filter(a => a.city === selectedCity);
        if (selectedSpecialization !== 'All Styles') {
            result = result.filter(a => (a.specialties || a.specializations || []).includes(selectedSpecialization));
        }
        if (selectedExperience !== 'Any Experience') {
            result = result.filter(a => {
                const y = a.yearsExperience;
                if (selectedExperience === '0-2 years') return y <= 2;
                if (selectedExperience === '2-5 years') return y > 2 && y <= 5;
                if (selectedExperience === '5-10 years') return y > 5 && y <= 10;
                if (selectedExperience === '10+ years') return y > 10;
                return true;
            });
        }

        switch (sortBy) {
            case 'Most Experienced': result.sort((a, b) => b.yearsExperience - a.yearsExperience); break;
            case 'Newest': result.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)); break;
            default: // Best Match: Premium > Date
                result.sort((a, b) => {
                    const score = (p?: string) => p === 'specialy-max' ? 1 : 0;
                    if (score(b.selectedPlan) !== score(a.selectedPlan)) {
                        return score(b.selectedPlan) - score(a.selectedPlan);
                    }
                    return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
                });
        }
        return result;
    }, [architects, searchQuery, selectedCity, selectedSpecialization, selectedExperience, sortBy]);


    // ...

    const filterOptions = [
        { label: 'Location', value: selectedCity, options: cities, onChange: setSelectedCity },
        { label: 'Specialization', value: selectedSpecialization, options: specializations, onChange: setSelectedSpecialization },
        { label: 'Experience', value: selectedExperience, options: experienceRanges, onChange: setSelectedExperience },
    ];

    return (
        <>
            <Toaster position="bottom-center" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #333' } }} />

            <PageContainer>
                {/* Page Header */}
                <div className="mb-10">
                    <h1 className="text-5xl font-serif font-bold text-white tracking-tight mb-2">Browse Architects</h1>
                    <p className="text-base text-gray-400 leading-relaxed max-w-2xl">
                        Find the perfect architect or designer for your dream project.
                    </p>
                </div>

                {/* Unified Filter Bar */}
                <UniversalFilterBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search architects..."
                    filters={filterOptions}
                    count={filteredArchitects.length}
                    countLabel="professionals"
                    sortOptions={sortOptions}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                />

                {/* Main Content */}
                {loading ? (
                    <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
                        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : error ? (
                    <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] max-w-5xl mx-auto">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="text-orange-500/50" size={24} />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-white mb-2">{error}</h3>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-2 bg-white/10 text-white text-xs font-mono uppercase tracking-widest rounded-lg hover:bg-white/20 transition-all"
                        >
                            Try Refreshing
                        </button>
                    </div>
                ) : filteredArchitects.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] max-w-5xl mx-auto">
                        <Users className="mx-auto text-white/5 mb-6" size={64} />
                        <h3 className="text-2xl font-serif font-bold text-white mb-2">Curating the best...</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            We're currently hand-verifying designers to ensure the highest quality.
                            Want to be the first to know when new pros land?
                        </p>
                        <button
                            onClick={() => {
                                setNotified(true);
                                toast.success("We'll reach out when the next batch of pros join!");
                            }}
                            disabled={notified}
                            className={`px-8 py-4 bg-orange-600 text-white font-bold tracking-widest rounded-xl transition-all shadow-xl shadow-orange-900/20 uppercase text-xs ${notified ? 'opacity-50 grayscale' : 'hover:bg-orange-500 transform hover:-translate-y-1'}`}
                        >
                            {notified ? 'You are on the list' : 'Notify me when pros join'}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
                        {filteredArchitects.map(arch => (
                            <ArchitectCard
                                key={arch.id}
                                architect={arch}
                                onViewPortfolio={() => setSelectedArchitect(arch)}
                                onSendProposal={() => setProposalArchitect(arch)}
                            />
                        ))}
                    </div>
                )}
            </PageContainer>


            {/* Modals */}
            <AnimatePresence>
                {selectedArchitect && (
                    <ProfileModal
                        architect={selectedArchitect}
                        onClose={() => setSelectedArchitect(null)}
                        onSendProposal={() => { setSelectedArchitect(null); setProposalArchitect(selectedArchitect); }}
                    />
                )}
                {proposalArchitect && (
                    <ProposalModal
                        architect={proposalArchitect}
                        projects={mockProjects}
                        onClose={() => setProposalArchitect(null)}
                        onSuccess={() => { }}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default BrowseArchitects;
