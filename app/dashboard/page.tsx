import { getProfile } from "@/lib/supabase/get-profile";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import {
    Users,
    ClipboardList,
    Clock,
    Wallet,
    ChevronRight,
    Play,
    Calendar as CalendarIcon,
    CheckCircle2,
    AlertCircle,
    Banknote,
} from "lucide-react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    startOfWeek,
    endOfWeek,
    isSameMonth,
} from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { calculateSalary } from "@/lib/salary-utils";
import { DismissableNotice } from "@/components/dashboard/dismissable-notice";
import { getISTToday, formatISTTime } from "@/lib/date-utils";

export default async function DashboardPage() {
    const profile = await getProfile();
    const supabase = await createAdminClient();

    if (!profile) return null;

    // Use India Standard Time for "today" and "now"
    const todayStr = getISTToday();
    const now = new Date(); // Internal use for intervals, but we filter by date strings
    const monthStart = startOfMonth(new Date(todayStr));
    const monthStartStr = monthStart.toISOString().split("T")[0];

    // Compute upcoming 2-day window for leave notices (in IST)
    const todayDate = new Date(todayStr);
    const twoDaysLater = new Date(todayDate);
    twoDaysLater.setDate(todayDate.getDate() + 2);
    const twoDaysLaterStr = twoDaysLater.toISOString().split("T")[0];

    // Fetch necessary data
    const [
        tasksRes,
        statsRes,
        attendanceRes,
        recentTasksRes,
        adminActivityRes,
        clientsRes,
        allProfilesRes,
        allAttendanceRes,
        allLeaveRequestsRes,
        firstAttendancesRes,
        approvalItemsRes,
        upcomingLeavesRes,
    ] = await Promise.all([
        supabase
            .from("tasks")
            .select("*", { count: "exact", head: true })
            .eq("assignee_id", profile.id)
            .eq("status", "Pending"),

        profile.role === "Admin"
            ? Promise.all([
                supabase
                    .from("profiles")
                    .select("*", { count: "exact", head: true }),
                supabase
                    .from("tasks")
                    .select("*", { count: "exact", head: true })
                    .neq("status", "Completed"),
                supabase
                    .from("tasks")
                    .select("*", { count: "exact", head: true })
                    .eq("status", "Review"),
                supabase
                    .from("leave_requests")
                    .select("*", { count: "exact", head: true })
                    .eq("status", "Pending"),
            ])
            : Promise.all([
                supabase
                    .from("tasks")
                    .select("*", { count: "exact", head: true })
                    .eq("assignee_id", profile.id),
                supabase
                    .from("tasks")
                    .select("*", { count: "exact", head: true })
                    .eq("assignee_id", profile.id)
                    .eq("status", "Completed"),
                supabase
                    .from("tasks")
                    .select("completed_at")
                    .eq("assignee_id", profile.id)
                    .not("completed_at", "is", null),
            ]),

        supabase
            .from("attendance")
            .select("date, status")
            .eq("user_id", profile.id),

        profile.role === "Admin"
            ? supabase
                .from("tasks")
                .select("*, assignee:profiles!tasks_assignee_id_fkey(name, avatar_url)")
                .order("created_at", { ascending: false })
                .limit(3)
            : supabase
                .from("tasks")
                .select("*, assignee:profiles!tasks_assignee_id_fkey(name, avatar_url)")
                .eq("assignee_id", profile.id)
                .order("created_at", { ascending: false })
                .limit(3),

        profile.role === "Admin"
            ? Promise.all([
                supabase.from("tasks").select("created_at").eq("created_by", profile.id),
                supabase.from("clients").select("created_at"),
                supabase
                    .from("tasks")
                    .select("completed_at")
                    .not("completed_at", "is", null),
            ])
            : Promise.resolve(null),

        profile.role === "Admin"
            ? supabase.from("clients").select("monthly_charges")
            : Promise.resolve({ data: [] }),
        profile.role === "Admin"
            ? supabase
                .from("profiles")
                .select("*")
                .in("role", ["Employee", "Freelancer"])
            : Promise.resolve({ data: [] }),
        profile.role === "Admin"
            ? supabase
                .from("attendance")
                .select("user_id, date, status")
                .gte("date", monthStartStr)
            : Promise.resolve({ data: [] }),

        profile.role === "Admin"
            ? supabase
                .from("leave_requests")
                .select("*")
                .gte("date", monthStartStr)
            : supabase
                .from("leave_requests")
                .select("*")
                .eq("user_id", profile.id)
                .gte("date", monthStartStr),

        profile.role === "Admin"
            ? supabase
                .from("attendance")
                .select("user_id, date")
                .order("date", { ascending: true })
            : supabase
                .from("attendance")
                .select("date")
                .eq("user_id", profile.id)
                .order("date", { ascending: true })
                .limit(1),

        profile.role === "Admin"
            ? Promise.all([
                supabase
                    .from("tasks")
                    .select("*, assignee:profiles!tasks_assignee_id_fkey(name, avatar_url)")
                    .eq("status", "Review")
                    .order("created_at", { ascending: false })
                    .limit(3),
                supabase
                    .from("leave_requests")
                    .select("*, user:profiles(name, avatar_url)")
                    .eq("status", "Pending")
                    .order("created_at", { ascending: false })
                    .limit(3),
            ])
            : Promise.resolve([[], []] as any),

        // Upcoming leave notices for Admin: leaves in next 2 days (today → today+2)
        profile.role === "Admin"
            ? supabase
                .from("leave_requests")
                .select("*, user:profiles(name, avatar_url)")
                .gte("date", todayStr)
                .lte("date", twoDaysLaterStr)
                .in("status", ["Approved", "Rejected"])
                .order("date", { ascending: true })
            : Promise.resolve({ data: [] }),
    ]);

    const newTasksCount = tasksRes?.count || 0;
    const leaveRequests = allLeaveRequestsRes?.data || [];
    const firstAttendances = firstAttendancesRes?.data || [];
    const attendanceRecords = attendanceRes?.data || [];
    const isCheckedInToday = attendanceRecords.some((r: any) => r.date === todayStr);

    // Build upcoming leave notice list for Admin
    const upcomingLeaveNotices: { id: string; name: string; date: string; status: string; daysUntil: number }[] = [];
    if (profile.role === "Admin") {
        const rawUpcoming = (upcomingLeavesRes as any)?.data || [];
        rawUpcoming.forEach((leave: any) => {
            const leaveDate = new Date(leave.date);
            const diffMs = leaveDate.getTime() - todayDate.getTime();
            const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
            upcomingLeaveNotices.push({
                id: leave.id,
                name: leave.user?.name || "Someone",
                date: leave.date,
                status: leave.status,
                daysUntil,
            });
        });
    }

    let activityDates: string[] = attendanceRecords.map((d: any) => d.date);
    if (profile.role === "Admin" && adminActivityRes) {
        const [createdTasks, createdClients, approvedTasks] = adminActivityRes as any;
        createdTasks.data?.forEach((t: any) =>
            activityDates.push(t.created_at.split("T")[0]),
        );
        createdClients.data?.forEach((c: any) =>
            activityDates.push(c.created_at.split("T")[0]),
        );
        approvedTasks.data?.forEach((t: any) =>
            activityDates.push(t.completed_at.split("T")[0]),
        );
    } else {
        const taskActivity =
            (statsRes as any)[2]?.data?.map(
                (d: any) => d.completed_at.split("T")[0],
            ) || [];
        activityDates = [...activityDates, ...taskActivity];
    }

    const workDays = Array.from(new Set(activityDates));
    const recentTasks = recentTasksRes?.data || [];
    let statsList: any[] = [];
    let combinedApprovals: any[] = [];
    let totalApprovalsPending = 0;

    if (profile.role === "Admin") {
        const allProfiles = allProfilesRes?.data || [];
        const employees = allProfiles.filter((p: any) => p.role === "Employee");
        const freelancers = allProfiles.filter((p: any) => p.role === "Freelancer");

        const attendance = allAttendanceRes?.data || [];
        const employeesSalary = employees.reduce((acc: number, emp: any) => {
            const empAttendance = attendance.filter((a: any) => a.user_id === emp.id);
            const joiningDate = firstAttendances.find((a: any) => a.user_id === emp.id)
                ?.date;
            const calc = calculateSalary(
                Number(emp.salary || 0),
                Number(emp.deduction_amount || 0),
                empAttendance,
                [],
                joiningDate,
            );
            return acc + calc.finalSalary;
        }, 0);

        const freelancerPayouts = freelancers.reduce(
            (acc: number, f: any) => acc + Number(f.wallet_balance || 0),
            0,
        );
        const totalPayouts = employeesSalary + freelancerPayouts;

        statsList = [
            {
                label: "Total team",
                value: (statsRes as any)[0].count || 0,
                icon: Users,
                href: "/dashboard/admin/users",
                color: "bg-indigo-500",
            },
            {
                label: "Total Active Tasks",
                value: (statsRes as any)[1].count || 0,
                icon: ClipboardList,
                href: "/dashboard/tasks",
                color: "bg-emerald-500",
            },
            {
                label: "Total Payouts",
                value: `₹${totalPayouts.toLocaleString("en-IN")}`,
                icon: Banknote,
                href: "/dashboard/admin/payments",
                color: "bg-orange-500",
            },
        ];

        totalApprovalsPending =
            ((statsRes as any)[2].count || 0) + ((statsRes as any)[3].count || 0);

        const [reviewTasks, pLeaves] = approvalItemsRes as any;
        combinedApprovals = [
            ...(reviewTasks?.data || []).map((t: any) => ({ ...t, type: "task" })),
            ...(pLeaves?.data || []).map((l: any) => ({ ...l, type: "leave" })),
        ]
            .sort(
                (a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            )
            .slice(0, 3);
    } else {
        if (profile.role === "Freelancer") {
            statsList = [
                {
                    label: "My Tasks",
                    value: (statsRes as any)[0].count || 0,
                    icon: ClipboardList,
                    href: "/dashboard/tasks",
                    color: "bg-indigo-500",
                },
                {
                    label: "Finished",
                    value: (statsRes as any)[1].count || 0,
                    icon: CheckCircle2,
                    href: "/dashboard/tasks",
                    color: "bg-emerald-500",
                },
                {
                    label: "Earnings",
                    value: `₹${Number(profile.wallet_balance || 0).toLocaleString("en-IN")}`,
                    icon: Wallet,
                    href: "/dashboard/freelancer/wallet",
                    color: "bg-indigo-600",
                },
            ];
        } else {
            const myAttendance = (attendanceRes?.data || []) as any[];
            const daysWorkedThisMonth = myAttendance.filter((a: any) =>
                a.date.startsWith(todayStr.slice(0, 7)),
            ).length;

            statsList = [
                {
                    label: "My Tasks",
                    value: (statsRes as any)[0].count || 0,
                    icon: ClipboardList,
                    href: "/dashboard/tasks",
                    color: "bg-indigo-500",
                },
                {
                    label: "Days Worked",
                    value: daysWorkedThisMonth,
                    icon: CalendarIcon,
                    href: "/dashboard/employee/attendance",
                    color: "bg-emerald-500",
                },
                {
                    label: "Finished",
                    value: (statsRes as any)[1].count || 0,
                    icon: CheckCircle2,
                    href: "/dashboard/tasks",
                    color: "bg-orange-500",
                },
            ];
        }
    }

    const monthStartObj = startOfMonth(new Date(todayStr));
    const monthEndObj = endOfMonth(monthStartObj);
    const calendarStart = startOfWeek(monthStartObj);
    const calendarEnd = endOfWeek(monthEndObj);
    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });
    const avatarUrl =
        profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=d`;

    return (
        <div className="flex flex-col xl:flex-row gap-8">
            <div className="flex-1 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {statsList.map((stat) => (
                        <Link key={stat.label} href={stat.href}>
                            <Card className="border border-border/50 shadow-sm rounded-xl p-6 bg-white hover:border-primary/20 hover:shadow-md transition-all duration-300 cursor-pointer group h-full">
                                <div className="space-y-4">
                                    <div
                                        className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-300`}
                                    >
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            {stat.label}
                                        </p>
                                        <h3 className="font-bold text-2xl text-foreground tabular-nums">
                                            {stat.value}
                                        </h3>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="space-y-4">
                    {profile.role === "Employee" && !isCheckedInToday && (
                        <DismissableNotice id="attendance_reminder">
                            <div className="bg-red-50 border border-red-100 shadow-sm rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 mr-8 sm:mr-0 min-h-[100px]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-red-900">
                                            Attendance Reminder
                                        </h3>
                                        <p className="text-sm text-red-700 font-medium">
                                            You haven't checked in for today yet. Please record
                                            your attendance.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    asChild
                                    className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold px-6"
                                >
                                    <Link href="/dashboard/employee/attendance">
                                        Check In Now
                                    </Link>
                                </Button>
                            </div>
                        </DismissableNotice>
                    )}

                    {profile.role === "Admin" && totalApprovalsPending > 0 && (
                        <DismissableNotice id="admin_approval_items">
                            <div className="bg-primary/5 border border-primary/10 shadow-sm rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 mr-8 sm:mr-0 min-h-[100px]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">
                                            Approval Required
                                        </h3>
                                        <p className="text-sm text-muted-foreground font-medium">
                                            There are {totalApprovalsPending} items
                                            (tasks/leaves) waiting for your approval.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    asChild
                                    className="rounded-lg bg-primary hover:bg-primary/90 text-white font-bold px-6"
                                >
                                    <Link href="/dashboard/admin/approvals">Review Now</Link>
                                </Button>
                            </div>
                        </DismissableNotice>
                    )}

                    {/* Upcoming Leave Notices — non-closeable, admin only */}
                    {profile.role === "Admin" && upcomingLeaveNotices.map((notice) => {
                        const leaveDay = new Date(notice.date);
                        const dayLabel = leaveDay.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            timeZone: "Asia/Kolkata",
                        });
                        const isApproved = notice.status === "Approved";
                        const whenLabel =
                            notice.daysUntil === 0
                                ? "today"
                                : notice.daysUntil === 1
                                    ? "tomorrow"
                                    : `on ${dayLabel}`;
                        return (
                            <div
                                key={notice.id}
                                className="bg-primary/5 border border-primary/20 shadow-sm rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 min-h-[100px]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <CalendarIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">
                                            {isApproved ? "Upcoming Leave" : "Unresolved Leave Request"}
                                        </h3>
                                        <p className="text-sm text-muted-foreground font-medium">
                                            {isApproved
                                                ? <><span className="font-bold text-foreground">{notice.name}</span> is going on leave {whenLabel} ({dayLabel}).</>
                                                : <><span className="font-bold text-foreground">{notice.name}</span> might go on leave {whenLabel} ({dayLabel}) — request was not approved.</>}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap shrink-0 ${isApproved
                                            ? "bg-primary/10 text-primary"
                                            : "bg-orange-50 text-orange-600 border border-orange-200"
                                        }`}
                                >
                                    {isApproved ? "Approved Leave" : "Rejected"}
                                </span>
                            </div>
                        );
                    })}

                    {profile.role === "Employee" && (
                        <div className="space-y-4">
                            {leaveRequests
                                .filter((l) => l.status === "Approved")
                                .map((leave: any) => (
                                    <DismissableNotice
                                        key={leave.id}
                                        id={`leave_approved_${leave.id}`}
                                    >
                                        <div className="bg-emerald-50 border border-emerald-100 shadow-sm rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 mr-8 sm:mr-0 min-h-[100px]">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-emerald-900">
                                                        Leave Approved
                                                    </h3>
                                                    <p className="text-sm text-emerald-700 font-medium lowercase tracking-tighter">
                                                        Your leave request for {leave.date} has
                                                        been approved.
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">
                                                Approved
                                            </span>
                                        </div>
                                    </DismissableNotice>
                                ))}
                            {leaveRequests
                                .filter((l) => l.status === "Rejected")
                                .map((leave: any) => (
                                    <DismissableNotice
                                        key={leave.id}
                                        id={`leave_rejected_${leave.id}`}
                                    >
                                        <div className="bg-red-50 border border-red-100 shadow-sm rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 mr-8 sm:mr-0 min-h-[100px]">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                                                    <AlertCircle className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-red-900">
                                                        Leave Rejected
                                                    </h3>
                                                    <p className="text-sm text-red-700 font-medium">
                                                        Your leave request for {leave.date} was
                                                        rejected.
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">
                                                Rejected
                                            </span>
                                        </div>
                                    </DismissableNotice>
                                ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-foreground">Active Tasks</h2>
                        <Button
                            variant="ghost"
                            asChild
                            className="text-primary font-bold text-xs h-9 hover:bg-primary/5 rounded-lg px-4"
                        >
                            <Link href="/dashboard/tasks">View All</Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentTasks.map((task: any) => (
                            <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
                                <Card className="border border-border/50 shadow-sm rounded-xl overflow-hidden bg-white p-5 space-y-4 hover:border-primary/20 hover:shadow-md transition-all duration-300 cursor-pointer h-full">
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${task.status === "Completed"
                                                ? "bg-emerald-50 text-emerald-600"
                                                : task.status === "Review"
                                                    ? "bg-indigo-50 text-indigo-600"
                                                    : task.status === "Revision"
                                                        ? "bg-orange-50 text-orange-600"
                                                        : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {task.status}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-muted-foreground font-bold text-[10px] uppercase tracking-tighter">
                                            <CalendarIcon className="w-3 h-3" />
                                            {task.created_at.split("T")[0]}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm leading-tight text-foreground line-clamp-2">
                                            {task.title}
                                        </h4>
                                        <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
                                            {task.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2.5 pt-3 border-t border-border/50">
                                        <div className="w-6 h-6 rounded-full bg-muted overflow-hidden text-[10px] flex items-center justify-center font-bold text-muted-foreground border border-white">
                                            {task.assignee?.avatar_url ? (
                                                <Image
                                                    src={task.assignee.avatar_url}
                                                    alt=""
                                                    width={24}
                                                    height={24}
                                                    unoptimized
                                                />
                                            ) : (
                                                task.assignee?.name?.charAt(0) || "?"
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold text-foreground truncate uppercase tracking-tight">
                                            {task.assignee?.name || "Unassigned"}
                                        </span>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {profile.role === "Admin" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-foreground">
                                Needs Approval
                            </h2>
                            <Button
                                variant="ghost"
                                asChild
                                className="text-primary font-bold text-xs h-9 hover:bg-primary/5 rounded-lg px-4"
                            >
                                <Link href="/dashboard/admin/approvals">View All</Link>
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {combinedApprovals.map((item: any) => (
                                <Link
                                    key={item.id}
                                    href={
                                        item.type === "task"
                                            ? `/dashboard/tasks/${item.id}`
                                            : `/dashboard/admin/approvals`
                                    }
                                >
                                    <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-white p-5 space-y-4 hover:border-primary/20 hover:shadow-md transition-all duration-300 cursor-pointer h-full">
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider bg-primary/5 text-primary border border-primary/10`}
                                            >
                                                {item.type === "task"
                                                    ? "Review Task"
                                                    : "Leave Request"}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-muted-foreground font-bold text-[10px] uppercase tracking-tighter">
                                                <CalendarIcon className="w-3 h-3" />
                                                {item.created_at.split("T")[0]}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm leading-tight text-foreground line-clamp-2">
                                                {item.type === "task"
                                                    ? item.title
                                                    : `Leave: ${item.reason}`}
                                            </h4>
                                            <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
                                                {item.type === "task" ? item.description : item.date}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2.5 pt-3 border-t border-border/50">
                                            <div className="w-6 h-6 rounded-full bg-muted overflow-hidden text-[10px] flex items-center justify-center font-bold text-muted-foreground border border-white">
                                                {item.type === "task"
                                                    ? item.assignee?.avatar_url ? (
                                                        <Image
                                                            src={item.assignee.avatar_url}
                                                            alt=""
                                                            width={24}
                                                            height={24}
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        item.assignee?.name?.charAt(0) || "?"
                                                    )
                                                    : item.user?.avatar_url ? (
                                                        <Image
                                                            src={item.user.avatar_url}
                                                            alt=""
                                                            width={24}
                                                            height={24}
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        item.user?.name?.charAt(0) || "?"
                                                    )}
                                            </div>
                                            <span className="text-[10px] font-bold text-foreground truncate uppercase tracking-tight">
                                                {item.type === "task"
                                                    ? item.assignee?.name || "Unassigned"
                                                    : item.user?.name || "Unknown"}
                                            </span>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="w-full xl:w-[320px] shrink-0 space-y-6">
                <Card className="border border-border/50 shadow-sm rounded-xl p-8 bg-white flex flex-col items-center text-center">
                    <div className="relative w-24 h-24 mb-6">
                        <div className="w-full h-full rounded-lg bg-muted/30 border-2 border-white shadow-md overflow-hidden flex items-center justify-center">
                            <Image
                                src={avatarUrl}
                                alt="Profile"
                                width={96}
                                height={96}
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                    </div>
                    <div className="space-y-1 mb-8">
                        <h3 className="font-bold text-lg text-foreground tracking-tight">
                            {profile.name.split(" ")[0]}
                        </h3>
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/5 text-primary">
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                {profile.role}
                            </span>
                        </div>
                    </div>
                    <div className="w-full space-y-4 pt-6 border-t border-border">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest leading-none">
                                Activity Feed
                            </h4>
                            <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
                                Current Period
                            </span>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                                <span
                                    key={i}
                                    className="text-[9px] font-bold text-muted-foreground/20 text-center pb-1"
                                >
                                    {d}
                                </span>
                            ))}
                            {calendarDays.map((day, idx) => {
                                const dStr = day.toISOString().split("T")[0];
                                const isWorking = workDays.includes(dStr);
                                const isTodayDay = dStr === todayStr;
                                const isMonthDay = isSameMonth(day, monthStartObj);
                                return (
                                    <div
                                        key={idx}
                                        className={`aspect-square flex items-center justify-center p-px transition-all duration-300 ${!isMonthDay ? "opacity-20" : ""}`}
                                    >
                                        <div
                                            className={`w-full h-full rounded-md transition-all duration-300 flex items-center justify-center text-[9px] font-bold ${isWorking ? "bg-primary text-white shadow-[0_2px_10px_rgba(147,51,234,0.3)]" : "bg-muted/10 text-muted-foreground/30"} ${isTodayDay ? "ring-1 ring-primary ring-offset-1 ring-offset-white z-10" : ""}`}
                                        >
                                            {format(day, "d")}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        asChild
                        className="w-full mt-8 bg-white hover:bg-muted border-border font-bold text-[11px] rounded-lg h-10 tracking-widest uppercase tracking-widest"
                    >
                        <Link href="/dashboard/account">Update Profile</Link>
                    </Button>
                </Card>
            </div>
        </div>
    );
}
