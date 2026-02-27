'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Pencil, IndianRupee, ClipboardList, Plus } from 'lucide-react';
import { updateTask } from './actions';
import { toast } from 'sonner';
import { Profile } from '@/types/database';
import { SearchableClientSelect } from '@/components/searchable-client-select';

interface EditTaskDialogProps {
    task: any;
    users: Profile[];
    clients: any[];
}

export function EditTaskDialog({ task, users, clients }: EditTaskDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string>(task.assignee_id || '');
    const [isFreelancer, setIsFreelancer] = useState(false);
    const [links, setLinks] = useState<string[]>(task.reference_links?.length > 0 ? task.reference_links : ['']);
    const [clientId, setClientId] = useState<string>(task.client_id || '');

    useEffect(() => {
        if (selectedUser) {
            const user = users.find(u => u.id === selectedUser);
            setIsFreelancer(user?.role === 'Freelancer' || user?.role === 'Admin');
        }
    }, [selectedUser, users]);

    const handleUserChange = (userId: string) => {
        setSelectedUser(userId);
    };

    const action = async (formData: FormData) => {
        const res = await updateTask(task.id, formData);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success('Task updated!');
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all duration-300">
                    <Pencil className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-xl border-none shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        Edit Task
                    </DialogTitle>
                </DialogHeader>
                <form action={action} className="space-y-5 py-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="title" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Task Title</Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={task.title}
                                placeholder="Describe the task..."
                                required
                                className="h-12 bg-gray-50 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-primary/20 transition-none font-medium"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description (Optional)</Label>
                            <Input
                                id="description"
                                name="description"
                                defaultValue={task.description}
                                placeholder="Add more details..."
                                className="h-12 bg-gray-50 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-primary/20 transition-none font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="client" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Client</Label>
                            <input type="hidden" name="client_id" value={clientId} />
                            <SearchableClientSelect
                                clients={clients}
                                value={clientId}
                                onValueChange={setClientId}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deadline" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Deadline</Label>
                            <Input
                                id="deadline"
                                name="deadline"
                                type="datetime-local"
                                defaultValue={task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''}
                                className="h-12 bg-gray-50 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-primary/20 transition-none font-medium"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="assignee" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Team Member</Label>
                            <Select
                                name="assignee_id"
                                defaultValue={selectedUser}
                                onValueChange={handleUserChange}
                            >
                                <SelectTrigger className="bg-gray-50 border-none rounded-lg w-full py-6 focus:ring-1 focus:ring-primary/20 transition-none">
                                    <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-gray-100 shadow-xl">
                                    {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id} className="rounded-xl py-2.5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-gray-800">{user.name}</span>
                                                <span className="text-[10px] uppercase font-bold text-gray-400">{user.role}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {isFreelancer && (
                        <div className="space-y-2">
                            <Label htmlFor="payment_amount" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Payout Amount (Rupees)</Label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <IndianRupee className="w-4 h-4" />
                                </div>
                                <Input
                                    id="payment_amount"
                                    name="payment_amount"
                                    type="number"
                                    step="1"
                                    defaultValue={task.payment_amount || 0}
                                    placeholder="0"
                                    className="h-12 pl-10 bg-gray-50 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-primary/20 transition-none font-bold text-lg tabular-nums"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between px-1">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Reference Links</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setLinks([...links, ''])}
                                className="h-7 px-2 rounded-lg text-primary font-bold text-[10px] uppercase hover:bg-primary/5 gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Link
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {links.map((link, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        name="reference_links"
                                        placeholder="https://google.drive/..."
                                        value={link}
                                        onChange={(e) => {
                                            const newLinks = [...links];
                                            newLinks[index] = e.target.value;
                                            setLinks(newLinks);
                                        }}
                                        className="h-11 bg-gray-50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 font-medium transition-none"
                                    />
                                    {links.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                const newLinks = [...links];
                                                newLinks.splice(index, 1);
                                                setLinks(newLinks);
                                            }}
                                            className="h-11 w-11 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50"
                                        >
                                            <Plus className="w-4 h-4 rotate-45" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="submit" className="w-full rounded-lg h-12 font-bold bg-primary hover:bg-primary/90 text-white transition-none shadow-lg shadow-primary/20">
                            Update Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
