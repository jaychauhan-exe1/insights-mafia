'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function DismissableNotice({ children, id }: { children: React.ReactNode, id: string }) {
    const [isVisible, setIsVisible] = useState(true);

    // Persist session-level dismiss state in sessionStorage
    useEffect(() => {
        const isDismissed = sessionStorage.getItem(`notice_dismissed_${id}`);
        if (isDismissed) {
            setIsVisible(false);
        }
    }, [id]);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem(`notice_dismissed_${id}`, 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="relative group/notice">
            {children}
            <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/50 border border-transparent hover:bg-white hover:border-border/50 text-muted-foreground/30 hover:text-muted-foreground transition-all flex items-center justify-center shadow-sm"
                aria-label="Dismiss notice"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
