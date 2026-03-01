
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format, isSunday, nextSunday, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Plane, AlertTriangle } from 'lucide-react';
import { submitLeaveRequest } from './actions';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export function LeaveRequestModal() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMultiDay, setIsMultiDay] = useState(false);
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [reason, setReason] = useState('');
    const [willWorkSunday, setWillWorkSunday] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const dates: string[] = [];

            if (isMultiDay) {
                let current = parseISO(startDate);
                const end = parseISO(endDate);

                if (current > end) {
                    toast.error("End date must be after start date");
                    setIsLoading(false);
                    return;
                }

                while (current <= end) {
                    dates.push(format(current, 'yyyy-MM-dd'));
                    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
                }
            } else {
                dates.push(startDate);
            }

            const res = await submitLeaveRequest({ dates, reason, will_work_sunday: willWorkSunday });
            if (res.error) toast.error(res.error);
            else {
                toast.success(`Leave request submitted for ${dates.length} day${dates.length > 1 ? 's' : ''}`);
                setOpen(false);
                setReason('');
                setWillWorkSunday(false);
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-6 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 group">
                    <Plane className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary">Request Leave</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Plane className="w-5 h-5 text-primary" />
                        Request Leave
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                    {/* Multi-day Toggle */}
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/30 border border-border/50">
                        <div className="space-y-0.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                                Multiple Days
                                {isMultiDay && <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />}
                            </label>
                            <p className="text-[9px] text-muted-foreground font-bold">Select a range of dates</p>
                        </div>
                        <Switch checked={isMultiDay} onCheckedChange={setIsMultiDay} />
                    </div>

                    <div className={cn("grid gap-4", isMultiDay ? "grid-cols-2" : "grid-cols-1")}>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {isMultiDay ? "Start Date" : "Date of Leave"}
                            </label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    className="pl-10"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    required
                                />
                            </div>
                        </div>
                        {isMultiDay && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">End Date</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        className="pl-10"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate}
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reason for Leave</label>
                        <Textarea
                            placeholder="Why do you need leave?"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            className="min-h-[80px] resize-none"
                        />
                    </div>

                    {!isMultiDay && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${willWorkSunday ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-muted/30 border-border/50'}`}>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-foreground flex items-center gap-2">
                                        Work on upcoming Sunday
                                    </label>
                                    <p className="text-[9px] text-muted-foreground font-bold leading-relaxed max-w-[220px]">
                                        Compensate for this leave by working on next Sunday.
                                    </p>
                                </div>
                                <Switch
                                    checked={willWorkSunday}
                                    onCheckedChange={setWillWorkSunday}
                                />
                            </div>

                            {willWorkSunday && (
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100 animate-in fade-in duration-300">
                                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-[9px] font-black text-red-900 leading-tight uppercase tracking-tight">
                                        Important: Failing to work on Sunday will count as two absences.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Submit Request
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
