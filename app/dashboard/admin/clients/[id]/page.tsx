import { createAdminClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    Briefcase,
    Globe,
    IndianRupee,
    ExternalLink,
    Calendar,
    Clock,
    MapPin,
} from "lucide-react";
import Link from "next/link";
import { TaskFilters } from "@/components/dashboard/task-filters";
import { formatIST, formatISTTime } from "@/lib/date-utils";

export default async function ClientDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{
        year?: string;
        month?: string;
        day?: string;
        assignee?: string;
        status?: string;
    }>;
}) {
    const { id } = await params;
    const { year, month, day, assignee, status } = await searchParams;
    const supabase = await createAdminClient();

    const { data: client } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

    if (!client) return <div>Client not found</div>;

    // Build the query for tasks
    let query = supabase
        .from("tasks")
        .select(`
            *,
            assignee:profiles!tasks_assignee_id_fkey(name, avatar_url)
        `)
        .eq("client_id", id);

    // Apply Filters - Robust IST handling
    if (year) {
        const selectedYear = parseInt(year);
        if (month && month !== "0") {
            const selectedMonth = parseInt(month) - 1;
            if (day && day !== "0") {
                const selectedDay = parseInt(day);
                // Use string-based dates for ISO formatting to avoid timezone shifts
                const dateHeader = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;

                // We'll filter via range to be safe with timezones if the created_at is strictly TIMESTAMPTZ
                const start = new Date(`${dateHeader}T00:00:00`).toISOString();
                const end = new Date(`${dateHeader}T23:59:59`).toISOString();

                query = query.gte("created_at", start).lte("created_at", end);
            } else {
                const d = new Date(selectedYear, selectedMonth, 1);
                const start = format(startOfMonth(d), 'yyyy-MM-dd') + "T00:00:00Z";
                const end = format(endOfMonth(d), 'yyyy-MM-dd') + "T23:59:59Z";
                query = query.gte("created_at", start).lte("created_at", end);
            }
        } else {
            const start = `${selectedYear}-01-01T00:00:00Z`;
            const end = `${selectedYear}-12-31T23:59:59Z`;
            query = query.gte("created_at", start).lte("created_at", end);
        }
    }

    if (assignee && assignee !== "0") {
        query = query.eq("assignee_id", assignee);
    }

    if (status && status !== "0") {
        query = query.eq("status", status);
    }

    const { data: tasks } = await query.order("created_at", { ascending: false });
    const { data: users } = await supabase
        .from("profiles")
        .select("*")
        .order("name");

    // Fetch visits from attendance
    let visitsQuery = supabase
        .from("attendance")
        .select(`
            *,
            user:profiles(name, avatar_url)
        `)
        .or(
            `check_in_workplace.eq."${client.name}",check_out_workplace.eq."${client.name}"`,
        );

    // Apply the same filters to visits (except task status)
    if (year) {
        const selectedYear = parseInt(year);
        if (month && month !== "0") {
            const selectedMonth = parseInt(month) - 1;
            if (day && day !== "0") {
                const selectedDay = parseInt(day);
                const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, "0")}`;
                visitsQuery = visitsQuery.eq("date", dateStr);
            } else {
                const d = new Date(selectedYear, selectedMonth, 1);
                const start = format(startOfMonth(d), 'yyyy-MM-dd');
                const end = format(endOfMonth(d), 'yyyy-MM-dd');
                visitsQuery = visitsQuery.gte("date", start).lte("date", end);
            }
        } else {
            const start = `${selectedYear}-01-01`;
            const end = `${selectedYear}-12-31`;
            visitsQuery = visitsQuery.gte("date", start).lte("date", end);
        }
    }

    if (assignee && assignee !== "0") {
        visitsQuery = visitsQuery.eq("user_id", assignee);
    }

    const { data: visits } = await visitsQuery.order("date", { ascending: false });

    const activeTasks = tasks?.filter((t: any) => t.status !== "Completed") || [];
    const completedTasks = tasks?.filter((t: any) => t.status === "Completed") || [];

    return (
        <div className="space-y-6 mx-auto pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Link
                    href="/dashboard/admin/clients"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 font-bold text-[10px] uppercase tracking-widest group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
                    Back to Clients
                </Link>
                <TaskFilters users={users || []} />
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Client Profile Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border border-border/50 shadow-sm rounded-xl bg-white overflow-hidden">
                        <div className="h-20 bg-muted/50" />
                        <CardContent className="px-6 pb-6 -mt-10 text-center">
                            <div className="w-20 h-20 rounded-xl bg-white shadow-md border-2 border-white flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-9 h-9 text-primary" />
                            </div>
                            <h1 className="text-xl font-bold text-foreground">
                                {client.name}
                            </h1>
                            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/5 text-primary">
                                <span className="text-[9px] font-bold uppercase tracking-widest">
                                    Client
                                </span>
                            </div>

                            <div className="mt-8 space-y-3 text-left">
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm border border-border/50">
                                        <IndianRupee className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                                            Yield
                                        </p>
                                        <p className="font-bold text-foreground text-sm">
                                            ₹{client.monthly_charges?.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {client.business && (
                                    <div className="flex items-center gap-3 px-1">
                                        <Globe className="w-3.5 h-3.5 text-muted-foreground/50" />
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {client.business}
                                        </span>
                                    </div>
                                )}

                                {client.contract_link && (
                                    <a
                                        href={client.contract_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-1 text-xs font-bold text-primary hover:underline group"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-300" />
                                        Master Contract
                                    </a>
                                )}

                                <div className="flex items-center gap-3 px-1">
                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground/50" />
                                    <span className="text-xs font-medium text-muted-foreground/60 italic uppercase tracking-tighter">
                                        Added {formatIST(client.created_at).split(",")[0]}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-border/50 shadow-sm rounded-xl bg-foreground p-6 text-white space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">
                                    Active Tasks
                                </p>
                                <h3 className="text-3xl font-bold">{activeTasks.length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-white/80" />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/60">
                            <span>Finished</span>
                            <span className="bg-white/10 px-2 py-0.5 rounded-md">
                                {completedTasks.length}
                            </span>
                        </div>
                    </Card>

                    <Card className="border border-border/50 shadow-sm rounded-xl bg-indigo-600 p-6 text-white space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">
                                    Total Field Visits
                                </p>
                                <h3 className="text-3xl font-bold">
                                    {visits?.length || 0}
                                </h3>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-white/80" />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/60">
                            <span>Last Logged</span>
                            <span className="bg-white/10 px-2 py-0.5 rounded-md">
                                {visits?.[0] ? formatIST(visits[0].date).split(",")[0] : "None"}
                            </span>
                        </div>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Tasks List */}
                    <Card className="border border-border/50 shadow-sm rounded-xl bg-white overflow-hidden">
                        <CardHeader className="px-6 py-4 border-b border-border/50 bg-muted/30">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Deliverables & Tasks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="border-border hover:bg-transparent h-10">
                                        <TableHead className="px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Date
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Tasks
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Managed
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Deadline
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right px-6">
                                            Payout
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks && tasks.length > 0 ? (
                                        tasks.map((task: any) => (
                                            <TableRow
                                                key={task.id}
                                                className="border-border hover:bg-muted/30 transition-all duration-300 group h-20"
                                            >
                                                <TableCell className="px-6">
                                                    <div className="flex flex-col">
                                                        <p className="font-bold text-[13px] text-foreground tabular-nums">
                                                            {
                                                                formatIST(
                                                                    task.status === "Completed"
                                                                        ? task.completed_at
                                                                        : task.created_at,
                                                                ).split(",")[0]
                                                            }
                                                        </p>
                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">
                                                            {task.status === "Completed"
                                                                ? "Completed"
                                                                : "Created"}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <div className="flex flex-col gap-0.5">
                                                        <Link
                                                            href={`/dashboard/tasks/${task.id}`}
                                                            className="font-bold text-[13px] text-foreground hover:text-primary transition-colors duration-300"
                                                        >
                                                            {task.title}
                                                        </Link>
                                                        <div className="flex items-center gap-1.5">
                                                            <div
                                                                className={`w-1.5 h-1.5 rounded-full ${task.status === "Completed" ? "bg-emerald-500" : "bg-amber-500"}`}
                                                            />
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                                                {task.status} •{" "}
                                                                {formatIST(task.created_at).split(",")[0]}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center font-bold text-[9px] text-muted-foreground border border-white overflow-hidden shadow-sm">
                                                            {task.assignee?.avatar_url ? (
                                                                <img
                                                                    src={task.assignee.avatar_url}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                task.assignee?.name?.charAt(0) || "?"
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-bold text-muted-foreground truncate max-w-[80px]">
                                                            {task.assignee?.name?.split(" ")[0] || "TBA"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <p className="text-xs font-bold text-muted-foreground">
                                                            {task.deadline
                                                                ? formatIST(task.deadline).split(",")[0]
                                                                : "No Limit"}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">
                                                            Deadline
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right px-6">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-0.5 font-bold text-[13px] text-foreground">
                                                            <IndianRupee className="w-3 h-3 text-muted-foreground/50" />
                                                            {task.payment_amount?.toLocaleString() || "0"}
                                                        </div>
                                                        <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">
                                                            Budget
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-20 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center mb-4">
                                                        <Briefcase className="w-6 h-6 text-muted-foreground/20" />
                                                    </div>
                                                    <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">
                                                        No active tasks
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Visits Table */}
                    <Card className="border border-border/50 shadow-sm rounded-xl bg-white overflow-hidden">
                        <CardHeader className="px-6 py-4 border-b border-border/50 bg-muted/30">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                Visits & Field Logs
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="border-border hover:bg-transparent h-10">
                                        <TableHead className="px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Date Visited
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Employee
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Status
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Location
                                        </TableHead>
                                        <TableHead className="text-right px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Checked In/Out
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visits && visits.length > 0 ? (
                                        visits.map((visit: any) => (
                                            <TableRow
                                                key={visit.id}
                                                className="border-border hover:bg-muted/30 transition-all duration-300 group h-20"
                                            >
                                                <TableCell className="px-6">
                                                    <div className="flex flex-col">
                                                        <p className="font-bold text-[13px] text-foreground tabular-nums">
                                                            {formatIST(visit.date).split(",")[0]}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">
                                                            {new Intl.DateTimeFormat("en-IN", {
                                                                weekday: "long",
                                                                timeZone: "Asia/Kolkata",
                                                            }).format(new Date(visit.date))}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center font-bold text-[9px] text-muted-foreground border border-white overflow-hidden shadow-sm">
                                                            {visit.user?.avatar_url ? (
                                                                <img
                                                                    src={visit.user.avatar_url}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                visit.user?.name?.charAt(0) || "?"
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-bold text-muted-foreground truncate max-w-[120px]">
                                                            {visit.user?.name || "Staff"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="text-[8px] font-bold px-1.5 h-4 uppercase bg-indigo-50 text-indigo-600 border-none shadow-none">
                                                        {visit.check_in_workplace === client.name &&
                                                            visit.check_out_workplace === client.name
                                                            ? "Full Session"
                                                            : visit.check_in_workplace === client.name
                                                                ? "Check-In"
                                                                : "Check-Out"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        {visit.check_in_location && (
                                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground">
                                                                <MapPin className="w-2.5 h-2.5 text-emerald-500" />
                                                                {visit.check_in_location.latitude.toFixed(4)},{" "}
                                                                {visit.check_in_location.longitude.toFixed(4)}
                                                            </div>
                                                        )}
                                                        {visit.check_out_location && (
                                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground">
                                                                <MapPin className="w-2.5 h-2.5 text-amber-500" />
                                                                {visit.check_out_location.latitude.toFixed(4)},{" "}
                                                                {visit.check_out_location.longitude.toFixed(4)}
                                                            </div>
                                                        )}
                                                        {!visit.check_in_location && !visit.check_out_location && (
                                                            <span className="text-[9px] font-bold text-muted-foreground/30 uppercase italic">No GPS Data</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right px-6">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-foreground tabular-nums">
                                                            <Clock className="w-3 h-3 text-muted-foreground/50" />
                                                            {formatISTTime(visit.check_in)}
                                                            <span className="text-muted-foreground/20">
                                                                /
                                                            </span>
                                                            {formatISTTime(visit.check_out)}
                                                        </div>
                                                        <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none mt-1">
                                                            Logged Time
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-20 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center mb-4">
                                                        <MapPin className="w-6 h-6 text-muted-foreground/20" />
                                                    </div>
                                                    <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">
                                                        No field visits logged
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
