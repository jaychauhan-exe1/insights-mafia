import { createAdminClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/get-profile';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreateUserDialog } from './create-user-dialog';
import { EditUserDialog } from './edit-user-dialog';
import { DeleteUserButton } from './delete-user-button';
import { Mail, Shield, Calendar, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const { page: pageParam } = await searchParams;
    const profile = await getProfile();
    const supabase = await createAdminClient();

    if (!profile || profile.role !== 'Admin') return null;

    const page = parseInt(pageParam || '1');
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const { data: users, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end);

    const totalPages = Math.ceil((count || 0) / pageSize);

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Team</h2>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Members: {count || 0}</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5 mr-4">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <Link key={p} href={`/dashboard/admin/users?page=${p}`}>
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
                    <CreateUserDialog />
                </div>
            </header>

            <Card className="border border-border/50 shadow-sm rounded-xl overflow-hidden bg-white">
                <div className="hidden md:block">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-border hover:bg-transparent h-12">
                                <TableHead className="px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Team Member</TableHead>
                                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Role</TableHead>
                                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Email Address</TableHead>
                                <TableHead className="text-right px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Onboarded</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map((u) => (
                                <TableRow key={u.id} className="border-border group h-20 hover:bg-muted/30 transition-all duration-300">
                                    <TableCell className="px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs border border-white shadow-sm overflow-hidden whitespace-nowrap">
                                                {u.avatar_url ? (
                                                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    u.name.charAt(0)
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[13px] text-foreground leading-none">{u.name}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${u.role === 'Admin' ? 'bg-primary shadow-[0_0_8px_rgba(129,0,209,0.4)]' :
                                                u.role === 'Employee' ? 'bg-indigo-500' : 'bg-orange-400'
                                                }`} />
                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">{u.role}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-[12px] font-bold text-muted-foreground/60">
                                            <Mail className="w-3.5 h-3.5 opacity-40 shrink-0" />
                                            <span className="truncate max-w-[150px]">{u.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <p className="text-[12px] font-bold text-foreground">
                                            {new Date(u.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        <div className="flex items-center justify-end gap-2 mt-0.5">
                                            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tighter leading-none">Record Active</p>
                                            <div className="flex items-center gap-1">
                                                <EditUserDialog user={u} />
                                                <DeleteUserButton userId={u.id} userName={u.name} />
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Grid View */}
                <div className="grid grid-cols-1 gap-4 md:hidden p-4">
                    {users?.map((u) => (
                        <Card key={u.id} className="p-5 border-border/50 shadow-sm bg-white space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-muted border border-white flex items-center justify-center font-bold text-[12px] overflow-hidden">
                                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : u.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[14px] text-foreground leading-none">{u.name}</p>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${u.role === 'Admin' ? 'bg-primary' :
                                                u.role === 'Employee' ? 'bg-indigo-500' : 'bg-orange-400'
                                                }`} />
                                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight italic">{u.role}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <EditUserDialog user={u} />
                                    <DeleteUserButton userId={u.id} userName={u.name} />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-border/50 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/60">
                                    <Mail className="w-3.5 h-3.5 opacity-40 shrink-0" />
                                    <span className="truncate">{u.email}</span>
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                    Joined {new Date(u.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </Card>
                    ))}
                    {(!users || users.length === 0) && (
                        <div className="py-10 text-center border-2 border-dashed border-border/50 rounded-lg">
                            <p className="text-muted-foreground/30 font-bold text-[10px] uppercase tracking-widest italic">No members found 📭</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
