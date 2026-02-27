'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { checkIn, checkOut } from './actions';
import { toast } from 'sonner';

export function AttendanceButtons({ isCheckedIn }: { isCheckedIn: boolean }) {
    const [isLoading, setIsLoading] = useState(false);

    const getLocation = (): Promise<{ lat: number; lng: number } | null> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => resolve(null),
                { timeout: 10000 }
            );
        });
    };

    const handleAction = async () => {
        setIsLoading(true);
        try {
            const location = await getLocation();
            if (isCheckedIn) {
                const res = await checkOut(location ? { latitude: location.lat, longitude: location.lng } : undefined);
                if (res.error) toast.error(res.error);
                else toast.success('Check-out successful');
            } else {
                const res = await checkIn(location ? { latitude: location.lat, longitude: location.lng } : undefined);
                if (res.error) toast.error(res.error);
                else toast.success('Check-in successful');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckedIn) {
        return (
            <div className="flex flex-col items-center gap-3">
                <Button
                    onClick={handleAction}
                    disabled={isLoading}
                    className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/30 transition-all duration-300 border-none relative group overflow-hidden active:scale-95"
                >
                    <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors" />
                    <div className="relative flex flex-col items-center justify-center gap-2">
                        {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <LogOut className="w-8 h-8" />}
                    </div>
                </Button>
                <span className="text-sm font-bold text-white uppercase tracking-widest animate-pulse">Check Out</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <Button
                onClick={handleAction}
                disabled={isLoading}
                className="w-28 h-28 rounded-xl bg-white hover:bg-white/90 text-indigo-600 transition-colors cursor-pointer duration-300 shadow-2xl shadow-indigo-500/40 border-none group relative overflow-hidden active:scale-95"
            >
                <div className="absolute inset-0 bg-white/5" />
                <div className="relative flex flex-col items-center justify-center gap-2">
                    {isLoading ? <Loader2 className="w-10 h-10 animate-spin" /> : <LogIn className="w-10 h-10" />}
                </div>
            </Button>
            <span className="text-sm font-bold text-white uppercase tracking-widest">Check In</span>
        </div>
    );
}
