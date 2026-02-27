'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Pencil, Loader2 } from 'lucide-react';
import { updateClient } from './actions';
import { toast } from 'sonner';

const clientSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    business: z.string().optional().or(z.literal('')),
    contract_link: z.string().optional().or(z.literal('')),
    monthly_charges: z.coerce.number().min(0).optional().default(0),
});

interface EditClientDialogProps {
    client: {
        id: string;
        name: string;
        business?: string;
        contract_link?: string;
        monthly_charges?: number;
    }
}

export function EditClientDialog({ client }: EditClientDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<any>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: client.name,
            business: client.business || '',
            contract_link: client.contract_link || '',
            monthly_charges: client.monthly_charges || 0,
        },
    });

    async function onSubmit(data: any) {
        setIsLoading(true);
        try {
            const res = await updateClient(client.id, {
                name: data.name,
                business: data.business || undefined,
                contract_link: data.contract_link || undefined,
                monthly_charges: Number(data.monthly_charges) || 0,
            });
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success('Client updated successfully');
                setOpen(false);
            }
        } catch (error) {
            toast.error('Failed to update client');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors">
                    <Pencil className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-xl border-none p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-gray-800">Edit Client</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold text-gray-400 uppercase tracking-widest">Client Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Corp" className="h-12 rounded-md bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="business"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold text-gray-400 uppercase tracking-widest">Business Type</FormLabel>
                                    <FormControl>
                                        <Input placeholder="E-commerce" className="h-12 rounded-md bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contract_link"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contract Link (URL)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://..." className="h-12 rounded-md bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="monthly_charges"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold text-gray-400 uppercase tracking-widest">Monthly Charges (₹)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="50000" className="h-12 rounded-md bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-md bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/20">
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Saves Changes'}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
