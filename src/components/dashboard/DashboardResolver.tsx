import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Dashboard from '../Dashboard';
import ShadowDashboard from './ShadowDashboard';
import { AuthenticatedLayout } from '../Layout';
import { PRE_LAUNCH_MODE, ADMIN_EMAILS } from '../../config';
import { ProProfilePreview } from '../onboarding/ProProfilePreview';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Navigate } from 'react-router-dom';

const PRO_ALLOWED_EMAIL = 'safasoudagar06@gmail.com';

const DashboardResolver: React.FC = () => {
    const { user, loading } = useAuth();
    const [role, setRole] = useState<string | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [dataLoading, setDataLoading] = useState(true);

    // Auto-fix role for specific user
    useEffect(() => {
        if (user?.email === 'amansopudagar025@gmail.com' && role && role !== 'HOMEOWNER') {
            updateDoc(doc(db, 'users', user.uid), { role: 'HOMEOWNER' });
        }
    }, [user, role]);

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

    // ── Admins always get the full Homeowner Dashboard ──
    if (isAdmin) {
        return (
            <AuthenticatedLayout>
                <Dashboard />
            </AuthenticatedLayout>
        );
    }

    // ── Verified Professionals → Pro Dashboard (only allowed email) ──
    if (role === 'PROFESSIONAL' || role === 'professional2k' || role === 'professional3k') {
        if (user?.email === PRO_ALLOWED_EMAIL) {
            return <Navigate to="/dashboard/pro" replace />;
        }
        // All other pros → pending verification or onboarding
        if (verificationStatus !== 'verified') {
            return <ProProfilePreview />;
        }
        return <Navigate to="/onboarding" replace />;
    }

    // ── Non-pre-launch → Full Dashboard ──
    if (!PRE_LAUNCH_MODE) {
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
