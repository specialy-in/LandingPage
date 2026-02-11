import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PRE_LAUNCH_MODE, ADMIN_EMAILS } from '../config';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
    const location = useLocation();

    useEffect(() => {
        let unsubscribe: () => void;

        if (user && !loading) {
            const docRef = doc(db, 'users', user.uid);
            unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists() && docSnap.data().hasCompletedOnboarding) {
                    setIsOnboarded(true);
                } else {
                    setIsOnboarded(false);
                }
            }, (error) => {
                console.error("Error checking onboarding status", error);
                setIsOnboarded(false);
            });
        } else if (!loading && !user) {
            setIsOnboarded(false);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user, loading]);

    if (loading || (user && isOnboarded === null)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    // IF user IS onboarded, but tries to go to /onboarding -> ALLOW it for Referral Hub access
    // We no longer redirect to dashboard here to support the "Stay in the Loop" flow
    // if (isOnboarded && location.pathname === '/onboarding') {
    //    return <Navigate to="/dashboard" replace />;
    // }

    // --- PRE-LAUNCH GUARD ---
    if (PRE_LAUNCH_MODE && isOnboarded) {
        const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);

        // If NOT admin, and trying to go anywhere except /onboarding (the referral hub), BLOCK THEM.
        if (!isAdmin && location.pathname !== '/onboarding') {
            return <Navigate to="/onboarding" replace />;
        }
    }

    // IF user is NOT onboarded, and tries to go anywhere EXCEPT /onboarding -> redirect to /onboarding
    if (isOnboarded === false && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
};
