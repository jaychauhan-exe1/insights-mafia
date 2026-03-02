'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2, Check, ChevronsUpDown, Building2, MapPin } from 'lucide-react';
import { checkIn, checkOut } from './actions';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function AttendanceButtons({ isCheckedIn, clients, isDisabled = false }: { isCheckedIn: boolean; clients: string[]; isDisabled?: boolean }) {
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedWorkplace, setSelectedWorkplace] = useState("");

    const workplaces = ["Office", ...clients];

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
        if (!selectedWorkplace) {
            toast.error("Please select a place of work first");
            return;
        }

        setIsLoading(true);
        try {
            const location = await getLocation();
            if (isCheckedIn) {
                const res = await checkOut(selectedWorkplace, location ? { latitude: location.lat, longitude: location.lng } : undefined);
                if (res.error) {
                    if (res.error === "REMAINING_WORK") {
                        toast.error(res.message, {
                            action: {
                                label: "Go to Tasks",
                                onClick: () => window.location.href = "/dashboard/tasks"
                            },
                        });
                    } else {
                        toast.error(res.error);
                    }
                } else {
                    toast.success('Check-out successful');
                    setSelectedWorkplace("");
                }
            } else {
                const res = await checkIn(selectedWorkplace, location ? { latitude: location.lat, longitude: location.lng } : undefined);
                if (res.error) toast.error(res.error);
                else {
                    toast.success('Check-in successful');
                    setSelectedWorkplace("");
                }
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-[280px]">
            <div className="w-full space-y-2">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">Place of Work</p>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white h-11 rounded-xl transition-all duration-300 font-bold text-xs shadow-lg backdrop-blur-md"
                        >
                            <div className="flex items-center gap-2 truncate">
                                <Building2 className="w-4 h-4 opacity-50 shrink-0" />
                                {selectedWorkplace
                                    ? workplaces.find((w) => w === selectedWorkplace)
                                    : "Search & Select Place..."}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-border/50 shadow-2xl rounded-xl">
                        <Command className="rounded-xl overflow-hidden border-none">
                            <CommandInput placeholder="Search place..." className="h-10 text-xs font-bold" />
                            <CommandList className="max-h-[240px]">
                                <CommandEmpty className="py-6 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">No place found.</CommandEmpty>
                                <CommandGroup>
                                    {workplaces.map((place) => (
                                        <CommandItem
                                            key={place}
                                            value={place}
                                            onSelect={(currentValue) => {
                                                setSelectedWorkplace(currentValue === selectedWorkplace ? "" : currentValue);
                                                setOpen(false);
                                            }}
                                            className="py-2.5 px-4 text-xs font-bold text-foreground cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                    place === "Office" ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-600"
                                                )}>
                                                    {place === "Office" ? <Building2 className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                                </div>
                                                <span className="flex-1 truncate">{place}</span>
                                                <Check
                                                    className={cn(
                                                        "ml-auto h-4 w-4 text-primary",
                                                        selectedWorkplace === place ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex flex-col items-center gap-4">
                {isCheckedIn ? (
                    <div className="flex flex-col items-center gap-3">
                        <Button
                            onClick={handleAction}
                            disabled={isLoading || !selectedWorkplace}
                            className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/30 transition-all duration-300 border-none relative group overflow-hidden active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors" />
                            <div className="relative flex flex-col items-center justify-center gap-2">
                                {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <LogOut className="w-8 h-8" />}
                            </div>
                        </Button>
                        <span className="text-[10px] font-extrabold text-white uppercase tracking-widest animate-pulse">Check Out</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <Button
                            onClick={handleAction}
                            disabled={isLoading || !selectedWorkplace || isDisabled}
                            className="w-28 h-28 rounded-xl bg-white hover:bg-white/90 text-indigo-600 transition-colors cursor-pointer duration-300 shadow-2xl shadow-indigo-500/40 border-none group relative overflow-hidden active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-white/5" />
                            <div className="relative flex flex-col items-center justify-center gap-2">
                                {isLoading ? <Loader2 className="w-10 h-10 animate-spin" /> : <LogIn className="w-10 h-10" />}
                            </div>
                        </Button>
                        <span className="text-[10px] font-extrabold text-white uppercase tracking-widest">
                            {isDisabled ? "Check-in starts at 10:00 AM" : "Check in"}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
