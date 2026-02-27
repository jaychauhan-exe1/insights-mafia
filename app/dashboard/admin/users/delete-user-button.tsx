'use client';

import { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { deleteUser } from './actions';
import { toast } from 'sonner';

export function DeleteUserButton({ userId, userName }: { userId: string, userName: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const res = await deleteUser(userId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`User ${userName} deleted successfully`);
                setOpen(false);
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
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 transition-all duration-300">
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl border-none shadow-2xl p-8 max-w-[400px]">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-500 mb-4 mx-auto">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-gray-800 text-center">
                        Remove Team Member?
                    </DialogTitle>
                    <div className="text-gray-500 font-medium text-center text-sm pt-2">
                        This will permanently delete <span className="text-gray-900 font-bold">{userName}</span> and all associated attendance records. This action cannot be undone.
                    </div>
                </DialogHeader>
                <DialogFooter className="mt-6 flex flex-col gap-3 sm:flex-col">
                    <Button
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="w-full h-12 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/20 order-1"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Delete Permanently
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="w-full h-12 rounded-lg font-bold bg-gray-50 hover:bg-gray-100 transition-all order-2"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
