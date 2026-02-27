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
import { PlusCircle } from 'lucide-react';
import { createUser } from './actions';
import { toast } from 'sonner';

export function CreateUserDialog() {
    const [open, setOpen] = useState(false);
    const [role, setRole] = useState('Employee');

    const action = async (formData: FormData) => {
        const res = await createUser(formData);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success('User created!');
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 shadow-lg shadow-primary/20">
                    <PlusCircle className="h-4 w-4" /> Add Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Member</DialogTitle>
                </DialogHeader>
                <form action={action} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" placeholder="John Doe" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Temporary Password</Label>
                        <Input id="password" name="password" type="password" required minLength={6} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select name="role" defaultValue="Employee" onValueChange={setRole}>
                            <SelectTrigger>
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
                                <Label htmlFor="salary font-bold text-xs uppercase tracking-widest text-muted-foreground">Monthly Salary (₹)</Label>
                                <Input id="salary" name="salary" type="number" placeholder="0" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deduction_amount font-bold text-xs uppercase tracking-widest text-muted-foreground">Per Absence (₹)</Label>
                                <Input id="deduction_amount" name="deduction_amount" type="number" placeholder="0" required />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="submit" className="w-full">Create User</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
