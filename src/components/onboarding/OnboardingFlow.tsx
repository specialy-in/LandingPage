import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { db, storage } from '../../lib/firebase';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, ArrowLeft, Check, Plus, Minus, X, Upload, Camera,
    Sparkles, Shield, Phone, Linkedin, Instagram, Globe, Loader2
} from 'lucide-react';
import { PRE_LAUNCH_MODE, ADMIN_EMAILS } from '../../config';
import { ProProfilePreview } from './ProProfilePreview';

// --- Types ---
type Role = 'HOMEOWNER' | 'PROFESSIONAL' | null;

interface ProUserData {
    role: Role;
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
    hasCompletedOnboarding: boolean;
    founderGiftClaimed: boolean;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    loopId?: string;
}

interface HomeownerData {
    role: Role;
    username: string;
    intent?: string;
    pinCode: string;
    hasCompletedOnboarding: boolean;
    loopId?: string;
}

// --- Animation Variants ---
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 400 : -400,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -400 : 400,
        opacity: 0,
    }),
};

const slideTransition = { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] };

// Homeowner legacy variants
const sceneVariants = {
    initial: { opacity: 0, y: 60, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -60, scale: 0.95 },
};
const legacyTransition = { duration: 0.8, ease: [0.16, 1, 0.3, 1] };

// --- Predefined Tags ---
const PRESET_TAGS = ['Modern', 'Minimalist', 'Luxury', 'Sustainable', 'Industrial', 'Scandinavian', 'Traditional', 'Bohemian', 'Art Deco', 'Japanese'];

const PRO_TOTAL_STEPS = 9; // Steps 0–8

interface OnboardingFlowProps {
    previewMode?: boolean;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ previewMode = false }) => {
    const { user: authUser } = useAuth();
    const navigate = useNavigate();
    const user = previewMode ? (authUser || { uid: 'preview_user', email: 'preview@specialy.in', photoURL: 'https://ui-avatars.com/api/?name=Preview&background=EA580C&color=fff', displayName: 'Preview User' }) : authUser;

    const [step, setStep] = useState<number | null>(previewMode ? 0 : null);
    const [direction, setDirection] = useState(1);
    const [loading, setLoading] = useState(!previewMode);

    // Role selection (shared)
    const [role, setRole] = useState<Role>(previewMode ? 'PROFESSIONAL' : null);

    // --- Professional Data ---
    const [proData, setProData] = useState<ProUserData>({
        role: 'PROFESSIONAL',
        username: '',
        yearsExperience: 3,
        expertiseTags: [],
        designPhilosophy: '',
        pinCode: '',
        city: '',
        linkedIn: '',
        instagram: '',
        website: '',
        profilePhotoURL: '',
        portfolioURLs: [],
        hasCompletedOnboarding: false,
        founderGiftClaimed: false,
        verificationStatus: 'pending',
    });

    // --- Homeowner Data ---
    const [homeData, setHomeData] = useState<HomeownerData>({
        role: 'HOMEOWNER',
        username: '',
        pinCode: '',
        hasCompletedOnboarding: false,
    });

    const [error, setError] = useState<string | null>(null);
    const [customTag, setCustomTag] = useState('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
    const [cityLoading, setCityLoading] = useState(false);
    const [showReveal, setShowReveal] = useState(false);
    const [revealDone, setRevealDone] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const portfolioInputRef = useRef<HTMLInputElement>(null);

    // --- Firebase Load ---
    useEffect(() => {
        if (previewMode) { setLoading(false); return; }
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                if (data.hasCompletedOnboarding) {
                    navigate('/dashboard');
                    return;
                }

                if (data.role === 'PROFESSIONAL') {
                    setRole('PROFESSIONAL');
                    setProData(prev => ({ ...prev, ...data } as ProUserData));

                    setStep(prevStep => {
                        if (prevStep !== null) return prevStep;
                        if (!data.founderGiftClaimed) return 0;
                        if (!data.username) return 1;
                        if (!data.yearsExperience) return 2;
                        if (!data.expertiseTags?.length) return 3;
                        if (!data.designPhilosophy) return 4;
                        if (!data.pinCode) return 5;
                        if (!data.linkedIn && !data.instagram && !data.website) return 6;
                        if (!data.profilePhotoURL) return 7;
                        if (!data.portfolioURLs?.length || data.portfolioURLs.length < 3) return 8;
                        return 8;
                    });
                } else if (data.role === 'HOMEOWNER') {
                    setRole('HOMEOWNER');
                    setHomeData(prev => ({ ...prev, ...data } as HomeownerData));

                    setStep(prevStep => {
                        if (prevStep !== null) return prevStep;
                        if (!data.username) return 2;
                        if (!data.intent) return 3;
                        if (!data.pinCode) return 4;
                        return 10;
                    });
                } else {
                    setStep(-1); // Role selection
                }
            } else {
                setStep(-1); // New user, role selection
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user, previewMode]);

    // --- Save Helper ---
    const saveData = useCallback(async (data: Record<string, any>) => {
        if (previewMode) {
            if (role === 'PROFESSIONAL') {
                setProData(prev => ({ ...prev, ...data }));
            } else {
                setHomeData(prev => ({ ...prev, ...data } as HomeownerData));
            }
            return;
        }
        if (!user) return;
        try {
            await setDoc(doc(db, 'users', user.uid), {
                ...data,
                email: user.email,
                displayName: (user as any).displayName || '',
                updatedAt: serverTimestamp(),
            }, { merge: true });
        } catch (err) {
            console.error('Save error:', err);
        }
    }, [user, previewMode, role]);

    // --- Navigation ---
    const goNext = () => {
        setError(null);
        setDirection(1);
        setStep(prev => (prev ?? 0) + 1);
    };

    const goBack = () => {
        setError(null);
        setDirection(-1);
        setStep(prev => (prev ?? 1) - 1);
    };

    // --- PIN Lookup ---
    const lookupCity = async (pin: string) => {
        if (pin.length !== 6) return;
        setCityLoading(true);
        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
            const data = await res.json();
            if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
                const city = data[0].PostOffice[0].District || data[0].PostOffice[0].Division;
                setProData(prev => ({ ...prev, city }));
                await saveData({ pinCode: pin, city });
            } else {
                setProData(prev => ({ ...prev, city: '' }));
            }
        } catch {
            console.warn('PIN lookup failed');
        } finally {
            setCityLoading(false);
        }
    };

    // --- Image Upload ---
    const uploadImage = async (file: File, path: string): Promise<string> => {
        if (previewMode) return URL.createObjectURL(file);
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
    };

    const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setUploadingPhoto(true);
        try {
            const url = await uploadImage(file, `users/${user.uid}/profile/${Date.now()}_${file.name}`);
            setProData(prev => ({ ...prev, profilePhotoURL: url }));
            await saveData({ profilePhotoURL: url });
        } catch (err) {
            setError('Photo upload failed. Try again.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handlePortfolioUpload = async (files: FileList | null) => {
        if (!files || !user) return;
        const remaining = 12 - proData.portfolioURLs.length;
        const toUpload = Array.from(files).slice(0, remaining);
        if (toUpload.length === 0) return;

        setUploadingPortfolio(true);
        try {
            const urls = await Promise.all(
                toUpload.map(file => uploadImage(file, `users/${user.uid}/portfolio/${Date.now()}_${file.name}`))
            );
            const updated = [...proData.portfolioURLs, ...urls];
            setProData(prev => ({ ...prev, portfolioURLs: updated }));
            await saveData({ portfolioURLs: updated });
        } catch (err) {
            setError('Some uploads failed. Try again.');
        } finally {
            setUploadingPortfolio(false);
        }
    };

    const removePortfolioImage = async (index: number) => {
        const updated = proData.portfolioURLs.filter((_, i) => i !== index);
        setProData(prev => ({ ...prev, portfolioURLs: updated }));
        await saveData({ portfolioURLs: updated });
    };

    // --- Validation ---
    const isStepValid = (s: number): boolean => {
        switch (s) {
            case 0: return true; // Founder's gift — just click
            case 1: return proData.username.length >= 3;
            case 2: return proData.yearsExperience >= 0;
            case 3: return proData.expertiseTags.length >= 1;
            case 4: return proData.designPhilosophy.split(/\s+/).filter(Boolean).length >= 50;
            case 5: return /^\d{6}$/.test(proData.pinCode) && proData.city.length > 0;
            case 6: return proData.linkedIn.length > 0 || proData.instagram.length > 0 || proData.website.length > 0;
            case 7: return true; // Photo optional (Google default used)
            case 8: return proData.portfolioURLs.length >= 3;
            default: return true;
        }
    };

    // --- Step Handlers ---
    const handleClaimGift = async () => {
        await saveData({ role: 'PROFESSIONAL', founderGiftClaimed: true });
        setProData(prev => ({ ...prev, founderGiftClaimed: true }));
        goNext();
    };

    const handleContinue = async () => {
        if (!isStepValid(step ?? 0)) {
            setError('Please complete this step before continuing.');
            return;
        }
        setError(null);

        // Save current step data
        switch (step) {
            case 1: await saveData({ username: proData.username }); break;
            case 2: await saveData({ yearsExperience: proData.yearsExperience }); break;
            case 3: await saveData({ expertiseTags: proData.expertiseTags }); break;
            case 4: await saveData({ designPhilosophy: proData.designPhilosophy }); break;
            case 5: await saveData({ pinCode: proData.pinCode, city: proData.city }); break;
            case 6: await saveData({ linkedIn: proData.linkedIn, instagram: proData.instagram, website: proData.website }); break;
            case 7: {
                // If no custom upload, save Google photo
                if (!proData.profilePhotoURL && user) {
                    const googlePhoto = (user as any).photoURL || '';
                    await saveData({ profilePhotoURL: googlePhoto });
                    setProData(prev => ({ ...prev, profilePhotoURL: googlePhoto }));
                }
                break;
            }
            case 8: {
                // Final step — complete onboarding
                await handleComplete();
                return;
            }
        }
        goNext();
    };

    const handleComplete = async () => {
        if (!user) return;
        setShowReveal(true);

        const loopId = `#${user.uid.slice(0, 5).toUpperCase()}`;

        // Processing animation delay
        setTimeout(async () => {
            await saveData({
                hasCompletedOnboarding: true,
                verificationStatus: 'pending',
                loopId,
            });
            setRevealDone(true);
        }, 3000);
    };

    // --- Role Selection Handler ---
    const handleRoleSelect = async (selectedRole: Role) => {
        setRole(selectedRole);
        await saveData({ role: selectedRole });

        if (selectedRole === 'PROFESSIONAL') {
            setStep(0);
        } else {
            setStep(2); // Homeowner starts at name
        }
    };

    // ===========================================================
    //  HOMEOWNER FLOW (unchanged legacy)
    // ===========================================================

    const handleNameSubmitHome = () => {
        if (homeData.username.length < 3) {
            setError("A bit too short. Give us at least 3 characters.");
            return;
        }
        saveData({ username: homeData.username });
        setStep(3);
    };

    const handleIntentSelect = (intent: string) => {
        saveData({ intent });
        setStep(4);
    };

    const handlePinSubmitHome = async () => {
        if (!/^\d{6}$/.test(homeData.pinCode)) {
            setError("Must be a valid 6-digit PIN.");
            return;
        }
        await saveData({ pinCode: homeData.pinCode });
        const loopId = `#${user!.uid.slice(0, 5).toUpperCase()}`;
        await saveData({ hasCompletedOnboarding: true, loopId });
        navigate('/dashboard');
    };

    const HomeInputField = ({ value, onChange, placeholder, onSubmit, maxLength, autoFocus = true }: any) => (
        <div className="w-full max-w-xl relative group">
            <input
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { onChange(e.target.value); setError(null); }}
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && onSubmit()}
                placeholder={placeholder}
                maxLength={maxLength}
                autoFocus={autoFocus}
                className="w-full bg-transparent border-b-2 border-white/10 text-4xl md:text-6xl py-6 focus:outline-none focus:border-orange-500 transition-colors placeholder-white/5 text-white font-display font-bold tracking-tight text-center"
            />
            <div className="absolute -inset-4 bg-orange-500/0 group-focus-within:bg-orange-500/5 blur-xl transition-colors rounded-full pointer-events-none" />
            {error && (
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-6 text-orange-500 font-mono text-xs tracking-widest uppercase text-center"
                >{error}</motion.p>
            )}
            <button onClick={onSubmit}
                className={`absolute right-0 top-1/2 -translate-y-1/2 p-4 text-white/20 hover:text-white transition-colors ${value ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ArrowRight size={32} />
            </button>
        </div>
    );

    // ===========================================================
    //  RENDER
    // ===========================================================

    if (loading || step === null) return null;

    // --- REVEAL SCENE → ProProfilePreview ---
    if (showReveal) {
        return (
            <div className="w-full min-h-screen">
                <AnimatePresence mode="wait">
                    {!revealDone ? (
                        <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
                            <div className="relative w-48 h-48">
                                <motion.div className="absolute inset-0 border border-orange-500/30 rounded-lg"
                                    animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
                                <motion.div className="absolute inset-4 border border-orange-500/20 rounded-lg"
                                    animate={{ rotate: -360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} />
                                <motion.div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent"
                                    animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="text-orange-500 animate-spin" size={32} />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-white font-display text-xl font-semibold mb-2">Processing Profile...</p>
                                <p className="text-white/30 font-mono text-xs uppercase tracking-[0.2em]">Compiling dossier</p>
                            </div>
                        </motion.div>
                    ) : (
                        <ProProfilePreview
                            initialData={proData}
                            isOnboardingFinale={true}
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // --- ROLE SELECTION (step === -1) ---
    if (step === -1 || (!role && step !== null)) {
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[60vh]">
                <motion.div key="role" variants={sceneVariants} initial="initial" animate="animate" exit="exit" transition={legacyTransition} className="text-center">
                    <h2 className="text-sm font-mono text-white/40 mb-12 tracking-widest uppercase">Select your path</h2>
                    <div className="flex flex-col md:flex-row gap-8">
                        {[
                            { id: 'HOMEOWNER', label: 'Homeowner', sub: 'I want to layout my space.' },
                            { id: 'PROFESSIONAL', label: 'Professional', sub: 'I design for clients.' }
                        ].map((item) => (
                            <button key={item.id} onClick={() => handleRoleSelect(item.id as Role)}
                                className="group relative p-8 md:p-12 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-orange-500/30 transition-all duration-500 w-full md:w-[320px] text-left overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/10 group-hover:to-transparent transition-all duration-500" />
                                <h3 className="text-3xl font-display font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">{item.label}</h3>
                                <p className="text-white/40 text-sm">{item.sub}</p>
                                <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                    <ArrowRight className="text-orange-500" />
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    // ===========================================================
    //  HOMEOWNER FLOW (Legacy — steps 2, 3, 4)
    // ===========================================================
    if (role === 'HOMEOWNER') {
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[60vh]">
                <AnimatePresence mode="wait">
                    {step === 2 && (
                        <motion.div key="hname" variants={sceneVariants} initial="initial" animate="animate" exit="exit" transition={legacyTransition} className="text-center w-full flex flex-col items-center">
                            <h2 className="text-sm font-mono text-white/40 mb-8 tracking-widest uppercase">Identification</h2>
                            <h3 className="text-2xl text-white mb-12 font-light">What should we call you?</h3>
                            <HomeInputField value={homeData.username}
                                onChange={(val: string) => setHomeData({ ...homeData, username: val })}
                                onSubmit={handleNameSubmitHome} placeholder="Type here..." />
                        </motion.div>
                    )}
                    {step === 3 && (
                        <motion.div key="intent" variants={sceneVariants} initial="initial" animate="animate" exit="exit" transition={legacyTransition} className="text-center w-full flex flex-col items-center">
                            <h2 className="text-sm font-mono text-white/40 mb-12 tracking-widest uppercase">Mission Objective</h2>
                            <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                                {["Just browsing & dreaming", "Planning a renovation", "Building a new home"].map((intent) => (
                                    <button key={intent} onClick={() => handleIntentSelect(intent)}
                                        className="p-6 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 text-white text-lg font-medium transition-all text-left group flex items-center justify-between">
                                        {intent}
                                        <ArrowRight className="opacity-0 group-hover:opacity-50 -translate-x-2 group-hover:translate-x-0 transition-all" size={20} />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {step === 4 && (
                        <motion.div key="hpin" variants={sceneVariants} initial="initial" animate="animate" exit="exit" transition={legacyTransition} className="text-center w-full flex flex-col items-center">
                            <h2 className="text-sm font-mono text-white/40 mb-8 tracking-widest uppercase">Coordinates</h2>
                            <h3 className="text-2xl text-white mb-12 font-light">Where is home? (PIN Code)</h3>
                            <HomeInputField value={homeData.pinCode}
                                onChange={(val: string) => setHomeData({ ...homeData, pinCode: val.replace(/\D/g, '') })}
                                onSubmit={handlePinSubmitHome} placeholder="000000" maxLength={6} />
                        </motion.div>
                    )}
                    {step === 10 && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                            <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Issuing Pass...</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ===========================================================
    //  PROFESSIONAL FLOW (Steps 0–8)
    // ===========================================================

    const wordCount = proData.designPhilosophy.split(/\s+/).filter(Boolean).length;

    const renderProStep = () => {
        switch (step) {
            // --- STEP 0: Founder's Gift ---
            case 0:
                return (
                    <div className="flex flex-col items-center text-center">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-6">
                            <Sparkles className="text-orange-500 mx-auto mb-4" size={28} />
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-3">
                                You're in the Loop.
                            </h2>
                            <p className="text-white/40 text-sm max-w-md">
                                As an early member, we're giving you something special.
                            </p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-full max-w-md bg-[#0F0F14] border border-white/10 p-8 space-y-5">
                            {[
                                { label: '1 Year Free Specialy Plus Subscription', active: true },
                                { label: 'Priority Listing in your City', active: true },
                                { label: 'Direct line to Specialy Dev Team', active: true },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className={`w-6 h-6 flex items-center justify-center ${item.active ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-white/5 border border-white/10'}`}>
                                        <Check size={14} className={item.active ? 'text-orange-500' : 'text-white/20'} />
                                    </div>
                                    <span className={`text-sm font-medium ${item.active ? 'text-white' : 'text-white/40'}`}>
                                        {item.label}
                                    </span>
                                    {item.active && (
                                        <span className="ml-auto text-[10px] font-mono text-green-500 tracking-wider">ACTIVATED ✓</span>
                                    )}
                                </div>
                            ))}
                        </motion.div>

                        <button onClick={handleClaimGift}
                            className="mt-8 px-8 py-3.5 bg-[#EA580C] text-white font-display font-semibold text-sm tracking-wide hover:bg-[#c54a0a] transition-colors flex items-center gap-2">
                            Claim my Profile <ArrowRight size={16} />
                        </button>
                    </div>
                );

            // --- STEP 1: Identity ---
            case 1:
                return (
                    <div className="flex flex-col items-center text-center w-full">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-2">
                            Identity
                        </h2>
                        <p className="text-white/30 text-sm mb-10">This is how you will appear to homeowners.</p>

                        <input
                            value={proData.username}
                            onChange={e => { setProData(prev => ({ ...prev, username: e.target.value })); setError(null); }}
                            placeholder="Professional or Firm Name"
                            autoFocus
                            className="w-full max-w-lg bg-transparent border border-white/10 px-6 py-5 text-2xl md:text-3xl text-white font-display font-bold tracking-tight placeholder-white/10 focus:outline-none focus:border-orange-500/50 transition-colors text-center"
                        />
                        {error && <p className="mt-4 text-orange-500 text-xs font-mono uppercase tracking-widest">{error}</p>}
                    </div>
                );

            // --- STEP 2: Experience ---
            case 2:
                return (
                    <div className="flex flex-col items-center text-center">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-2">
                            Experience
                        </h2>
                        <p className="text-white/30 text-sm mb-12">Years of professional experience.</p>

                        <div className="flex items-center gap-8">
                            <button onClick={() => setProData(prev => ({ ...prev, yearsExperience: Math.max(0, prev.yearsExperience - 1) }))}
                                className="w-12 h-12 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-colors">
                                <Minus size={18} />
                            </button>

                            <div className="text-center">
                                <span className="text-6xl md:text-7xl font-display font-bold text-white">
                                    {proData.yearsExperience}
                                </span>
                                <p className="text-white/30 text-xs font-mono uppercase tracking-widest mt-2">Years</p>
                            </div>

                            <button onClick={() => setProData(prev => ({ ...prev, yearsExperience: Math.min(50, prev.yearsExperience + 1) }))}
                                className="w-12 h-12 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-colors">
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                );

            // --- STEP 3: Expertise Tags ---
            case 3:
                return (
                    <div className="flex flex-col items-center text-center w-full">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-2">
                            How should clients find you?
                        </h2>
                        <p className="text-white/30 text-sm mb-10">Select your areas of expertise.</p>

                        <div className="flex flex-wrap justify-center gap-3 max-w-lg mb-8">
                            {PRESET_TAGS.map(tag => {
                                const active = proData.expertiseTags.includes(tag);
                                return (
                                    <button key={tag}
                                        onClick={() => {
                                            setProData(prev => ({
                                                ...prev,
                                                expertiseTags: active
                                                    ? prev.expertiseTags.filter(t => t !== tag)
                                                    : [...prev.expertiseTags, tag]
                                            }));
                                        }}
                                        className={`px-4 py-2 text-sm font-medium transition-all duration-200 border ${active
                                            ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                                            : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70'
                                            }`}>
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom Tag */}
                        <div className="flex items-center gap-2 max-w-sm w-full">
                            <input
                                value={customTag}
                                onChange={e => setCustomTag(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && customTag.trim()) {
                                        if (!proData.expertiseTags.includes(customTag.trim())) {
                                            setProData(prev => ({ ...prev, expertiseTags: [...prev.expertiseTags, customTag.trim()] }));
                                        }
                                        setCustomTag('');
                                    }
                                }}
                                placeholder="Add custom tag..."
                                className="flex-1 bg-transparent border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-colors"
                            />
                            <button
                                onClick={() => {
                                    if (customTag.trim() && !proData.expertiseTags.includes(customTag.trim())) {
                                        setProData(prev => ({ ...prev, expertiseTags: [...prev.expertiseTags, customTag.trim()] }));
                                        setCustomTag('');
                                    }
                                }}
                                className="w-10 h-10 border border-white/10 flex items-center justify-center text-white/40 hover:text-orange-500 hover:border-orange-500/30 transition-colors">
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                );

            // --- STEP 4: Design Philosophy ---
            case 4:
                return (
                    <div className="flex flex-col items-center text-center w-full">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-2">
                            Design Philosophy
                        </h2>
                        <p className="text-white/30 text-sm mb-10">Tell homeowners the story behind your craft. Min 50 words.</p>

                        <textarea
                            value={proData.designPhilosophy}
                            onChange={e => { setProData(prev => ({ ...prev, designPhilosophy: e.target.value })); setError(null); }}
                            rows={6}
                            placeholder="Your design philosophy..."
                            className="w-full max-w-lg bg-transparent border border-white/10 px-6 py-4 text-white text-sm leading-relaxed placeholder-white/15 focus:outline-none focus:border-orange-500/50 transition-colors resize-none font-sans"
                        />
                        <div className="mt-3 flex items-center justify-between w-full max-w-lg">
                            <span className={`text-xs font-mono ${wordCount >= 50 ? 'text-green-500' : 'text-white/30'}`}>
                                {wordCount}/50 words {wordCount >= 50 && '✓'}
                            </span>
                        </div>
                        {error && <p className="mt-4 text-orange-500 text-xs font-mono uppercase tracking-widest">{error}</p>}
                    </div>
                );

            // --- STEP 5: Coordinates ---
            case 5:
                return (
                    <div className="flex flex-col items-center text-center w-full">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-2">
                            Where is your base?
                        </h2>
                        <p className="text-white/30 text-sm mb-10">Enter your 6-digit PIN code.</p>

                        <input
                            value={proData.pinCode}
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setProData(prev => ({ ...prev, pinCode: val }));
                                setError(null);
                                if (val.length === 6) lookupCity(val);
                            }}
                            placeholder="000000"
                            maxLength={6}
                            autoFocus
                            className="w-48 bg-transparent border border-white/10 px-6 py-5 text-4xl text-white font-display font-bold tracking-[0.3em] placeholder-white/10 focus:outline-none focus:border-orange-500/50 transition-colors text-center"
                        />

                        {cityLoading && (
                            <div className="mt-4 flex items-center gap-2 text-white/30">
                                <Loader2 size={14} className="animate-spin" />
                                <span className="text-xs font-mono uppercase tracking-widest">Looking up...</span>
                            </div>
                        )}

                        {proData.city && !cityLoading && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="mt-4 flex items-center gap-2 px-4 py-2 border border-green-500/20 bg-green-500/5">
                                <Check size={14} className="text-green-500" />
                                <span className="text-green-400 text-sm font-medium">{proData.city}</span>
                            </motion.div>
                        )}

                        {error && <p className="mt-4 text-orange-500 text-xs font-mono uppercase tracking-widest">{error}</p>}
                    </div>
                );

            // --- STEP 6: Verification Links ---
            case 6:
                return (
                    <div className="flex flex-col items-center text-center w-full">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-2">
                            Verification
                        </h2>
                        <p className="text-white/30 text-sm mb-10 max-w-md">
                            Our team manually reviews these links to maintain the Elite status of our network.
                        </p>

                        <div className="w-full max-w-md space-y-4">
                            {[
                                { icon: Linkedin, label: 'LinkedIn', value: proData.linkedIn, key: 'linkedIn' as const, placeholder: 'linkedin.com/in/yourname' },
                                { icon: Instagram, label: 'Instagram', value: proData.instagram, key: 'instagram' as const, placeholder: '@yourhandle' },
                                { icon: Globe, label: 'Website', value: proData.website, key: 'website' as const, placeholder: 'yourwebsite.com' },
                            ].map(({ icon: Icon, label, value, key, placeholder }) => (
                                <div key={key} className="flex items-center gap-3">
                                    <div className="w-10 h-10 border border-white/10 flex items-center justify-center flex-shrink-0">
                                        <Icon size={16} className="text-white/40" />
                                    </div>
                                    <input
                                        value={value}
                                        onChange={e => setProData(prev => ({ ...prev, [key]: e.target.value }))}
                                        placeholder={placeholder}
                                        className="flex-1 bg-transparent border border-white/10 px-4 py-3 text-sm text-white placeholder-white/15 focus:outline-none focus:border-orange-500/50 transition-colors"
                                    />
                                </div>
                            ))}
                        </div>

                        {error && <p className="mt-4 text-orange-500 text-xs font-mono uppercase tracking-widest">{error}</p>}
                    </div>
                );

            // --- STEP 7: Profile Photo ---
            case 7:
                return (
                    <div className="flex flex-col items-center text-center w-full">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-2">
                            Profile Identity
                        </h2>
                        <p className="text-white/30 text-sm mb-10">Your profile photo. Google photo used by default.</p>

                        <div className="relative group mb-6">
                            <div className="w-32 h-32 border border-white/10 overflow-hidden">
                                <img
                                    src={proData.profilePhotoURL || (user as any)?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(proData.username)}&background=EA580C&color=fff`}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {uploadingPhoto && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Loader2 className="text-orange-500 animate-spin" size={24} />
                                </div>
                            )}
                        </div>

                        <input ref={photoInputRef} type="file" accept="image/*"
                            className="hidden" onChange={handleProfilePhotoUpload} />

                        <button onClick={() => photoInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            className="flex items-center gap-2 px-5 py-2.5 border border-white/10 text-white/60 text-sm hover:text-white hover:border-white/30 transition-colors disabled:opacity-50">
                            <Camera size={14} />
                            {proData.profilePhotoURL ? 'Change Photo' : '+ Change Photo'}
                        </button>
                    </div>
                );

            // --- STEP 8: Portfolio ---
            case 8:
                return (
                    <div className="flex flex-col items-center text-center w-full">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-2">
                            Portfolio
                        </h2>
                        <p className="text-white/30 text-sm mb-8">Upload 3–12 images of your best work.</p>

                        {/* Drop Zone */}
                        <div
                            onClick={() => portfolioInputRef.current?.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); handlePortfolioUpload(e.dataTransfer.files); }}
                            className="w-full max-w-lg border-2 border-dashed border-white/10 hover:border-orange-500/30 transition-colors py-12 px-8 cursor-pointer group mb-6">
                            {uploadingPortfolio ? (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="text-orange-500 animate-spin" size={28} />
                                    <p className="text-white/40 text-sm">Uploading...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <Upload className="text-white/20 group-hover:text-orange-500/60 transition-colors" size={28} />
                                    <p className="text-white/40 text-sm group-hover:text-white/60 transition-colors">
                                        Drag & drop or click to upload
                                    </p>
                                    <p className="text-white/20 text-xs font-mono">
                                        {proData.portfolioURLs.length}/12 uploaded • Min 3 required
                                    </p>
                                </div>
                            )}
                        </div>

                        <input ref={portfolioInputRef} type="file" accept="image/*" multiple
                            className="hidden" onChange={e => handlePortfolioUpload(e.target.files)} />

                        {/* Thumbnails */}
                        {proData.portfolioURLs.length > 0 && (
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-2 w-full max-w-lg">
                                {proData.portfolioURLs.map((url, i) => (
                                    <div key={i} className="relative group aspect-square border border-white/5 overflow-hidden">
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removePortfolioImage(i)}
                                            className="absolute top-1 right-1 w-5 h-5 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X size={10} className="text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {error && <p className="mt-4 text-orange-500 text-xs font-mono uppercase tracking-widest">{error}</p>}
                    </div>
                );

            default:
                return null;
        }
    };

    // PRO STEPS LAYOUT
    const currentStep = step ?? 0;
    const progressPercent = ((currentStep + 1) / PRO_TOTAL_STEPS) * 100;

    return (
        <div className="w-full flex flex-col items-center justify-center min-h-[60vh] relative">
            {/* Progress Bar (thin orange line at top of content area) */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5">
                <motion.div
                    className="h-full bg-[#EA580C]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                />
            </div>

            {/* Step Content */}
            <div className="w-full max-w-[800px] mx-auto py-12 px-4">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={step}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={slideTransition}
                    >
                        {renderProStep()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            {step !== 0 && (
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-8 py-4 border-t border-white/5">
                    <button onClick={goBack}
                        className="flex items-center gap-2 text-white/30 text-sm hover:text-white/60 transition-colors">
                        <ArrowLeft size={14} /> Back
                    </button>

                    <span className="text-white/20 text-xs font-mono uppercase tracking-[0.15em]">
                        Step {currentStep} of 8
                    </span>

                    <button onClick={handleContinue}
                        disabled={!isStepValid(currentStep)}
                        className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold transition-all ${isStepValid(currentStep)
                            ? 'bg-[#EA580C] text-white hover:bg-[#c54a0a]'
                            : 'bg-white/5 text-white/20 cursor-not-allowed'
                            }`}>
                        {currentStep === 8 ? 'Complete' : 'Continue'} <ArrowRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};
