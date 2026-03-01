'use client';

import { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
import { deleteClient } from './actions';
import { toast } from 'sonner';

interface DeleteClientButtonProps {
    clientId: string;
    clientName: string;
}

export function DeleteClientButton({ clientId, clientName }: DeleteClientButtonProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            await deleteClient(clientId);
            toast.success(`Client "${clientName}" deleted successfully`);
            setOpen(false);
        } catch {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all duration-300"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl border-none shadow-2xl p-8 max-w-[400px]">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-500 mb-4 mx-auto">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-gray-800 text-center">
                        Remove Client?
                    </DialogTitle>
                    <div className="text-gray-500 font-medium text-center text-sm pt-2">
                        This will permanently remove{' '}
                        <span className="text-gray-900 font-bold">{clientName}</span>{' '}
                        and all associated tasks and visit history. This action cannot be undone.
                    </div>
                </DialogHeader>
                <DialogFooter className="mt-6 flex flex-col gap-3 sm:flex-col">
                    <Button
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="w-full h-12 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/20 order-1"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Delete Permanently
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                        className="w-full h-12 rounded-lg font-bold bg-gray-50 hover:bg-gray-100 transition-all order-2"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
