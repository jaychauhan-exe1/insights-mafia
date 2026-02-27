import { getProfile } from '@/lib/supabase/get-profile';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ClipboardList, Clock, Wallet, ChevronRight, Play, Calendar as CalendarIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { calculateSalary } from '@/lib/salary-utils';

export default async function DashboardPage() {
    const profile = await getProfile();
    const supabase = await createAdminClient();

    if (!profile) return null;
    const now = new Date();

    // Fetch necessary data
    const [
        tasksRes,
        statsRes,
        attendanceRes,
        recentTasksRes,
        adminActivityRes,
        clientsRes,
        allEmployeesRes,
        allAttendanceRes,
        leaveRequestsRes,
        firstAttendancesRes
    ] = await Promise.all([
        supabase.from('tasks').select('*', { count: 'exact', head: true })
            .eq('assignee_id', profile.id)
            .eq('status', 'Pending'),

        profile.role === 'Admin'
            ? Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('tasks').select('*', { count: 'exact', head: true }).neq('status', 'Completed'),
                supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'Review')
            ])
            : Promise.all([
                supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assignee_id', profile.id),
                supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assignee_id', profile.id).eq('status', 'Completed'),
                supabase.from('tasks').select('completed_at').eq('assignee_id', profile.id).not('completed_at', 'is', null)
            ]),

        supabase.from('attendance').select('date, status').eq('user_id', profile.id),

        profile.role === 'Admin'
            ? supabase.from('tasks').select('*, assignee:profiles!tasks_assignee_id_fkey(name, avatar_url)')
                .order('created_at', { ascending: false })
                .limit(3)
            : supabase.from('tasks').select('*, assignee:profiles!tasks_assignee_id_fkey(name, avatar_url)')
                .eq('assignee_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(3),

        profile.role === 'Admin'
            ? Promise.all([
                supabase.from('tasks').select('created_at').eq('created_by', profile.id),
                supabase.from('clients').select('created_at'),
                supabase.from('tasks').select('completed_at').not('completed_at', 'is', null)
            ])
            : Promise.resolve(null),

        profile.role === 'Admin' ? supabase.from('clients').select('monthly_charges') : Promise.resolve({ data: [] }),
        profile.role === 'Admin' ? supabase.from('profiles').select('*').eq('role', 'Employee') : Promise.resolve({ data: [] }),
        profile.role === 'Admin'
            ? supabase.from('attendance')
                .select('user_id, date, status')
                .gte('date', startOfMonth(now).toISOString().split('T')[0])
            : Promise.resolve({ data: [] }),

        profile.role === 'Admin'
            ? supabase.from('leave_requests').select('*')
                .gte('date', startOfMonth(now).toISOString().split('T')[0])
            : supabase.from('leave_requests').select('*')
                .eq('user_id', profile.id)
                .gte('date', startOfMonth(now).toISOString().split('T')[0]),

        profile.role === 'Admin'
            ? supabase.from('attendance').select('user_id, date').order('date', { ascending: true })
            : supabase.from('attendance').select('date').eq('user_id', profile.id).order('date', { ascending: true }).limit(1)
    ]);

    const newTasksCount = tasksRes?.count || 0;
    const leaveRequests = leaveRequestsRes?.data || [];
    const firstAttendances = firstAttendancesRes?.data || [];
    const attendanceDays = attendanceRes?.data?.map((d: any) => d.date) || [];
    const todayStr = format(now, 'yyyy-MM-dd');
    const isCheckedInToday = attendanceDays.includes(todayStr);

    let activityDates: string[] = [...attendanceDays];
    if (profile.role === 'Admin' && adminActivityRes) {
        const [createdTasks, createdClients, approvedTasks] = adminActivityRes as any;
        createdTasks.data?.forEach((t: any) => activityDates.push(format(new Date(t.created_at), 'yyyy-MM-dd')));
        createdClients.data?.forEach((c: any) => activityDates.push(format(new Date(c.created_at), 'yyyy-MM-dd')));
        approvedTasks.data?.forEach((t: any) => activityDates.push(format(new Date(t.completed_at), 'yyyy-MM-dd')));
    } else {
        const taskActivity = (statsRes as any)[2]?.data?.map((d: any) => format(new Date(d.completed_at), 'yyyy-MM-dd')) || [];
        activityDates = [...activityDates, ...taskActivity];
    }

    const workDays = Array.from(new Set(activityDates));
    const recentTasks = recentTasksRes?.data || [];
    let statsList: any[] = [];

    if (profile.role === 'Admin') {
        const totalEarnings = (clientsRes?.data || []).reduce((acc: number, c: any) => acc + Number(c.monthly_charges || 0), 0);
        const employees = allEmployeesRes?.data || [];
        const attendance = allAttendanceRes?.data || [];
        const totalSalary = employees.reduce((acc: number, emp: any) => {
            const empAttendance = attendance.filter((a: any) => a.user_id === emp.id);
            const joiningDate = firstAttendances.find((a: any) => a.user_id === emp.id)?.date;
            const calc = calculateSalary(Number(emp.salary || 0), Number(emp.deduction_amount || 0), empAttendance, [], joiningDate);
            return acc + calc.finalSalary;
        }, 0);

        statsList = [
            { label: 'Total team', value: (statsRes as any)[0].count || 0, icon: Users, href: '/dashboard/admin/users', color: 'bg-indigo-500' },
            { label: 'Total Earnings', value: `₹${totalEarnings.toLocaleString('en-IN')}`, icon: Wallet, href: '/dashboard/admin/clients', color: 'bg-emerald-500' },
            { label: 'Total Salary', value: `₹${totalSalary.toLocaleString('en-IN')}`, icon: Clock, href: '/dashboard/admin/payments', color: 'bg-orange-500' },
        ];
    } else {
        if (profile.role === 'Freelancer') {
            statsList = [
                { label: 'My Tasks', value: (statsRes as any)[0].count || 0, icon: ClipboardList, href: '/dashboard/tasks', color: 'bg-indigo-500' },
                { label: 'Finished', value: (statsRes as any)[1].count || 0, icon: CheckCircle2, href: '/dashboard/tasks', color: 'bg-emerald-500' },
                { label: 'Earnings', value: `₹${Number(profile.wallet_balance || 0).toLocaleString('en-IN')}`, icon: Wallet, href: '/dashboard/freelancer/wallet', color: 'bg-indigo-600' },
            ];
        } else {
            const myAttendance = (attendanceRes?.data || []) as any[];
            const joiningDate = firstAttendances[0]?.date;
            const myCalc = calculateSalary(Number(profile.salary || 0), Number(profile.deduction_amount || 0), myAttendance, leaveRequests, joiningDate);
            statsList = [
                { label: 'My Tasks', value: (statsRes as any)[0].count || 0, icon: ClipboardList, href: '/dashboard/tasks', color: 'bg-indigo-500' },
                { label: 'Month Payout', value: `₹${myCalc.finalSalary.toLocaleString('en-IN')}`, icon: Wallet, href: '/dashboard/employee/attendance', color: 'bg-emerald-500' },
                { label: 'Finished', value: (statsRes as any)[1].count || 0, icon: CheckCircle2, href: '/dashboard/tasks', color: 'bg-orange-500' },
            ];
        }
    }

    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const avatarUrl = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`;

    return (
        <div className="flex flex-col xl:flex-row gap-8">
            <div className="flex-1 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {statsList.map((stat) => (
                        <Link key={stat.label} href={stat.href}>
                            <Card className="border border-border/50 shadow-sm rounded-xl p-6 bg-white hover:border-primary/20 hover:shadow-md transition-all duration-300 cursor-pointer group h-full">
                                <div className="space-y-4">
                                    <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                        <h3 className="font-bold text-2xl text-foreground tabular-nums">{stat.value}</h3>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="space-y-4">
                    {profile.role === 'Employee' && !isCheckedInToday && (
                        <div className="bg-red-50 border border-red-100 shadow-sm rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-red-900">Attendance Reminder</h3>
                                    <p className="text-sm text-red-700 font-medium">You haven't checked in for today yet. Please record your attendance.</p>
                                </div>
                            </div>
                            <Button asChild className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold px-6">
                                <Link href="/dashboard/employee/attendance">Check In Now</Link>
                            </Button>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-foreground">Active Tasks</h2>
                        <Button variant="ghost" asChild className="text-primary font-bold text-xs h-9 hover:bg-primary/5 rounded-lg px-4">
                            <Link href="/dashboard/tasks">View All</Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentTasks.map((task: any) => (
                            <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
                                <Card className="border border-border/50 shadow-sm rounded-xl overflow-hidden bg-white p-5 space-y-4 hover:border-primary/20 hover:shadow-md transition-all duration-300 cursor-pointer h-full">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                            task.status === 'Review' ? 'bg-indigo-50 text-indigo-600' :
                                                task.status === 'Revision' ? 'bg-orange-50 text-orange-600' : 'bg-muted text-muted-foreground'
                                            }`}>
                                            {task.status}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-muted-foreground font-bold text-[10px]">
                                            <CalendarIcon className="w-3 h-3" />
                                            {format(new Date(task.created_at), 'MMM dd')}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm leading-tight text-foreground line-clamp-2">{task.title}</h4>
                                        <p className="text-xs text-muted-foreground line-clamp-1 font-medium">{task.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2.5 pt-3 border-t border-border/50">
                                        <div className="w-6 h-6 rounded-full bg-muted overflow-hidden text-[10px] flex items-center justify-center font-bold text-muted-foreground border border-white">
                                            {task.assignee?.avatar_url ? <Image src={task.assignee.avatar_url} alt="" width={24} height={24} unoptimized /> : task.assignee?.name?.charAt(0) || '?'}
                                        </div>
                                        <span className="text-[10px] font-bold text-foreground truncate uppercase tracking-tight">{task.assignee?.name || 'Unassigned'}</span>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-full xl:w-[320px] shrink-0 space-y-6">
                <Card className="border border-border/50 shadow-sm rounded-xl p-8 bg-white flex flex-col items-center text-center">
                    <div className="relative w-24 h-24 mb-6">
                        <div className="w-full h-full rounded-lg bg-muted/30 border-2 border-white shadow-md overflow-hidden flex items-center justify-center">
                            <Image src={avatarUrl} alt="Profile" width={96} height={96} className="object-cover" unoptimized />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                    </div>
                    <div className="space-y-1 mb-8">
                        <h3 className="font-bold text-lg text-foreground tracking-tight">{profile.name.split(' ')[0]}</h3>
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/5 text-primary">
                            <span className="text-[10px] font-bold uppercase tracking-widest">{profile.role}</span>
                        </div>
                    </div>
                    <div className="w-full space-y-4 pt-6 border-t border-border">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest leading-none">Activity Feed</h4>
                            <span className="text-[10px] font-extrabold text-primary">{format(now, 'MMMM yyyy')}</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="text-[9px] font-bold text-muted-foreground/20 text-center pb-1">{d}</span>)}
                            {days.map((day, idx) => {
                                const isWorking = workDays.some(wd => isSameDay(new Date(wd), day));
                                const isToday = isSameDay(day, now);
                                const isMonthDay = isSameMonth(day, monthStart);
                                return (
                                    <div key={idx} className={`aspect-square flex items-center justify-center p-px transition-all duration-300 ${!isMonthDay ? 'opacity-20' : ''}`}>
                                        <div className={`w-full h-full rounded-md transition-all duration-300 flex items-center justify-center text-[9px] font-bold ${isWorking ? 'bg-primary text-white shadow-[0_2px_10px_rgba(147,51,234,0.3)]' : 'bg-muted/10 text-muted-foreground/30'} ${isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-white z-10' : ''}`}>
                                            {format(day, 'd')}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <Button variant="outline" asChild className="w-full mt-8 bg-white hover:bg-muted border-border font-bold text-[11px] rounded-lg h-10 tracking-widest uppercase tracking-widest">
                        <Link href="/dashboard/account">Update Profile</Link>
                    </Button>
                </Card>
            </div>
        </div>
    );
}
