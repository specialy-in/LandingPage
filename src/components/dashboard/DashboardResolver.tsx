import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Dashboard from '../Dashboard';
import ShadowDashboard from './ShadowDashboard';
import { AuthenticatedLayout } from '../Layout';
import { PRE_LAUNCH_MODE, ADMIN_EMAILS } from '../../config';

const DashboardResolver: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) return null;

    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

    // If Pre-Launch Mode is ON, only Admins see the Real Dashboard.
    // If Pre-Launch Mode is OFF, everyone sees the Real Dashboard.
    if (!PRE_LAUNCH_MODE || isAdmin) {
        return (
            <AuthenticatedLayout>
                <Dashboard />
            </AuthenticatedLayout>
        );
    }

    // Non-admins see the Shadow Dashboard (Waitlist View)
    return <ShadowDashboard />;
};

export default DashboardResolver;
