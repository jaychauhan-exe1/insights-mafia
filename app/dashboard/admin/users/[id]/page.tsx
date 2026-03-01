
import { createAdminClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/get-profile';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Mail, Briefcase, Calendar, Clock, DollarSign, Wallet, FileText, CheckCircle2, Plane } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatIST, formatISTTime } from '@/lib/date-utils';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: userId } = await params;
    const admin = await getProfile();
    const supabase = await createAdminClient();

    if (!admin || admin.role !== 'Admin') {
        redirect('/dashboard');
    }

    // Fetch user profile
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (userError || !user) {
        notFound();
    }

    // Fetch tasks
    const { data: tasks } = await supabase
        .from('tasks')
        .select(`
            *,
            client:clients(name)
        `)
        .eq('assignee_id', userId)
        .order('created_at', { ascending: false });

    // Fetch leaves
    const { data: leaves } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    // Fetch attendance
    const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'Completed').length || 0;
    const pendingTasks = tasks?.filter(t => t.status === 'Pending').length || 0;

    // Calculate absences (days between onboarding and now where no attendance record exists, excluding weekends)
    // For simplicity, let's just count 'Absent' marked records in history
    const confirmedAbsences = attendance?.filter(a => a.status === 'Absent').length || 0;
    const approvedLeaves = leaves?.filter(l => l.status === 'Approved').length || 0;

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col gap-4">
                <Link href="/dashboard/admin/users">
                    <Button variant="ghost" size="sm" className="w-fit text-muted-foreground hover:text-foreground p-0 h-auto gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Back to Team</span>
                    </Button>
                </Link>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground font-bold text-2xl border-4 border-white shadow-xl overflow-hidden shadow-primary/5">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                user.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black tracking-tighter text-foreground">{user.name}</h2>
                                <Badge className={`rounded-md uppercase text-[10px] font-bold px-2 py-0.5 ${user.role === 'Admin' ? 'bg-primary/10 text-primary border-primary/20' :
                                    user.role === 'Employee' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' :
                                        'bg-orange-50 text-orange-500 border-orange-100'
                                    }`}>
                                    {user.role}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Mail className="w-3.5 h-3.5 opacity-40" />
                                    <span className="text-sm font-medium">{user.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Today's Status Alert */}
                {(user.role === 'Employee' || user.role === 'Freelancer') && (
                    <Card className="border-none shadow-sm bg-amber-50/30 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <Clock className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest leading-none mb-1">Live Attendance Status</p>
                                    <p className="text-sm font-bold text-amber-900">
                                        {attendance?.[0]?.date === formatIST(new Date()).split(',')[0] ? (
                                            attendance[0].check_out ? "Shift Completed for today" : "Currently on Duty"
                                        ) : "Shift not started yet"}
                                    </p>
                                </div>
                            </div>
                            {attendance?.[0] && !attendance[0].check_out && attendance[0].date < formatIST(new Date()).split(',')[0] && (
                                <Badge className="bg-red-500 text-white border-none animate-pulse">MISSED CHECKOUT</Badge>
                            )}
                        </CardContent>
                    </Card>
                )}
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-indigo-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-1">Financials</p>
                                <h3 className="text-2xl font-black text-indigo-900 leading-none">
                                    {user.role === 'Freelancer' ? (
                                        `₹${user.wallet_balance || 0}`
                                    ) : (
                                        `₹${user.salary || 0}/m`
                                    )}
                                </h3>
                            </div>
                            <div className="p-2 bg-white rounded-lg shadow-sm border border-indigo-100">
                                {user.role === 'Freelancer' ? <Wallet className="w-4 h-4 text-indigo-400" /> : <DollarSign className="w-4 h-4 text-indigo-400" />}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-emerald-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.15em] mb-1">Task Completion</p>
                                <h3 className="text-2xl font-black text-emerald-900 leading-none">{completedTasks}<span className="text-emerald-300 text-lg">/{totalTasks}</span></h3>
                            </div>
                            <div className="p-2 bg-white rounded-lg shadow-sm border border-emerald-100">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.15em] mb-1">Leaves Taken</p>
                                <h3 className="text-2xl font-black text-blue-900 leading-none">{approvedLeaves}<span className="text-blue-300 text-lg"> Apprv.</span></h3>
                            </div>
                            <div className="p-2 bg-white rounded-lg shadow-sm border border-blue-100">
                                <Plane className="w-4 h-4 text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-red-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-[0.15em] mb-1">Confirmed Absences</p>
                                <h3 className="text-2xl font-black text-red-900 leading-none">{confirmedAbsences}</h3>
                            </div>
                            <div className="p-2 bg-white rounded-lg shadow-sm border border-red-100">
                                <Clock className="w-4 h-4 text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Active/Assigned Tasks */}
                    <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-muted/30 px-6 py-4 flex flex-row items-center justify-between border-b border-border/50">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Assigned Tasks
                            </CardTitle>
                            <Badge variant="outline" className="rounded-md font-bold text-[10px]">{totalTasks} Total</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/20">
                                    <TableRow className="hover:bg-transparent border-border">
                                        <TableHead className="px-6 text-[10px] font-black uppercase tracking-widest h-10">Task Details</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest h-10">Client</TableHead>
                                        <TableHead className="text-right px-6 text-[10px] font-black uppercase tracking-widest h-10">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks && tasks.length > 0 ? tasks.map(task => (
                                        <TableRow key={task.id} className="border-border hover:bg-muted/30 h-16 transition-colors">
                                            <TableCell className="px-6">
                                                <p className="font-bold text-[13px] leading-tight text-foreground">{task.title}</p>
                                                <p className="text-[10px] text-muted-foreground/60 font-medium mt-1">Assigned {new Date(task.assigned_at || task.created_at).toLocaleDateString()}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none text-[10px] px-2 font-bold uppercase tracking-tight">
                                                    {(task.client as any)?.name || 'Internal'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <Badge className={`uppercase text-[9px] font-bold border-none ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-500' :
                                                    task.status === 'Review' ? 'bg-amber-50 text-amber-500' :
                                                        task.status === 'Revision' ? 'bg-purple-50 text-purple-500' :
                                                            'bg-blue-50 text-blue-500'
                                                    }`}>
                                                    {task.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-32 text-center text-muted-foreground/30 text-[10px] font-black uppercase tracking-widest italic">
                                                No tasks found for this user 📦
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Attendance History */}
                    <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-muted/30 px-6 py-4 border-b border-border/50">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Attendance Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/20">
                                    <TableRow className="hover:bg-transparent border-border">
                                        <TableHead className="px-6 text-[10px] font-black uppercase tracking-widest h-10">Date</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest h-10">Session Info</TableHead>
                                        <TableHead className="text-right px-6 text-[10px] font-black uppercase tracking-widest h-10">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendance && attendance.length > 0 ? attendance.map(entry => (
                                        <TableRow key={entry.id} className="border-border hover:bg-muted/30 h-16 transition-colors">
                                            <TableCell className="px-6">
                                                <p className="font-bold text-[13px] leading-tight text-foreground">{new Date(entry.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', weekday: 'short' })}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground tabular-nums">
                                                        <span>{formatISTTime(entry.check_in)}</span>
                                                        <span className="opacity-20">—</span>
                                                        <span>{formatISTTime(entry.check_out) || 'Active'}</span>
                                                    </div>
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground/30 tracking-widest">{entry.check_in_workplace || 'Office'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <Badge className={`uppercase text-[9px] font-bold border-none ${entry.status === 'Present' ? 'bg-emerald-50 text-emerald-500' :
                                                    entry.status === 'Absent' ? 'bg-red-50 text-red-500' :
                                                        entry.status === 'Half Day' ? 'bg-amber-50 text-amber-500' :
                                                            'bg-blue-50 text-blue-500'
                                                    }`}>
                                                    {entry.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-32 text-center text-muted-foreground/30 text-[10px] font-black uppercase tracking-widest italic">
                                                No attendance records 📅
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar area */}
                <div className="space-y-8">
                    {/* User Profile Info Card */}
                    <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="bg-primary px-6 py-4">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Profile Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Base Salary</p>
                                <p className="text-sm font-black text-foreground">₹{user.salary?.toLocaleString() || 0} / month</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Late Deduction</p>
                                <p className="text-sm font-black text-red-500">₹{user.deduction_amount || 0} / incident</p>
                            </div>
                            <div className="pt-4 border-t border-dashed border-border flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Paid Leaves</p>
                                    <p className="text-sm font-black text-emerald-600">{user.paid_leaves || 1} Remaining</p>
                                </div>
                                <Plane className="w-8 h-8 text-primary/10 -rotate-12" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Leave History */}
                    <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-muted/30 px-6 py-4 border-b border-border/50">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Plane className="w-4 h-4" /> Leave History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {leaves && leaves.length > 0 ? (
                                <div className="divide-y divide-border/50">
                                    {leaves.map(leave => (
                                        <div key={leave.id} className="p-4 hover:bg-muted/10 transition-colors">
                                            <div className="flex justify-between items-start mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-[12px]">{new Date(leave.date).toLocaleDateString()}</p>
                                                    {leave.is_paid_leave && (
                                                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-bold uppercase py-0 h-4">Paid</Badge>
                                                    )}
                                                </div>
                                                <Badge className={`uppercase text-[8px] font-bold border-none px-1 h-4 ${leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-500' :
                                                    leave.status === 'Rejected' ? 'bg-red-50 text-red-500' :
                                                        'bg-amber-50 text-amber-500'
                                                    }`}>
                                                    {leave.status}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                                                {leave.reason}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center text-muted-foreground/30 text-[10px] font-black uppercase tracking-widest italic">
                                    No leaves requested
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
