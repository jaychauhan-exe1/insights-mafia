import { createAdminClient } from '@/lib/supabase/server';
import { CreateClientDialog } from './create-client-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Briefcase, Eye, Trash2, IndianRupee, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { deleteClient } from './actions';
import { EditClientDialog } from './edit-client-dialog';

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const { page: pageParam } = await searchParams;
    const supabase = await createAdminClient();

    const page = parseInt(pageParam || '1');
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const { data: clients, count } = await supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .range(start, end);

    const totalPages = Math.ceil((count || 0) / pageSize);

    return (
        <div className="space-y-6 pb-24 lg:pb-0">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Client Workspace</h2>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Found {count || 0} Client Accounts</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <Link key={p} href={`/dashboard/admin/clients?page=${p}`}>
                                    <Button
                                        variant={page === p ? 'default' : 'outline'}
                                        size="sm"
                                        className={`rounded-lg h-8 w-8 p-0 font-bold transition-all duration-300 ${page === p ? 'bg-primary border-primary cursor-default' : 'hover:bg-muted border-border'}`}
                                    >
                                        {p}
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    )}
                    <CreateClientDialog />
                </div>
            </header>

            <Card className="border border-border/50 shadow-sm rounded-xl overflow-hidden bg-white">
                <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-border hover:bg-transparent h-12">
                                <TableHead className="px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest text-left">Client Name</TableHead>
                                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Business Type</TableHead>
                                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest text-left">Yield (Monthly)</TableHead>
                                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Contract</TableHead>
                                <TableHead className="text-right px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients?.map((client) => (
                                <TableRow key={client.id} className="border-border group h-20 hover:bg-muted/30 transition-all duration-300">
                                    <TableCell className="px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shadow-sm">
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-[13px] text-foreground leading-none">{client.name}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter mt-1">Verified Client</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-xs font-semibold text-muted-foreground">{client.business || '—'}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 font-bold text-[13px] text-emerald-600">
                                            <IndianRupee className="w-3 h-3" />
                                            {client.monthly_charges?.toLocaleString('en-IN') || '0'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {client.contract_link ? (
                                            <Link href={client.contract_link} target="_blank">
                                                <Button variant="ghost" size="sm" className="h-7 rounded-md text-primary hover:bg-primary/5 font-bold gap-1.5 text-[10px] uppercase tracking-wide border border-primary/10">
                                                    <LinkIcon className="w-3 h-3" />
                                                    Contract
                                                </Button>
                                            </Link>
                                        ) : (
                                            <span className="text-muted-foreground/30 text-[9px] font-bold uppercase tracking-widest">Missing</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex justify-end gap-1.5 items-center">
                                            <EditClientDialog client={client} />
                                            <Link href={`/dashboard/admin/clients/${client.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all duration-300">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <form action={async () => {
                                                'use server';
                                                await deleteClient(client.id);
                                            }}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all duration-300">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Grid View */}
                <div className="grid grid-cols-1 gap-4 md:hidden p-4">
                    {clients?.map((client) => (
                        <Card key={client.id} className="p-5 border-border/50 shadow-sm bg-white space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shadow-sm">
                                        <Briefcase className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[14px] text-foreground">{client.name}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{client.business || 'Client'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <EditClientDialog client={client} />
                                    <form action={async () => {
                                        'use server';
                                        await deleteClient(client.id);
                                    }}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
                                <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Monthly Yield</p>
                                    <div className="flex items-center gap-1 font-bold text-[13px] text-emerald-600">
                                        <IndianRupee className="w-3 h-3" />
                                        {client.monthly_charges?.toLocaleString('en-IN') || '0'}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Agreement</p>
                                    {client.contract_link ? (
                                        <Link href={client.contract_link} target="_blank" className="flex items-center gap-1.5 text-primary text-[11px] font-bold">
                                            <LinkIcon className="w-3 h-3" /> Contract
                                        </Link>
                                    ) : (
                                        <span className="text-muted-foreground/30 text-[10px] font-bold italic tracking-wider">None Found</span>
                                    )}
                                </div>
                            </div>

                            <div className="pt-1 flex justify-between items-center">
                                <Link href={`/dashboard/admin/clients/${client.id}`} className="flex-1">
                                    <Button variant="outline" className="w-full h-10 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] border-primary/10 hover:bg-primary/5 text-primary">
                                        View Full Account <Eye className="w-3.5 h-3.5 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>

                {(!clients || clients.length === 0) && (
                    <div className="text-center py-20 bg-white">
                        <div className="flex flex-col items-center">
                            <Briefcase className="w-10 h-10 text-muted-foreground/10 mb-2" />
                            <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">No clients detected.</p>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
