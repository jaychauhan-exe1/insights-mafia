import { createAdminClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/get-profile';
import { CreateTaskDialog } from './create-task-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteTaskButton } from './delete-task-button';
import { ClipboardList, MessageSquare, CheckCircle2, IndianRupee, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ReviewTaskDialog } from './review-task-dialog';
import { EditTaskDialog } from './edit-task-dialog';
import { AdminStatusSelect } from './admin-status-select';
import { TaskFilters } from '@/components/dashboard/task-filters';
import Image from 'next/image';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ page?: string; year?: string; month?: string; day?: string; assignee?: string; status?: string }> }) {
    const { page: pageParam, year, month, day, assignee, status } = await searchParams;
    const profile = await getProfile();
    const supabase = await createAdminClient();

    if (!profile) return null;

    const page = parseInt(pageParam || '1');
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    // Build the query
    let query = supabase
        .from('tasks')
        .select(`
            *,
            assignee:profiles!tasks_assignee_id_fkey(*),
            client:clients(*)
          `, { count: 'exact' });

    if (profile.role !== 'Admin') {
        query = query.eq('assignee_id', profile.id);
    }

    // Apply Date Filters
    if (year) {
        const selectedYear = parseInt(year);
        if (month && month !== '0') {
            const selectedMonth = parseInt(month) - 1;
            if (day && day !== '0') {
                const selectedDay = parseInt(day);
                const startDate = new Date(selectedYear, selectedMonth, selectedDay).toISOString();
                const endDate = new Date(selectedYear, selectedMonth, selectedDay, 23, 59, 59).toISOString();
                query = query.gte('created_at', startDate).lte('created_at', endDate);
            } else {
                const startDate = startOfMonth(new Date(selectedYear, selectedMonth)).toISOString();
                const endDate = endOfMonth(new Date(selectedYear, selectedMonth)).toISOString();
                query = query.gte('created_at', startDate).lte('created_at', endDate);
            }
        } else {
            const startDate = startOfYear(new Date(selectedYear, 0)).toISOString();
            const endDate = endOfYear(new Date(selectedYear, 0)).toISOString();
            query = query.gte('created_at', startDate).lte('created_at', endDate);
        }
    }

    // Apply Assignee Filter
    if (assignee && assignee !== '0') {
        query = query.eq('assignee_id', assignee);
    }

    // Apply Status Filter
    if (status && status !== '0') {
        query = query.eq('status', status);
    }

    const { data: tasks, count } = await query
        .order('created_at', { ascending: false })
        .range(start, end);

    const totalPages = Math.ceil((count || 0) / pageSize);
    const usersRes = await supabase.from('profiles').select('*');
    const users = usersRes.data;

    const { data: clients } = await supabase.from('clients').select('*').order('name');

    return (
        <div className="space-y-6 pb-24 lg:pb-0">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Tasks</h2>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">{count || 0} Records Found</p>
                </div>
                {profile.role === 'Admin' && <CreateTaskDialog users={users || []} clients={clients || []} />}
            </header>

            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 pt-2">
                <TaskFilters users={users || []} />

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <Link key={p} href={`/dashboard/tasks?page=${p}`}>
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
            </div>

            {/* Table View - Desktop */}
            <Card className="hidden md:block border border-border/50 shadow-sm rounded-xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-border hover:bg-transparent h-12">
                                <TableHead className="px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Date</TableHead>
                                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Assignee</TableHead>
                                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Client</TableHead>
                                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest min-w-[200px]">Description</TableHead>
                                {profile.role !== 'Employee' && (
                                    <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Payout</TableHead>
                                )}
                                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Status</TableHead>
                                <TableHead className="text-right px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks?.map((task) => (
                                <TableRow key={task.id} className="border-border group h-20 hover:bg-muted/30 transition-all duration-300">
                                    <TableCell className="px-6">
                                        <div className="flex flex-col">
                                            <p className="font-bold text-[13px] text-foreground tabular-nums">
                                                {format(new Date(task.status === 'Completed' ? task.completed_at : task.created_at), 'MMM dd, yyyy')}
                                            </p>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">
                                                {task.status === 'Completed' ? 'Completed' : 'Created'}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 leading-none">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs border border-white shadow-sm overflow-hidden whitespace-nowrap">
                                                {task.assignee?.avatar_url ? (
                                                    <Image src={task.assignee.avatar_url} alt="" width={32} height={32} unoptimized />
                                                ) : (
                                                    task.assignee?.name?.charAt(0) || '?'
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[13px] text-foreground truncate max-w-[120px]">{task.assignee?.name || 'Unassigned'}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5 truncate">{task.assignee?.role || 'Team Member'}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {task.client ? (
                                            <div className="flex flex-col">
                                                {profile.role === 'Admin' ? (
                                                    <Link
                                                        href={`/dashboard/admin/clients/${task.client.id}`}
                                                        className="font-bold text-[12px] text-primary hover:underline transition-all"
                                                    >
                                                        {task.client.name}
                                                    </Link>
                                                ) : (
                                                    <p className="font-bold text-[12px] text-primary">{task.client.name}</p>
                                                )}
                                                {task.client.business && (
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{task.client.business}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-muted-foreground">—</p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/dashboard/tasks/${task.id}`} className="hover:text-primary transition-colors duration-300">
                                                    <p className="font-bold text-[13px] text-foreground leading-tight">{task.title}</p>
                                                </Link>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground line-clamp-1">{task.description}</p>
                                            {task.feedback && (
                                                <div className="flex items-center gap-1 text-orange-500 font-bold text-[9px] uppercase bg-orange-50 w-fit px-1.5 py-0.5 rounded-md mt-1 border border-orange-100">
                                                    <MessageSquare className="w-2.5 h-2.5" /> Revision Requested
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    {profile.role !== 'Employee' && (
                                        <TableCell>
                                            <p className="font-bold text-[13px] text-foreground tabular-nums">
                                                {task.payment_amount ? `₹${task.payment_amount.toLocaleString('en-IN')}` : '—'}
                                            </p>
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        {profile.role === 'Admin' ? (
                                            <div className="w-[140px]">
                                                <AdminStatusSelect taskId={task.id} currentStatus={task.status} />
                                            </div>
                                        ) : (
                                            <Badge className={`border font-bold text-[9px] rounded-md px-2.5 py-1 flex items-center gap-1 uppercase tracking-wider shadow-none hover:bg-opacity-80 transition-all ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                task.status === 'Review' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    task.status === 'Revision' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                                                }`}>
                                                {task.status}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex justify-end gap-1.5 items-center">
                                            <Link href={`/dashboard/tasks/${task.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all duration-300">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>

                                            {profile.role === 'Admin' && (
                                                <EditTaskDialog task={task} users={users || []} clients={clients || []} />
                                            )}

                                            {profile.role === 'Admin' && task.status === 'Review' && (
                                                <ReviewTaskDialog taskId={task.id} taskTitle={task.title} />
                                            )}

                                            {profile.role === 'Admin' && (
                                                <DeleteTaskButton taskId={task.id} taskTitle={task.title} size="icon" />
                                            )}

                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Card View - Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
                {tasks?.map((task) => (
                    <Card key={task.id} className="border border-border/50 shadow-sm rounded-xl p-5 bg-white space-y-4 hover:border-primary/20 transition-all duration-300">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-white shadow-sm overflow-hidden">
                                    {task.assignee?.avatar_url ? (
                                        <Image src={task.assignee.avatar_url} alt="" width={32} height={32} unoptimized />
                                    ) : (
                                        task.assignee?.name?.charAt(0) || '?'
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-[11px] font-bold text-foreground">{task.assignee?.name || 'Unassigned'}</p>
                                    {task.client && (
                                        profile.role === 'Admin' ? (
                                            <Link
                                                href={`/dashboard/admin/clients/${task.client.id}`}
                                                className="text-[9px] font-bold text-primary uppercase tracking-tighter hover:underline"
                                            >
                                                {task.client.name}
                                            </Link>
                                        ) : (
                                            <p className="text-[9px] font-bold text-primary uppercase tracking-tighter">{task.client.name}</p>
                                        )
                                    )}
                                </div>
                            </div>
                            {profile.role === 'Admin' ? (
                                <AdminStatusSelect taskId={task.id} currentStatus={task.status} />
                            ) : (
                                <Badge className={`border font-bold text-[9px] rounded-md px-2.5 py-1 flex items-center gap-1 uppercase tracking-wider shadow-none ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    task.status === 'Review' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                        task.status === 'Revision' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                                    }`}>
                                    {task.status}
                                </Badge>
                            )}
                        </div>

                        <div className="space-y-1">
                            <h4 className="font-bold text-sm text-foreground leading-tight">{task.title}</h4>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                            {profile.role !== 'Employee' ? (
                                <div className="flex items-center gap-1 text-primary font-bold text-[13px]">
                                    <IndianRupee className="w-3 h-3" />
                                    {task.payment_amount?.toLocaleString('en-IN') || '0'}
                                </div>
                            ) : (
                                <div />
                            )}
                            <div className="flex gap-2">
                                <Link href={`/dashboard/tasks/${task.id}`}>
                                    <Button size="sm" variant="ghost" className="h-8 px-3 rounded-lg font-bold text-primary hover:bg-primary/5 text-xs">
                                        View
                                    </Button>
                                </Link>
                                {profile.role === 'Admin' && (
                                    <EditTaskDialog task={task} users={users || []} clients={clients || []} />
                                )}
                                {profile.role === 'Admin' && (
                                    <DeleteTaskButton taskId={task.id} taskTitle={task.title} size="sm" />
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {(!tasks || tasks.length === 0) && (
                <div className="text-center py-16 bg-white rounded-xl border border-border shadow-sm">
                    <div className="flex flex-col items-center">
                        <ClipboardList className="w-10 h-10 text-muted-foreground/10 mb-2" />
                        <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">No matching records found.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
