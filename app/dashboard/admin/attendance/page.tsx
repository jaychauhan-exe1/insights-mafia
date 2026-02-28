import { createAdminClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/get-profile';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AttendanceCalendar } from '@/components/attendance-calendar';
import { Clock, History, User, Users, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AdminAttendancePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const { page: pageParam } = await searchParams;
    const profile = await getProfile();
    const supabase = await createAdminClient();

    if (!profile || profile.role !== 'Admin') return null;

    const page = parseInt(pageParam || '1');
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    // Fetch all profiles to identify employees vs freelancers
    const { data: teamMembers } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'Freelancer');

    const employeeIds = teamMembers?.filter(m => m.role === 'Employee').map(m => m.id) || [];
    const memberIds = teamMembers?.map(m => m.id) || [];

    // Fetch total count for activity feed
    const { count: totalActivityCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .in('user_id', memberIds);

    const totalPages = Math.ceil((totalActivityCount || 0) / pageSize);

    // Fetch ALL records for calendar and today's stats (calendar needs all history for current view usually, but lets stick to optimization later if needed)
    // Actually, for activity feed we use range. For calendar we might need more but lets keep it simple first.
    const { data: allRecords } = await supabase
        .from('attendance')
        .select(`
            *,
            user:profiles(*)
        `)
        .in('user_id', memberIds)
        .order('date', { ascending: false });

    // Fetch paginated history for the feed
    const { data: paginatedHistory } = await supabase
        .from('attendance')
        .select(`
            *,
            user:profiles(*)
        `)
        .in('user_id', memberIds)
        .order('date', { ascending: false })
        .order('check_in', { ascending: false, nullsFirst: false })
        .range(start, end);

    const getISTTime = () => {
        const now = new Date();
        const offset = 5.5 * 60 * 60 * 1000;
        return new Date(now.getTime() + offset);
    };

    const isAfterCheckoutWindow = (recordDate: string) => {
        const ist = getISTTime();
        const todayStr = format(ist, 'yyyy-MM-dd');

        return recordDate < todayStr;
    };

    // Today's stats
    const today = format(getISTTime(), 'yyyy-MM-dd');
    const todayRecords = allRecords?.filter(r => r.date === today) || [];

    // An employee is considered "Present" only if they checked in AND didn't miss the checkout window (if it's past midnight)
    // Actually, "Present Today" usually means they showed up. 
    // But the user said "mark him absent if forgets to checkout before 12am".
    const presentToday = todayRecords.filter(r => {
        if (r.status === 'Absent') return false;
        if (!r.check_out && isAfterCheckoutWindow(r.date)) return false;
        if (r.status === 'Half Day') return true; // Half Day is still present in a way? Or should I treat it differently? 
        return r.status === 'Present';
    }).length;

    const absentToday = employeeIds.length - presentToday;

    const history = paginatedHistory?.map(entry => {
        if (entry.status === 'Present' && !entry.check_out && isAfterCheckoutWindow(entry.date)) {
            return { ...entry, status: 'Absent' };
        }
        return entry;
    }) || [];

    return (
        <div className="space-y-6 mx-auto pb-20 lg:pb-0">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Attendance</h1>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Monitor team presence and location data</p>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border border-border/50 shadow-sm rounded-xl bg-primary text-white p-6">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Total Staff</p>
                            <h3 className="text-3xl font-bold">{employeeIds.length}</h3>
                        </div>
                        <Users className="w-8 h-8 text-white/20" />
                    </div>
                </Card>
                <Card className="border border-border/50 shadow-sm rounded-xl bg-white p-6">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Present Today</p>
                            <h3 className="text-3xl font-bold text-emerald-500">{presentToday}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 font-bold text-xs">
                            {Math.round((presentToday / (employeeIds.length || 1)) * 100)}%
                        </div>
                    </div>
                </Card>
                <Card className="border border-border/50 shadow-sm rounded-xl bg-white p-6">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Absent Today</p>
                            <h3 className="text-3xl font-bold text-red-500">{absentToday > 0 ? absentToday : 0}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Calendar View */}
                <div className="lg:col-span-8">
                    <AttendanceCalendar
                        records={(allRecords as any) || []}
                    />
                </div>

                {/* Sidebar: Absent List & Today's Leave */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Absent Today List */}
                    <Card className="border border-border/50 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col h-full">
                        <CardHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between bg-muted/30 sticky top-0 z-10">
                            <h2 className="text-[10px] font-extrabold flex items-center gap-2 uppercase tracking-[0.2em] text-red-500">
                                <Users className="w-3.5 h-3.5" /> Absent Today
                            </h2>
                        </CardHeader>
                        <CardContent className="p-0 overflow-y-auto">
                            <Table>
                                <TableBody>
                                    {teamMembers?.filter(m => m.role === 'Employee' && !todayRecords.some(r => r.user_id === m.id && r.status === 'Present')).map((member) => (
                                        <TableRow key={member.id} className="border-border group h-16 hover:bg-red-50/10">
                                            <TableCell className="px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center font-bold text-[10px] text-red-300">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <span className="font-extrabold text-[12px] text-foreground">{member.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest italic">Missing</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {absentToday === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} className="py-10 text-center">
                                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none">All Members Accounted For 🚀</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* Full-size Recent Feed at bottom */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <History className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-foreground">Recent Activity Feed</h2>
                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Live check-in and location stream</p>
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <Link key={p} href={`/dashboard/admin/attendance?page=${p}`}>
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

                <div className="hidden md:block">
                    <Card className="border border-border/50 shadow-sm rounded-xl bg-white overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-border h-12">
                                    <TableHead className="px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Team Member</TableHead>
                                    <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Date</TableHead>
                                    <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Status</TableHead>
                                    <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Time (In/Out)</TableHead>
                                    <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Place</TableHead>
                                    <TableHead className="text-right px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Location Insights</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.length > 0 ? history.map((entry) => (
                                    <TableRow key={entry.id} className="border-border group h-20 hover:bg-muted/30 transition-all duration-300">
                                        <TableCell className="px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-muted-foreground text-xs shadow-sm">
                                                    {entry.user?.avatar_url ? (
                                                        <img src={entry.user.avatar_url} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        entry.user?.name?.charAt(0) || '?'
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-[14px] text-foreground truncate leading-none">{entry.user?.name}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter mt-1">{entry.user?.role}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-bold text-[13px] text-foreground leading-none">{format(new Date(entry.date), 'MMM dd, yyyy')}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter mt-1">{format(new Date(entry.date), 'EEEE')}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`border-none text-[8px] font-bold h-5 px-2 uppercase shadow-none ${entry.status === 'Present' ? 'bg-emerald-500/10 text-emerald-600' :
                                                entry.status === 'Absent' ? 'bg-red-500/10 text-red-600' :
                                                    'bg-blue-500/10 text-blue-600'
                                                }`}>
                                                {entry.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-foreground tabular-nums">
                                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                {entry.check_in ? format(new Date(entry.check_in), 'HH:mm') : '-'}
                                                <span className="text-muted-foreground/20">/</span>
                                                {entry.check_out ? format(new Date(entry.check_out), 'HH:mm') : '...'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                {entry.check_in_workplace && (
                                                    <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        <span className="opacity-40 uppercase tracking-tighter">In:</span>
                                                        <span className={entry.check_in_workplace === 'Office' ? 'text-indigo-600' : 'text-foreground'}>
                                                            {entry.check_in_workplace}
                                                        </span>
                                                    </div>
                                                )}
                                                {entry.check_out_workplace && (
                                                    <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                        <span className="opacity-40 uppercase tracking-tighter">Out:</span>
                                                        <span className={entry.check_out_workplace === 'Office' ? 'text-indigo-600' : 'text-foreground'}>
                                                            {entry.check_out_workplace}
                                                        </span>
                                                    </div>
                                                )}
                                                {!entry.check_in_workplace && !entry.check_out_workplace && (
                                                    <span className="text-[9px] font-bold text-muted-foreground/20 italic uppercase tracking-widest">Not specified</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex flex-col items-end gap-1.5">
                                                {entry.check_in_location && (
                                                    <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                                        <MapPin className="w-3 h-3" />
                                                        {entry.check_in_location.latitude.toFixed(4)}, {entry.check_in_location.longitude.toFixed(4)}
                                                    </div>
                                                )}
                                                {entry.check_out_location && (
                                                    <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground group-hover:text-blue-500 transition-colors">
                                                        <MapPin className="w-3 h-3 text-blue-400" />
                                                        {entry.check_out_location.latitude.toFixed(4)}, {entry.check_out_location.longitude.toFixed(4)}
                                                    </div>
                                                )}
                                                {!entry.check_in_location && !entry.check_out_location && (
                                                    <span className="text-[9px] font-bold text-muted-foreground/20 italic uppercase tracking-widest">No Location Logs</span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-20 text-center">
                                            <p className="text-muted-foreground/30 text-[11px] font-bold uppercase tracking-[0.2em]">No recent activity logged</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                {/* Mobile View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {history.length > 0 ? history.map((entry) => (
                        <Card key={entry.id} className="p-5 border-border/50 shadow-sm bg-white space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-[12px] overflow-hidden">
                                        {entry.user?.avatar_url ? (
                                            <img src={entry.user.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            entry.user?.name?.charAt(0) || '?'
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[14px] text-foreground leading-none">{entry.user?.name}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1.5">{format(new Date(entry.date), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                                <Badge className={`border-none text-[8px] font-bold h-5 px-2 uppercase shadow-none ${entry.status === 'Present' ? 'bg-emerald-500/10 text-emerald-600' :
                                    entry.status === 'Absent' ? 'bg-red-500/10 text-red-600' :
                                        'bg-blue-500/10 text-blue-600'
                                    }`}>
                                    {entry.status}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
                                <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Check In</p>
                                    <p className="text-[12px] font-bold text-foreground">
                                        {entry.check_in ? format(new Date(entry.check_in), 'HH:mm') : '--:--'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Check Out</p>
                                    <p className="text-[12px] font-bold text-foreground">
                                        {entry.check_out ? format(new Date(entry.check_out), 'HH:mm') : '--:--'}
                                    </p>
                                </div>
                            </div>
                            {(entry.check_in_workplace || entry.check_out_workplace) && (
                                <div className="grid grid-cols-2 gap-4 py-3 border-b border-border/50">
                                    <div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">In Place</p>
                                        <p className="text-[10px] font-bold text-foreground truncate">
                                            {entry.check_in_workplace || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Out Place</p>
                                        <p className="text-[10px] font-bold text-foreground truncate">
                                            {entry.check_out_workplace || '-'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {entry.check_in_location && (
                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                                    <MapPin className="w-3.5 h-3.5 opacity-40" />
                                    <span>Location Logged</span>
                                </div>
                            )}
                        </Card>
                    )) : (
                        <div className="py-20 text-center border-2 border-dashed border-border/50 rounded-lg">
                            <p className="text-muted-foreground/30 text-[11px] font-bold uppercase tracking-[0.2em]">No activity logged</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
