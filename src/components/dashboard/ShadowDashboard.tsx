import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Lock, Copy, Check, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import MagicalFinds from '../landing/MagicalFinds'; // Reusing for background
import Footer from '../landing/Footer'; // Reusing for consistency

const ShadowDashboard: React.FC = () => {
    const { user } = useAuth();
    const [referralLink, setReferralLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [inviteCount, setInviteCount] = useState(0); // Placeholder for now
    const [rank, setRank] = useState<number>(0);

    useEffect(() => {
        if (user) {
            // Generate deterministic "rank" based on UID for consistency
            const deterministicRank = 100 + (user.uid.charCodeAt(0) + user.uid.charCodeAt(1) * 2) % 800;
            setRank(deterministicRank);

            // Fetch user data for referral ID
            const fetchUserData = async () => {
                const userRef = doc(db, 'users', user.uid);
                const snap = await getDoc(userRef);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.referralId) {
                        setReferralLink(`specialy.in/join?ref=${data.referralId}`);
                    }
                }
            };
            fetchUserData();
        }
    }, [user]);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col font-sans selection:bg-orange-900 selection:text-white relative overflow-hidden">
            {/* Header - Locked */}
            <header className="fixed top-0 left-0 right-0 py-6 px-8 z-50 flex justify-between items-center backdrop-blur-md border-b border-white/5 bg-[#0A0A0F]/80">
                <div className="text-xl font-display font-medium tracking-tight">specialy</div>
                <nav className="hidden md:flex gap-8">
                    {['Projects', 'Magical Finds', 'Architects'].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-white/30 cursor-not-allowed group">
                            <span className="text-sm font-medium tracking-wide">{item}</span>
                            <Lock className="w-3 h-3 text-white/20 group-hover:text-orange-500/50 transition-colors" />
                        </div>
                    ))}
                </nav>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-rose-400 opacity-80" />
            </header>

            {/* Main Content */}
            <main className="flex-grow relative flex items-center justify-center pt-20">

                {/* Background Teaser (Blurred) */}
                <div className="absolute inset-0 z-0 opacity-20 filter blur-xl pointer-events-none select-none overflow-hidden mask-image-gradient">
                    <div className="scale-75 origin-top opacity-50 grayscale">
                        <MagicalFinds />
                    </div>
                </div>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0A0A0F]/90 to-[#0A0A0F] z-10" />

                {/* Dashboard Card */}
                <div className="relative z-20 w-full max-w-4xl px-4 flex flex-col items-center text-center gap-8">

                    {/* Status Pill */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-900/20 border border-green-500/20 text-green-400 text-xs font-mono uppercase tracking-widest shadow-[0_0_15px_-3px_rgba(74,222,128,0.2)]">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Waitlist Active
                    </div>

                    {/* Hero Text */}
                    <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/40 max-w-2xl leading-[1.1]">
                        The loop is being polished.
                    </h1>
                    <p className="text-white/40 font-light text-lg max-w-lg mx-auto">
                        We're putting the final touches on the marketplace. You've secured your spot. We'll ping you when the doors open.
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-4">
                        {/* Rank Card */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                            <span className="text-white/40 text-xs font-mono uppercase tracking-wider">Your Rank</span>
                            <span className="text-3xl font-display text-white">
                                Loop Member #{rank}
                            </span>
                        </div>

                        {/* Progress Card */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 backdrop-blur-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="flex w-full justify-between items-center text-xs text-white/40 font-mono uppercase tracking-wider mb-1 z-10">
                                <span>1 Year Free Pro</span>
                                <span>{inviteCount}/5 Invited</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden z-10">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(inviteCount / 5) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-orange-500 to-rose-500"
                                />
                            </div>
                            <p className="text-white/30 text-xs mt-2 z-10">Invite friends to unlock early access rewards.</p>
                        </div>
                    </div>

                    {/* Persistent Referral Link */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="w-full max-w-lg bg-[#121216] border border-white/10 rounded-xl p-2 flex items-center gap-3 mt-8 shadow-2xl shadow-black/50"
                    >
                        <div className="flex-1 bg-black/30 rounded-lg px-4 py-3 font-mono text-sm text-white/70 overflow-hidden text-ellipsis whitespace-nowrap">
                            {referralLink || "Loading your unique link..."}
                        </div>
                        <button
                            onClick={handleCopy}
                            className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center gap-2 min-w-[140px] justify-center"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied!" : "Copy Link"}
                        </button>
                    </motion.div>

                </div>
            </main>

            <div className="opacity-50 pointer-events-none mt-20">
                <Footer />
            </div>
        </div>
    );
};

export default ShadowDashboard;
