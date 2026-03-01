'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { processPayment } from './actions';
import { IndianRupee, Send } from 'lucide-react';

export function PayoutDialog({ freelancerId, freelancerName, balance }: { freelancerId: string, freelancerName: string, balance: number }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    async function handlePayout() {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return toast.error('Please enter a valid amount');
        }

        setLoading(true);
        const res = await processPayment(freelancerId, numAmount, description);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(`Successfully paid ₹${numAmount} to ${freelancerName}`);
            setOpen(false);
            setAmount('');
            setDescription('');
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold h-9 rounded-xl transition-none px-5">
                    Pay Now
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] rounded-xl border-none shadow-2xl p-8">
                <DialogHeader className="space-y-3 pb-4">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <IndianRupee className="w-4 h-4" />
                        </div>
                        Payout to {freelancerName.split(' ')[0]}
                    </DialogTitle>
                    <DialogDescription className="font-medium text-muted-foreground">
                        Current wallet balance: <span className="text-foreground font-semibold">₹{balance.toLocaleString('en-IN')}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    <div className="space-y-2">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider ml-1">Amount to Payout</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                            <Input
                                placeholder="0.00"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="h-12 pl-8 bg-muted/30 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-primary/20 transition-none font-semibold text-lg tabular-nums"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider ml-1">Note / Description</label>
                        <Input
                            placeholder="e.g. Month end payout"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="h-12 bg-muted/30 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-primary/20 transition-none font-medium"
                        />
                    </div>
                </div>

                <DialogFooter className="pt-4">
                    <Button
                        type="button"
                        onClick={handlePayout}
                        disabled={loading}
                        className="w-full rounded-lg h-12 font-semibold bg-primary hover:bg-primary/90 text-white transition-none shadow-lg shadow-primary/10 flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {loading ? 'Processing...' : 'Complete Payment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
