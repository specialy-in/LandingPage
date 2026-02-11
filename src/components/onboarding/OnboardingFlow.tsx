import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase';
import { doc, setDoc, onSnapshot, getDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, ArrowRight, Star, Lock } from 'lucide-react';
import { PRE_LAUNCH_MODE, ADMIN_EMAILS } from '../../config';

// --- Types ---
type Role = 'HOMEOWNER' | 'PROFESSIONAL' | null;

interface UserData {
    role: Role;
    username: string;
    pinCode: string;
    portfolio: string;
    referralId?: string;
    referredBy?: string;
    referralProcessed?: boolean;
    hasCompletedOnboarding: boolean;
}

// --- Animation Variants ---
const sceneVariants = {
    initial: { opacity: 0, y: 100 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -100 },
};

const transition = { duration: 0.8, ease: [0.16, 1, 0.3, 1] };

export const OnboardingFlow: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<number | null>(null); // Start null to prevent flash
    const [userData, setUserData] = useState<UserData>({
        role: null,
        username: '',
        pinCode: '',
        portfolio: '',
        hasCompletedOnboarding: false,
    });
    const [error, setError] = useState<string | null>(null);
    const [referralLink, setReferralLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- Smart Resume & Persistence ---
    useEffect(() => {
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);

        // Use onSnapshot for real-time updates and offline support
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as UserData;

                setUserData(prev => ({ ...prev, ...data }));

                setStep(prevStep => {
                    if (prevStep !== null) return prevStep; // Already initialized

                    if (data.hasCompletedOnboarding) return 5;
                    if (!data.role) return 1;
                    if (!data.username) return 2;
                    if (!data.pinCode) return 3;
                    if (data.role === 'PROFESSIONAL' && !data.portfolio) return 4;
                    return 5;
                });

                if (data.referralId) {
                    setReferralLink(`specialy.in/join?ref=${data.referralId}`);
                }
            } else {
                // New user document doesn't exist yet
                setStep(1);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching user data:", err);
            // Fallback to step 1 if offline/error and no cache
            setStep(prev => prev ?? 1);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // --- Reward Logic (Referrer Payout) ---
    useEffect(() => {
        if (step === 5 && userData.referredBy && !userData.referralProcessed && user) {
            const processReferral = async () => {
                try {
                    const { query, collection, where, getDocs, updateDoc, doc, increment } = await import('firebase/firestore');

                    // 1. Find the referrer document
                    const q = query(collection(db, 'users'), where('referralId', '==', userData.referredBy));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const referrerDoc = querySnapshot.docs[0];

                        // 2. Increment referrer's reward count
                        await updateDoc(doc(db, 'users', referrerDoc.id), {
                            inviteCount: increment(1)
                        });

                        // 3. Mark current user as processed
                        await updateDoc(doc(db, 'users', user.uid), {
                            referralProcessed: true
                        });
                    }
                } catch (err) {
                    console.error("Referral Reward error:", err);
                }
            };
            processReferral();
        }
    }, [step, userData.referredBy, userData.referralProcessed, user]);

    // --- Save Helper ---
    const saveData = useCallback(async (data: Partial<UserData>) => {
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);
        try {
            await setDoc(userRef, {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (err) {
            console.error("[Onboarding] Error saving data:", err);
        }
    }, [user]);

    // --- Actions ---

    const handleRoleSelect = (role: Role) => {
        const newData = { ...userData, role };
        setUserData(newData);
        saveData({ role });
        setTimeout(() => setStep(2), 500);
    };

    const handleUsernameSubmit = () => {
        if (userData.username.length < 3 || !/^[a-zA-Z0-9 ]+$/.test(userData.username)) {
            setError("Make it unique (3+ alphanumeric chars).");
            return;
        }
        setError(null);
        saveData({ username: userData.username });
        setStep(3);
    };

    const handlePinSubmit = () => {
        if (!/^\d{6}$/.test(userData.pinCode)) {
            setError("Looks like you're out of bounds. Specialy is currently India-only.");
            return;
        }
        setError(null);
        saveData({ pinCode: userData.pinCode });

        if (userData.role === 'PROFESSIONAL') {
            setStep(4);
        } else {
            completeOnboarding();
        }
    };

    const handlePortfolioSubmit = () => {
        if (userData.portfolio && !userData.portfolio.includes('.')) {
            setError("We couldn't find your magic at that link. Try again?");
            return;
        }
        setError(null);
        saveData({ portfolio: userData.portfolio });
        completeOnboarding();
    };

    const completeOnboarding = async () => {
        if (!user) return;

        let existingReferralId = userData.referralId;

        // If no referral ID exists, generate one
        if (!existingReferralId) {
            const shortId = `specialy_${user.uid.slice(0, 4).toUpperCase()}`;
            existingReferralId = shortId;
            setUserData(prev => ({ ...prev, referralId: shortId })); // Optimistic update
        }

        const refLink = `specialy.in/join?ref=${existingReferralId}`;
        setReferralLink(refLink);

        const finalData: any = {
            hasCompletedOnboarding: true,
            referralId: existingReferralId,
        };

        // --- Attribution Logic ---
        const pendingRef = sessionStorage.getItem('pendingReferral');
        if (pendingRef) {
            finalData.referredBy = pendingRef;
            sessionStorage.removeItem('pendingReferral');
        }

        // Check for old referral key (backwards compatible)
        const oldRef = sessionStorage.getItem('referredBy');
        if (oldRef && !pendingRef) {
            finalData.referredBy = oldRef;
            sessionStorage.removeItem('referredBy');
        }

        // FIRE AND FORGET: Don't await the save. Let the UI transition immediately.
        saveData(finalData).catch(err => console.error("Background save failed:", err));

        setStep(5); // Immediate transition to Success Scene
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // --- Render Helpers ---

    const InputField = ({
        value,
        onChange,
        placeholder,
        onSubmit,
        type = "text",
        maxLength
    }: {
        value: string;
        onChange: (val: string) => void;
        placeholder: string;
        onSubmit: () => void;
        type?: string;
        maxLength?: number;
    }) => (
        <div className="w-full max-w-2xl relative">
            <input
                type={type}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                placeholder={placeholder}
                maxLength={maxLength}
                autoFocus
                className="w-full bg-transparent border-b-2 border-white/10 text-4xl md:text-6xl py-4 focus:outline-none focus:border-orange-600 transition-colors placeholder-white/10 font-sans"
            />
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 mt-4 text-red-500 font-mono text-sm tracking-wider uppercase"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );

    if (loading || step === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    <p className="text-white/40 font-mono text-xs tracking-widest uppercase animate-pulse">Initializing Space...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative">
            {/* User Profile Badge */}
            {user && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="fixed top-6 right-6 md:top-10 md:right-10 z-[100] flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-2 pr-6 backdrop-blur-xl shadow-2xl"
                >
                    <div className="relative">
                        <img
                            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                            alt="Profile"
                            className="w-10 h-10 rounded-xl border border-white/10 object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0A0A0F]" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-white font-bold text-sm leading-tight tracking-tight">
                            {userData.username || 'Searching Name...'}
                        </p>
                        <p className="text-white/40 text-[10px] font-mono tracking-wider uppercase overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]">
                            {user.email}
                        </p>
                    </div>
                </motion.div>
            )}

            <AnimatePresence mode="wait">

                {/* SCENE 1: ROLE */}
                {step === 1 && (
                    <motion.div
                        key="scene1"
                        variants={sceneVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={transition}
                        className="text-center w-full"
                    >
                        <h2 className="text-xl md:text-2xl font-mono text-white/40 mb-12 tracking-widest uppercase">
                            Who are you?
                        </h2>
                        <div className="flex flex-col md:flex-row gap-8 md:gap-24 items-center justify-center">
                            {['HOMEOWNER', 'PROFESSIONAL'].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => handleRoleSelect(role as Role)}
                                    className={`text-5xl md:text-7xl font-bold tracking-tighter transition-all duration-500 hover:scale-110 ${userData.role && userData.role !== role ? 'opacity-10 scale-90 blur-sm' : 'hover:text-orange-600'
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* SCENE 2: USERNAME */}
                {step === 2 && (
                    <motion.div
                        key="scene2"
                        variants={sceneVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={transition}
                        className="w-full flex flex-col items-center text-center"
                    >
                        <h2 className="text-xl md:text-2xl font-mono text-white/40 mb-4 tracking-widest uppercase">
                            What's your name?
                        </h2>
                        <p className="text-white/30 italic mb-12">
                            Keep it special. You can't change this later without paperwork.
                        </p>
                        <InputField
                            value={userData.username}
                            onChange={(val) => setUserData({ ...userData, username: val })}
                            onSubmit={handleUsernameSubmit}
                            placeholder="Type here..."
                        />
                    </motion.div>
                )}

                {/* SCENE 3: LOCATION (PIN) */}
                {step === 3 && (
                    <motion.div
                        key="scene3"
                        variants={sceneVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={transition}
                        className="w-full flex flex-col items-center text-center"
                    >
                        <h2 className="text-xl md:text-2xl font-mono text-white/40 mb-4 tracking-widest uppercase">
                            Where is home?
                        </h2>
                        <p className="text-white/30 italic mb-12">
                            Just the 6-digit PIN. We aren't coming over for tea (yet).
                        </p>
                        <InputField
                            value={userData.pinCode}
                            onChange={(val) => setUserData({ ...userData, pinCode: val.replace(/\D/g, '') })}
                            onSubmit={handlePinSubmit}
                            placeholder="000000"
                            maxLength={6}
                        />
                    </motion.div>
                )}

                {/* SCENE 4: PORTFOLIO (PRO ONLY) */}
                {step === 4 && (
                    <motion.div
                        key="scene4"
                        variants={sceneVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={transition}
                        className="w-full flex flex-col items-center text-center"
                    >
                        <h2 className="text-xl md:text-2xl font-mono text-white/40 mb-4 tracking-widest uppercase">
                            Show your magic.
                        </h2>
                        <p className="text-white/30 italic mb-12">
                            Link your portfolio or social profile.
                        </p>
                        <InputField
                            value={userData.portfolio}
                            onChange={(val) => setUserData({ ...userData, portfolio: val })}
                            onSubmit={handlePortfolioSubmit}
                            placeholder="specialy.in/portfolio"
                        />
                    </motion.div>
                )}

                {/* SCENE 5: REFERRAL HUB (FINAL) */}
                {step === 5 && (
                    <motion.div
                        key="scene5"
                        variants={sceneVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={transition}
                        className="w-full flex flex-col items-center text-center max-w-3xl"
                    >
                        <div className="mb-8">
                            <span className="inline-block px-3 py-1 rounded-full bg-orange-600/10 text-orange-600 text-xs font-bold tracking-widest uppercase border border-orange-600/20 mb-4">
                                Onboarding Complete
                            </span>
                            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-2">
                                You're officially<br />in the loop.
                            </h2>
                        </div>

                        {/* Referral Box */}
                        <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-2xl p-2 flex items-center gap-2 backdrop-blur-md mb-12 shadow-[0_0_40px_-10px_rgba(234,88,12,0.3)] hover:border-orange-600/50 transition-colors">
                            <div className="flex-1 px-4 py-3 bg-black/40 rounded-xl text-left overflow-hidden">
                                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Your Personal Link</p>
                                <p className="text-lg md:text-xl font-mono text-white truncate">
                                    {referralLink}
                                </p>
                            </div>
                            <button
                                onClick={handleCopy}
                                className={`h-full px-6 py-4 rounded-xl font-bold text-sm tracking-wide transition-all ${copied
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-white text-charcoal hover:bg-orange-600 hover:text-white'
                                    }`}
                            >
                                {copied ? 'Copied! ⚡' : 'Copy Link'}
                            </button>
                        </div>

                        {/* Rewards Progress */}
                        <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 text-left relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Star size={48} />
                                </div>
                                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Next Milestone</p>
                                <h3 className="text-2xl font-bold text-white mb-1">1 Year Free Pro</h3>
                                <p className="text-sm text-white/60 mb-4">Invite 5 friends to unlock.</p>

                                {/* Progress Bar */}
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '0%' }} // Placeholder for 0/5
                                        className="h-full bg-orange-600"
                                    />
                                </div>
                                <p className="text-right text-xs text-white/40 mt-2 font-mono">0/5 Joined</p>
                            </div>

                            <button
                                onClick={() => {
                                    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
                                    if (!PRE_LAUNCH_MODE || isAdmin) {
                                        navigate('/dashboard');
                                    }
                                }}
                                disabled={PRE_LAUNCH_MODE && !(user?.email && ADMIN_EMAILS.includes(user.email))}
                                className={`bg-white/5 rounded-2xl p-6 border border-white/5 text-left flex flex-col justify-between group hover:bg-white/10 transition-colors ${(PRE_LAUNCH_MODE && !(user?.email && ADMIN_EMAILS.includes(user.email))) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                <div>
                                    <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
                                        {(PRE_LAUNCH_MODE && !(user?.email && ADMIN_EMAILS.includes(user.email))) ? 'Opening Soon' : 'Ready to explore?'}
                                    </p>
                                    <h3 className="text-2xl font-bold text-white">
                                        {(PRE_LAUNCH_MODE && !(user?.email && ADMIN_EMAILS.includes(user.email))) ? 'Dashboard Locked' : 'Enter Dashboard'}
                                    </h3>
                                </div>
                                <div className="self-end mt-4">
                                    <div className="w-10 h-10 rounded-full bg-white text-charcoal flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {(PRE_LAUNCH_MODE && !(user?.email && ADMIN_EMAILS.includes(user.email))) ? <Lock size={20} /> : <ArrowRight size={20} />}
                                    </div>
                                </div>
                            </button>
                        </div>

                        <p className="text-white/20 text-sm font-mono max-w-md mx-auto leading-relaxed">
                            "While you wait for us to polish the floors, go tell your friends how cool you are for finding us early."
                        </p>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};
