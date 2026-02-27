
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

export function LeaveRequestModal() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [reason, setReason] = useState('');
    const [willWorkSunday, setWillWorkSunday] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await submitLeaveRequest({ date, reason, will_work_sunday: willWorkSunday });
            if (res.error) toast.error(res.error);
            else {
                toast.success('Leave request submitted for approval');
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
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date of Leave</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="date"
                                className="pl-10"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={format(new Date(), 'yyyy-MM-dd')}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reason for Leave</label>
                        <Textarea
                            placeholder="Why do you need leave?"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            className="min-h-[100px] resize-none"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className={`flex items-center justify-between p-5 rounded-lg border transition-all duration-300 ${willWorkSunday ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-muted/30 border-border/50'}`}>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground flex items-center gap-2">
                                    Work on upcoming Sunday
                                    {willWorkSunday && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                                </label>
                                <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed max-w-[200px]">
                                    Earn credit for this leave by working on the next Sunday.
                                </p>
                            </div>
                            <Switch
                                checked={willWorkSunday}
                                onCheckedChange={setWillWorkSunday}
                            />
                        </div>

                        {willWorkSunday && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-red-900 leading-relaxed uppercase tracking-tight">
                                    Warning: If you don't check in on the upcoming Sunday, both the leave date and Sunday will be marked as absent.
                                </p>
                            </div>
                        )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Submit Request
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
