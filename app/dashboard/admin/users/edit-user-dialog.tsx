'use client';

import { useState } from 'react';
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
import { Edit2 } from 'lucide-react';
import { updateUser } from './actions';
import { toast } from 'sonner';

interface EditUserDialogProps {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        salary: number;
        deduction_amount: number;
    };
}

export function EditUserDialog({ user }: EditUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [role, setRole] = useState(user.role);

    const action = async (formData: FormData) => {
        const res = await updateUser(user.id, formData);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success('User updated!');
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors duration-300">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Member Details</DialogTitle>
                </DialogHeader>
                <form action={action} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Full Name</Label>
                        <Input id="edit-name" name="name" defaultValue={user.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-email">Email Address</Label>
                        <Input id="edit-email" name="email" type="email" defaultValue={user.email} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-role">Role & Access</Label>
                        <Select name="role" defaultValue={user.role} onValueChange={setRole}>
                            <SelectTrigger id="edit-role">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Admin">Admin</SelectItem>
                                <SelectItem value="Employee">Employee</SelectItem>
                                <SelectItem value="Freelancer">Freelancer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {role === 'Employee' && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                                <Label htmlFor="edit-salary" className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Monthly Salary (₹)</Label>
                                <Input id="edit-salary" name="salary" type="number" defaultValue={user.salary} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-deduction" className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Per Absence (₹)</Label>
                                <Input id="edit-deduction" name="deduction_amount" type="number" defaultValue={user.deduction_amount} required />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="pt-4">
                        <Button type="submit" className="w-full font-bold uppercase tracking-widest text-[11px] h-11">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
