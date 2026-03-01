'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { approveLeaveRequest, rejectLeaveRequest } from './actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ApprovalActionsProps {
    requestId: string;
    hasPaidBalance: boolean;
    requestedAsPaid: boolean;
    paidLeavesLeft: number;
}

export function ApprovalActions({ requestId, hasPaidBalance, requestedAsPaid, paidLeavesLeft }: ApprovalActionsProps) {
    const [isPaid, setIsPaid] = useState(requestedAsPaid && hasPaidBalance);
    const [isLoading, setIsLoading] = useState(false);

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            const res = await approveLeaveRequest(requestId, isPaid);
            if (res.error) toast.error(res.error);
            else toast.success('Request approved');
        } catch (error) {
            toast.error('Failed to approve');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        setIsLoading(true);
        try {
            const res = await rejectLeaveRequest(requestId);
            if (res.error) toast.error(res.error);
            else toast.success('Request rejected');
        } catch (error) {
            toast.error('Failed to reject');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            {hasPaidBalance && (
                <div className="flex items-center justify-end gap-2 mb-1">
                    <Checkbox
                        id={`paid-${requestId}`}
                        checked={isPaid}
                        onCheckedChange={(checked) => setIsPaid(checked as boolean)}
                        className="h-3.5 w-3.5 border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:text-white"
                    />
                    <Label
                        htmlFor={`paid-${requestId}`}
                        className="text-[10px] font-bold text-muted-foreground uppercase cursor-pointer hover:text-primary transition-colors"
                    >
                        Treat as Paid ({paidLeavesLeft} left)
                    </Label>
                </div>
            )}
            {!hasPaidBalance && requestedAsPaid && (
                <p className="text-[9px] font-bold text-red-400 uppercase text-right mb-1">No paid leaves left</p>
            )}

            <div className="flex justify-end gap-2">
                <Button
                    onClick={handleApprove}
                    disabled={isLoading}
                    size="sm"
                    className="h-8 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold text-[9px] uppercase tracking-widest transition-all duration-300"
                >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Approve'}
                </Button>
                <Button
                    onClick={handleReject}
                    disabled={isLoading}
                    variant="outline"
                    className="h-8 px-4 text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 hover:bg-red-50 rounded-lg font-bold text-[9px] uppercase tracking-widest transition-all duration-300"
                >
                    Reject
                </Button>
            </div>
        </div>
    );
}
