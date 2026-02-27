'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Link as LinkIcon, Send, Loader2 } from 'lucide-react';
import { submitTaskWithNote } from '../actions';
import { toast } from 'sonner';

export function SubmitTaskModal({ taskId, buttonText }: { taskId: string, buttonText: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [note, setNote] = useState('');
    const [links, setLinks] = useState<string[]>(['']);

    const addLinkField = () => {
        setLinks([...links, '']);
    };

    const removeLinkField = (index: number) => {
        const newLinks = [...links];
        newLinks.splice(index, 1);
        setLinks(newLinks);
    };

    const handleLinkChange = (index: number, value: string) => {
        const newLinks = [...links];
        newLinks[index] = value;
        setLinks(newLinks);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const filteredLinks = links.filter(l => l.trim() !== '');
            const res = await submitTaskWithNote(taskId, note, filteredLinks);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success('Task submitted successfully');
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
                <Button className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-8 rounded-lg transition-none shadow-lg shadow-primary/20">
                    {buttonText}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-xl border-none shadow-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-gray-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Send className="w-5 h-5" />
                        </div>
                        Submit Task
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Submission Note (Optional)</Label>
                        <Textarea
                            placeholder="Write a brief description of your work..."
                            className="min-h-[120px] rounded-lg bg-gray-50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 p-4 font-medium transition-none"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Reference Links</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={addLinkField}
                                className="h-7 px-2 rounded-lg text-primary font-bold text-[10px] uppercase hover:bg-primary/5 gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Link
                            </Button>
                        </div>

                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                            {links.map((link, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                                            <LinkIcon className="w-4 h-4" />
                                        </div>
                                        <Input
                                            placeholder="https://..."
                                            value={link}
                                            onChange={(e) => handleLinkChange(index, e.target.value)}
                                            className="h-11 pl-11 bg-gray-50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 font-medium transition-none"
                                        />
                                    </div>
                                    {links.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeLinkField(index)}
                                            className="h-11 w-11 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/20"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Submission'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
