import { createAdminClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/get-profile';
import { format } from 'date-fns';
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
import { Card } from '@/components/ui/card';
import { ReviewTaskDialog } from '@/app/dashboard/tasks/review-task-dialog';
import { approveLeaveRequest, rejectLeaveRequest } from './actions';
import { ApprovalActions } from './approval-actions';

export default async function ApprovalsPage() {
    const profile = await getProfile();
    const supabase = await createAdminClient();

    if (!profile || profile.role !== 'Admin') return null;

    const { data: tasks } = await supabase
        .from('tasks')
        .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(*)
    `)
        .eq('status', 'Review')
        .order('created_at', { ascending: false });

    const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select(`
            *,
            user:profiles(*)
        `)
        .eq('status', 'Pending')
        .order('date', { ascending: true });

    return (
        <div className="space-y-12 pb-20 lg:pb-0">
            {/* Task Approvals */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Task Reviews</h2>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Review and approve tasks marked as ready</p>
                </div>

                <div className="hidden md:block">
                    <Card className="border border-border/50 shadow-sm rounded-xl overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="border-border hover:bg-transparent h-12">
                                        <TableHead className="px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Task Detail</TableHead>
                                        <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Assignee</TableHead>
                                        <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest text-center">Payout</TableHead>
                                        <TableHead className="text-right px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks?.map((task) => (
                                        <TableRow key={task.id} className="border-border group h-20 hover:bg-muted/30 transition-all duration-300">
                                            <TableCell className="px-6">
                                                <p className="font-bold text-[13px] text-foreground leading-none">{task.title}</p>
                                                <p className="text-[10px] font-medium text-muted-foreground truncate max-w-[300px] mt-1.5">{task.description}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-muted-foreground text-[10px]">
                                                        {task.assignee?.avatar_url ? (
                                                            <img src={task.assignee.avatar_url} className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            task.assignee?.name?.charAt(0) || '?'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[12px] text-foreground leading-none">{task.assignee?.name}</p>
                                                        <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter mt-1">{task.assignee?.role}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className="bg-primary/5 text-primary border-primary/10 text-[10px] font-bold h-6 px-2.5 shadow-none">
                                                    ₹{task.payment_amount?.toLocaleString('en-IN') || '0'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <ReviewTaskDialog taskId={task.id} taskTitle={task.title} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!tasks || tasks.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-20">
                                                <p className="text-muted-foreground/30 font-bold text-[10px] uppercase tracking-widest italic leading-none">No pending task reviews ✨</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>

                {/* Mobile View for Task Reviews */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {tasks?.map((task) => (
                        <Card key={task.id} className="p-5 border-border/50 shadow-sm bg-white space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="font-bold text-[14px] text-foreground leading-tight">{task.title}</p>
                                    <Badge className="bg-primary/5 text-primary border-none text-[8px] font-bold h-4 px-1.5 uppercase tracking-widest">
                                        ₹{task.payment_amount?.toLocaleString('en-IN') || '0'} Payout
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 py-3 border-y border-border/50">
                                <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-[8px] overflow-hidden">
                                    {task.assignee?.avatar_url ? (
                                        <img src={task.assignee.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        task.assignee?.name?.charAt(0) || '?'
                                    )}
                                </div>
                                <p className="text-[11px] font-bold text-muted-foreground">Assigned to <span className="text-foreground">{task.assignee?.name}</span></p>
                            </div>
                            <ReviewTaskDialog taskId={task.id} taskTitle={task.title} className="w-full" />
                        </Card>
                    ))}
                    {(!tasks || tasks.length === 0) && (
                        <div className="py-10 text-center border-2 border-dashed border-border/50 rounded-lg">
                            <p className="text-muted-foreground/30 font-bold text-[10px] uppercase tracking-widest italic">No pending tasks ✨</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Leave Approvals */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Leave Requests</h2>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Review absence requests from the team</p>
                </div>

                <div className="hidden md:block">
                    <Card className="border border-border/50 shadow-sm rounded-xl overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="border-border hover:bg-transparent h-12">
                                        <TableHead className="px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Employee</TableHead>
                                        <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Date & Reason</TableHead>
                                        <TableHead className="text-right px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaveRequests?.map((request) => (
                                        <TableRow key={request.id} className="border-border group h-20 hover:bg-muted/30 transition-all duration-300">
                                            <TableCell className="px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-muted-foreground text-[10px]">
                                                        {request.user?.avatar_url ? (
                                                            <img src={request.user.avatar_url} className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            request.user?.name?.charAt(0) || '?'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[12px] text-foreground leading-none">{request.user?.name}</p>
                                                        <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter mt-1">{request.user?.role}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-[13px] text-foreground leading-none">{format(new Date(request.date), 'MMMM dd, yyyy')}</p>
                                                        {request.will_work_sunday && (
                                                            <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] font-bold uppercase py-0 h-4 shadow-none">Promise Sunday</Badge>
                                                        )}
                                                        {request.is_paid_leave && (
                                                            <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-bold uppercase py-0 h-4 shadow-none">Paid Leave</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-medium text-muted-foreground truncate max-w-[300px] leading-relaxed">{request.reason}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <ApprovalActions
                                                    requestId={request.id}
                                                    hasPaidBalance={parseFloat(String(request.user?.paid_leaves || '0')) >= 1}
                                                    requestedAsPaid={request.is_paid_leave}
                                                    paidLeavesLeft={parseFloat(String(request.user?.paid_leaves || '0'))}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!leaveRequests || leaveRequests.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-20">
                                                <p className="text-muted-foreground/30 font-bold text-[10px] uppercase tracking-widest italic leading-none">No pending leave requests 🌴</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>

                {/* Mobile View for Leave Requests */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {leaveRequests?.map((request) => (
                        <Card key={request.id} className="p-5 border-border/50 shadow-sm bg-white space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-muted-foreground text-[10px] overflow-hidden">
                                    {request.user?.avatar_url ? (
                                        <img src={request.user.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        request.user?.name?.charAt(0) || '?'
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-[14px] text-foreground leading-none">{request.user?.name}</p>
                                    <p className="text-[11px] font-bold text-primary mt-1.5">{format(new Date(request.date), 'MMM dd, yyyy')}</p>
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                    {request.will_work_sunday && (
                                        <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] font-bold uppercase py-1 h-fit">Promise Sun</Badge>
                                    )}
                                    {request.is_paid_leave && (
                                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-bold uppercase py-1 h-fit">Paid Leave</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-xl">
                                <p className="text-[11px] text-muted-foreground italic leading-relaxed">"{request.reason}"</p>
                            </div>
                            <div className="pt-2">
                                <ApprovalActions
                                    requestId={request.id}
                                    hasPaidBalance={parseFloat(String(request.user?.paid_leaves || '0')) >= 1}
                                    requestedAsPaid={request.is_paid_leave}
                                    paidLeavesLeft={parseFloat(String(request.user?.paid_leaves || '0'))}
                                />
                            </div>
                        </Card>
                    ))}
                    {(!leaveRequests || leaveRequests.length === 0) && (
                        <div className="py-10 text-center border-2 border-dashed border-border/50 rounded-lg">
                            <p className="text-muted-foreground/30 font-bold text-[10px] uppercase tracking-widest italic">No leave requests 🌴</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
