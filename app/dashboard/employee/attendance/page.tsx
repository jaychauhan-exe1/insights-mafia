import { createAdminClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/get-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { AttendanceButtons } from "./attendance-buttons";
import { LeaveRequestModal } from "./leave-request-modal";
import { Clock, CheckCircle2, History, Timer, Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AttendanceCalendar } from "@/components/attendance-calendar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    formatIST,
    getISTToday,
    formatISTTime,
    getISTParts,
} from "@/lib/date-utils";

export default async function AttendancePage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    const { page: pageParam } = await searchParams;
    const profile = await getProfile();
    const supabase = await createAdminClient();

    if (!profile || profile.role !== "Employee") return null;

    const page = parseInt(pageParam || "1");
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const isAfterCheckoutWindow = (recordDate: string) => {
        const todayStr = getISTToday();
        return recordDate < todayStr;
    };

    const today = getISTToday();
    const { data: todayAttendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", profile.id)
        .eq("date", today)
        .maybeSingle();

    const { data: historyRaw, count } = await supabase
        .from("attendance")
        .select("*", { count: "exact" })
        .eq("user_id", profile.id)
        .order("date", { ascending: false })
        .range(start, end);

    const history =
        historyRaw?.map((entry) => {
            if (
                entry.status === "Present" &&
                !entry.check_out &&
                isAfterCheckoutWindow(entry.date)
            ) {
                return { ...entry, status: "Absent" };
            }
            return entry;
        }) || [];

    const totalPages = Math.ceil((count || 0) / pageSize);

    const { data: allHistory } = await supabase
        .from("attendance")
        .select(`
            *,
            user:profiles(*)
        `)
        .eq("user_id", profile.id)
        .order("date", { ascending: false });

    const { data: firstAttendance } = await supabase
        .from("attendance")
        .select("date")
        .eq("user_id", profile.id)
        .order("date", { ascending: true })
        .limit(1)
        .maybeSingle();

    const { data: clients } = await supabase
        .from("clients")
        .select("name")
        .order("name");
    const sortedClients = clients?.map((c) => c.name) || [];

    return (
        <div className="space-y-6 mx-auto pb-20 lg:pb-0">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                        Attendance & Sessions
                    </h2>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">
                        Track your work presence and history
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    <p className="text-[10px] font-extrabold text-muted-foreground/40 uppercase tracking-[0.2em] mb-1">Paid Leaves Left</p>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100/50 shadow-sm">
                        <span className="text-lg font-bold text-emerald-600 leading-none">{profile.paid_leaves ?? 1}</span>
                        <Plane className="w-3.5 h-3.5 text-emerald-400 rotate-12" />
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Check-in/out Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border border-border/50 shadow-sm rounded-xl bg-primary text-white overflow-hidden relative group h-fit">
                        <Timer className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12 group-hover:scale-110 transition-all duration-500" />
                        <CardHeader className="p-6 pb-2 relative">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-extrabold text-white/50 uppercase tracking-widest leading-none">
                                    ACTIVE SESSION
                                </span>
                            </div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2 uppercase tracking-tighter">
                                {new Intl.DateTimeFormat("en-IN", {
                                    weekday: "long",
                                    timeZone: "Asia/Kolkata",
                                }).format(new Date())}
                                <span className="opacity-40 text-[13px]">
                                    {new Intl.DateTimeFormat("en-IN", {
                                        month: "short",
                                        day: "numeric",
                                        timeZone: "Asia/Kolkata",
                                    }).format(new Date())}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center py-8 px-6 relative">
                            {!todayAttendance ? (
                                <div className="text-center space-y-4 flex flex-col items-center w-full">
                                    <AttendanceButtons
                                        isCheckedIn={false}
                                        clients={sortedClients}
                                    />
                                    <p className="text-white/40 text-[9px] font-extrabold uppercase tracking-[0.2em]">
                                        TAP TO CLOCK IN
                                    </p>
                                </div>
                            ) : !todayAttendance.check_out ? (
                                <div className="text-center space-y-6 flex flex-col items-center w-full">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-extrabold text-white/40 uppercase tracking-widest">
                                            SINCE
                                        </p>
                                        <h3 className="text-3xl font-bold">
                                            {formatISTTime(todayAttendance.check_in)}
                                        </h3>
                                    </div>
                                    <AttendanceButtons
                                        isCheckedIn={true}
                                        clients={sortedClients}
                                    />
                                </div>
                            ) : (
                                <div className="text-center space-y-6 flex flex-col items-center w-full">
                                    <div className="h-14 w-14 rounded-lg bg-white/20 flex items-center justify-center mb-1">
                                        <CheckCircle2 className="w-7 h-7" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold">Shift Completed</h3>
                                        <p className="text-white/50 font-bold text-[11px] uppercase tracking-widest">
                                            Have a great rest! 👋
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 w-full pt-4">
                                        <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                                            <p className="text-[9px] uppercase font-extrabold text-white/30 mb-1 tracking-widest leading-none text-left">
                                                In
                                            </p>
                                            <p className="font-bold text-[12px] tracking-tight text-left">
                                                {formatISTTime(todayAttendance.check_in)}
                                            </p>
                                            <p className="text-[10px] text-white/60 font-medium truncate text-left mt-1 border-t border-white/5 pt-1 uppercase tracking-tighter">
                                                {todayAttendance.check_in_workplace || "Office"}
                                            </p>
                                        </div>
                                        <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                                            <p className="text-[9px] uppercase font-extrabold text-white/30 mb-1 tracking-widest leading-none text-left">
                                                Out
                                            </p>
                                            <p className="font-bold text-[12px] tracking-tight text-left">
                                                {formatISTTime(todayAttendance.check_out)}
                                            </p>
                                            <p className="text-[10px] text-white/60 font-medium truncate text-left mt-1 border-t border-white/5 pt-1 uppercase tracking-tighter">
                                                {todayAttendance.check_out_workplace || "Office"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-border/50 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col">
                        <CardHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between bg-muted/30">
                            <h2 className="text-[10px] font-extrabold flex items-center gap-2 uppercase tracking-[0.2em] text-muted-foreground">
                                <History className="w-3.5 h-3.5" /> Recent History
                            </h2>
                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                        (p) => (
                                            <Link
                                                key={p}
                                                href={`/dashboard/employee/attendance?page=${p}`}
                                            >
                                                <Button
                                                    variant={page === p ? "default" : "outline"}
                                                    size="sm"
                                                    className={`h-6 w-6 p-0 text-[10px] font-bold transition-all ${page === p ? "bg-primary border-primary cursor-default" : "hover:bg-muted border-border"}`}
                                                >
                                                    {p}
                                                </Button>
                                            </Link>
                                        ),
                                    )}
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                            <Table>
                                <TableBody>
                                    {history && history.length > 0 ? (
                                        history.map((entry) => (
                                            <TableRow
                                                key={entry.id}
                                                className="border-border h-16 hover:bg-muted/30 transition-all duration-300"
                                            >
                                                <TableCell className="px-6">
                                                    <p className="font-bold text-[13px] text-foreground leading-none">
                                                        {new Intl.DateTimeFormat("en-IN", {
                                                            month: "short",
                                                            day: "2-digit",
                                                            timeZone: "Asia/Kolkata",
                                                        }).format(new Date(entry.date))}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter mt-1">
                                                        {new Intl.DateTimeFormat("en-IN", {
                                                            weekday: "long",
                                                            timeZone: "Asia/Kolkata",
                                                        }).format(new Date(entry.date))}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <div className="flex flex-col gap-1.5 items-end">
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 tabular-nums leading-none">
                                                                <span>{formatISTTime(entry.check_in)}</span>
                                                                <span className="text-muted-foreground/20">
                                                                    /
                                                                </span>
                                                                <span>{formatISTTime(entry.check_out)}</span>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-0.5">
                                                                {entry.check_in_workplace && (
                                                                    <div
                                                                        className={cn(
                                                                            "text-[7px] font-extrabold uppercase tracking-widest px-1 py-0.2 rounded bg-opacity-50",
                                                                            entry.check_in_workplace === "Office"
                                                                                ? "text-indigo-600 bg-indigo-50"
                                                                                : "text-slate-500 bg-slate-50",
                                                                        )}
                                                                    >
                                                                        In: {entry.check_in_workplace}
                                                                    </div>
                                                                )}
                                                                {entry.check_out_workplace && (
                                                                    <div
                                                                        className={cn(
                                                                            "text-[7px] font-extrabold uppercase tracking-widest px-1 py-0.2 rounded bg-opacity-50",
                                                                            entry.check_out_workplace === "Office"
                                                                                ? "text-indigo-600 bg-indigo-50"
                                                                                : "text-slate-500 bg-slate-50",
                                                                        )}
                                                                    >
                                                                        Out: {entry.check_out_workplace}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Badge
                                                            className={`border-none text-[8px] font-bold h-4 px-1.5 uppercase ${entry.status === "Present" ? "bg-emerald-50 text-emerald-500" : entry.status === "Absent" ? "bg-red-50 text-red-500" : "bg-muted text-muted-foreground/50"}`}
                                                        >
                                                            {entry.status === "Paid Off"
                                                                ? "Off"
                                                                : entry.status || "Present"}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="py-20 text-center">
                                                <p className="text-muted-foreground/30 text-[10px] font-bold uppercase tracking-widest">
                                                    No history yet
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <LeaveRequestModal />
                </div>

                {/* Right: Calendar */}
                <div className="lg:col-span-2">
                    <AttendanceCalendar
                        records={allHistory || []}
                        joiningDate={firstAttendance?.date}
                    />
                </div>
            </div>
        </div>
    );
}
