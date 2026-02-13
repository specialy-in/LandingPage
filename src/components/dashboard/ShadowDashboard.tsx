import React from 'react';

const ShadowDashboard: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center">
            <div className="text-center max-w-md">
                <div className="flex items-center justify-center gap-1 mb-4">
                    <span className="font-display text-xl font-bold text-white tracking-tight">
                        Specialy
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1" />
                </div>
                <h1 className="text-3xl font-serif font-bold mb-4">You're on the List</h1>
                <p className="text-white/50 text-sm leading-relaxed">
                    We're rolling out access in waves. You'll get a notification when your dashboard is ready.
                </p>
            </div>
        </div>
    );
};

export default ShadowDashboard;
