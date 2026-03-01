'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    startOfWeek,
    endOfWeek,
    isSameDay,
    addMonths,
    subMonths,
    parseISO
} from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { MapPin, Clock, User as UserIcon } from 'lucide-react';

interface AttendanceRecord {
    id: string;
    date: string;
    check_in?: string | null;
    check_out?: string | null;
    status: 'Present' | 'Absent' | 'Off' | 'Paid Off' | 'Half Day';
    check_in_location?: { latitude: number; longitude: number } | null;
    check_out_location?: { latitude: number; longitude: number } | null;
    user?: {
        name: string;
        avatar_url?: string | null;
        role: string;
    };
}

import { formatISTTime, getISTToday } from '@/lib/date-utils';

export function AttendanceCalendar({ records, joiningDate }: { records: AttendanceRecord[], joiningDate?: string }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd
    });

    const isAfterCheckoutWindow = (recordDate: string) => {
        const todayStr = getISTToday();
        return recordDate < todayStr;
    };

    const getStatusForDay = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return records.map(r => {
            if (r.date === dateStr && r.status === 'Present' && !r.check_out && isAfterCheckoutWindow(r.date)) {
                return { ...r, status: 'Absent' as const };
            }
            return r;
        }).filter(r => r.date === dateStr);
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const selectedDateRecords = selectedDate
        ? getStatusForDay(selectedDate)
        : [];

    return (
        <>
            <Card className="border border-border/50 shadow-sm rounded-xl bg-white overflow-hidden">
                <CardHeader className="p-6 md:p-8 border-b border-border/50 flex flex-row items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                            <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-foreground">{format(currentMonth, 'MMMM yyyy')}</h2>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Presence Overview</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-9 w-9 rounded-lg hover:bg-muted transition-all duration-300"><ChevronLeft className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-9 w-9 rounded-lg hover:bg-muted transition-all duration-300"><ChevronRight className="w-5 h-5" /></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                    <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden bg-border/50 border border-border/50">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="bg-muted/50 py-3 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                        {days.map((day, idx) => {
                            const dayRecords = getStatusForDay(day);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isDayToday = isToday(day);
                            const istTodayValue = new Date(); // Browser is in IST
                            const isPastDay = day < istTodayValue && !isSameDay(day, istTodayValue);
                            const isWeekday = day.getDay() !== 0 && day.getDay() !== 6;

                            let mainStatus = dayRecords.length > 0 ? (
                                dayRecords.some(r => r.status === 'Present') ? 'Present' :
                                    dayRecords.some(r => r.status === 'Half Day') ? 'Half Day' :
                                        dayRecords[0].status
                            ) : null;

                            const joiningDateObj = joiningDate ? parseISO(joiningDate) : null;
                            const isBeforeJoining = joiningDateObj && day < joiningDateObj && !isSameDay(day, joiningDateObj);

                            // Only show "Absent" if we have a joiningDate (user-specific view)
                            // and the day is not before joining, and it's a past day in the current month
                            if (joiningDate && !mainStatus && isPastDay && isCurrentMonth && !isBeforeJoining) {
                                mainStatus = 'Absent';
                            }

                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedDate(day)}
                                    className={`min-h-[90px] p-2 bg-white flex flex-col items-center justify-start transition-all cursor-pointer hover:bg-muted/30 ${!isCurrentMonth ? 'opacity-20' : ''}`}
                                >
                                    <span className={`text-[12px] font-bold flex items-center justify-center w-7 h-7 rounded-lg mb-2 transition-all duration-300 ${isDayToday ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'text-muted-foreground'}`}>
                                        {format(day, 'd')}
                                    </span>
                                    {mainStatus && (
                                        <Badge className={`border-none text-[8px] font-bold h-4 px-1.5 leading-none uppercase tracking-tighter shadow-none ${mainStatus === 'Present' ? 'bg-emerald-500/10 text-emerald-600' :
                                            mainStatus === 'Half Day' ? 'bg-amber-500/10 text-amber-600' :
                                                mainStatus === 'Off' || mainStatus === 'Paid Off' ? 'bg-blue-500/10 text-blue-600' :
                                                    'bg-red-500/10 text-red-600'
                                            }`}>
                                            {dayRecords.length > 1 ? `${dayRecords.length} Records` : mainStatus}
                                        </Badge>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap gap-6 mt-8 justify-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Present</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Half Day</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Absent</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Off</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-700 shadow-[0_0_8px_rgba(4,120,87,0.4)]" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Paid Off</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
                <DialogContent className="md:max-w-3xl lg:w-6xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-primary" />
                            Attendance Details: {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : ''}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4">
                        {selectedDateRecords.length > 0 ? (
                            <div className="border border-border/50 rounded-xl overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="h-10 border-border">
                                            <TableHead className="font-bold text-[10px] uppercase tracking-widest px-6">User</TableHead>
                                            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Check In/Out</TableHead>
                                            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right px-6">Location</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedDateRecords.map((record) => (
                                            <TableRow key={record.id} className="border-border h-16">
                                                <TableCell className="px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-muted-foreground text-[10px]">
                                                            {record.user?.avatar_url ? (
                                                                <img src={record.user.avatar_url} className="w-full h-full rounded-full object-cover" />
                                                            ) : (
                                                                record.user?.name?.charAt(0) || '?'
                                                            )}
                                                        </div>
                                                        <span className="font-bold text-[13px]">{record.user?.name || 'Unknown User'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={`border-none text-[8px] font-bold h-4 px-1.5 uppercase ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-500' :
                                                        record.status === 'Half Day' ? 'bg-amber-50 text-amber-500' :
                                                            record.status === 'Off' || record.status === 'Paid Off' ? 'bg-blue-50 text-blue-500' :
                                                                'bg-red-50 text-red-500'
                                                        }`}>
                                                        {record.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold tabular-nums">
                                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                                        {formatISTTime(record.check_in)}
                                                        <span className="text-muted-foreground/20">/</span>
                                                        {formatISTTime(record.check_out)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right px-6">
                                                    <div className="flex flex-col items-end gap-1">
                                                        {record.check_in_location && (
                                                            <div className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground">
                                                                <MapPin className="w-2.5 h-2.5" />
                                                                In: {record.check_in_location.latitude.toFixed(4)}, {record.check_in_location.longitude.toFixed(4)}
                                                            </div>
                                                        )}
                                                        {record.check_out_location && (
                                                            <div className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground">
                                                                <MapPin className="w-2.5 h-2.5 text-blue-400" />
                                                                Out: {record.check_out_location.latitude.toFixed(4)}, {record.check_out_location.longitude.toFixed(4)}
                                                            </div>
                                                        )}
                                                        {!record.check_in_location && !record.check_out_location && (
                                                            <span className="text-[8px] font-bold text-muted-foreground/30 italic uppercase">No location data</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-12 text-center border border-dashed border-border rounded-xl">
                                <p className="text-muted-foreground/30 font-bold text-[10px] uppercase tracking-widest">No attendance records for this date</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
