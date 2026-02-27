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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { reviewTask } from './actions';
import { cn } from '@/lib/utils';

export function ReviewTaskDialog({ taskId, taskTitle, className }: { taskId: string, taskTitle: string, className?: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState('');

    async function handleReview(approved: boolean) {
        setLoading(true);
        const res = await reviewTask(taskId, approved ? 'Completed' : 'Revision', feedback);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(approved ? 'Task Approved!' : 'Feedback Sent!');
            setOpen(false);
            setFeedback('');
        }
        setLoading(false);
    }

    return (
        <div className={cn("inline-flex", className)}>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-[10px] uppercase tracking-widest h-9 px-4 rounded-lg transition-all duration-300 shadow-lg shadow-primary/10">
                        Review Task
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-xl border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Review Task</DialogTitle>
                        <DialogDescription className="font-medium text-gray-500">
                            {taskTitle}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Feedback / Revisions</label>
                            <Textarea
                                placeholder="Add your comments here..."
                                value={feedback}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value)}
                                className="min-h-[120px] bg-gray-50 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-primary/20 transition-none"
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex sm:justify-between gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleReview(false)}
                            disabled={loading}
                            className="flex-1 rounded-md py-2 px-4 font-medium text-sm text-gray-900 bg-gray-200 hover:bg-gray-300 transition-colors duration-300"
                        >
                            Request Revision
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handleReview(true)}
                            disabled={loading}
                            className="flex-1 rounded-md py-2 px-4 font-medium text-sm text-white bg-primary hover:bg-primary/90 transition-colors duration-300"
                        >
                            Approve & Pay
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
