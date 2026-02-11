
import React, { useEffect, useState, useRef } from 'react';
import { Check, Loader2, WifiOff } from 'lucide-react';

export type SaveStatus = 'saved' | 'saving' | 'offline';

interface SaveIndicatorProps {
    status: SaveStatus;
    lastSaved?: Date;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({ status, lastSaved }) => {
    const [online, setOnline] = useState(navigator.onLine);
    const [showPulse, setShowPulse] = useState(false);
    const prevStatus = useRef<SaveStatus>(status);

    useEffect(() => {
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Trigger pulse when transitioning from saving to saved
    useEffect(() => {
        if (prevStatus.current === 'saving' && status === 'saved') {
            setShowPulse(true);
            const timeout = setTimeout(() => setShowPulse(false), 1500);
            return () => clearTimeout(timeout);
        }
        prevStatus.current = status;
    }, [status]);

    const displayStatus = !online ? 'offline' : status;

    return (
        <div className={`flex items-center gap-2 text-xs font-medium px-3 bg-[#0f172a]/50 rounded-full h-8 border border-white/5 backdrop-blur-sm transition-all ${showPulse ? 'animate-pulse ring-1 ring-emerald-400/30' : ''}`}>
            {displayStatus === 'saved' && (
                <>
                    <Check className={`w-3.5 h-3.5 text-emerald-400 ${showPulse ? 'scale-110' : ''} transition-transform`} />
                    <span className="text-emerald-400">Saved</span>
                </>
            )}

            {displayStatus === 'saving' && (
                <>
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    <span className="text-blue-400">Saving...</span>
                </>
            )}

            {displayStatus === 'offline' && (
                <>
                    <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-rose-500">Offline</span>
                </>
            )}
        </div>
    );
};
