import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Dashboard from '../Dashboard';
import ShadowDashboard from './ShadowDashboard';
import { AuthenticatedLayout } from '../Layout';
import { PRE_LAUNCH_MODE, ADMIN_EMAILS } from '../../config';
import { ProProfilePreview } from '../onboarding/ProProfilePreview';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const DashboardResolver: React.FC = () => {
    const { user, loading } = useAuth();
    const [role, setRole] = useState<string | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!user || loading) return;
        const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
            if (snap.exists()) {
                const data = snap.data();
                setRole(data.role || null);
                setVerificationStatus(data.verificationStatus || null);
            }
            setDataLoading(false);
        });
        return () => unsub();
    }, [user, loading]);

    if (loading || dataLoading) return null;

    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

    // ── Professionals with pending verification → Profile Hub ──
    if (role === 'PROFESSIONAL' && verificationStatus !== 'verified' && !isAdmin) {
        return <ProProfilePreview />;
    }

    // ── Verified Professionals / Admins → Full Dashboard ──
    if (!PRE_LAUNCH_MODE || isAdmin) {
        return (
            <AuthenticatedLayout>
                <Dashboard />
            </AuthenticatedLayout>
        );
    }

    // ── Default: Non-admin users in pre-launch → Shadow Dashboard ──
    return <ShadowDashboard />;
};

export default DashboardResolver;
