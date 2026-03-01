'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sun, Loader2 } from 'lucide-react';
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
    isFuture,
    parseISO,
} from 'date-fns';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { MapPin, Clock } from 'lucide-react';
import { formatISTTime, getISTToday } from '@/lib/date-utils';
import { markHoliday, removeHoliday, updateAttendanceStatus } from './actions';
import { toast } from 'sonner';

interface AttendanceRecord {
    id: string;
    date: string;
    user_id: string;
    check_in?: string | null;
    check_out?: string | null;
    status: string;
    check_in_location?: { latitude: number; longitude: number } | null;
    check_out_location?: { latitude: number; longitude: number } | null;
    user?: {
        id: string;
        name: string;
        avatar_url?: string | null;
        role: string;
    };
}

interface Holiday {
    id: string;
    date: string;
    label: string;
}

const STATUS_OPTIONS = ['Present', 'Absent', 'Half Day', 'Paid Off', 'Holiday'];

export function AdminAttendanceCalendar({
    records: initialRecords,
    holidays: initialHolidays,
}: {
    records: AttendanceRecord[];
    holidays: Holiday[];
}) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [records, setRecords] = useState(initialRecords);
    const [holidays, setHolidays] = useState(initialHolidays);
    const [holidayLabel, setHolidayLabel] = useState('Holiday');
    const [isPending, startTransition] = useTransition();
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const isAfterCheckoutWindow = (date: string) => date < getISTToday();

    const getRecordsForDay = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return records.map(r => {
            if (r.date === dateStr && r.status === 'Present' && !r.check_out && isAfterCheckoutWindow(r.date)) {
                return { ...r, status: 'Absent' };
            }
            return r;
        }).filter(r => r.date === dateStr);
    };

    const getHolidayForDay = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return holidays.find(h => h.date === dateStr);
    };

    const getMainStatus = (day: Date) => {
        const holiday = getHolidayForDay(day);
        if (holiday) return 'Holiday';
        const dayRecords = getRecordsForDay(day);
        if (dayRecords.length === 0) return null;
        if (dayRecords.some(r => r.status === 'Present')) return 'Present';
        if (dayRecords.some(r => r.status === 'Half Day')) return 'Half Day';
        return dayRecords[0].status;
    };

    const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
    const selectedRecords = selectedDate ? getRecordsForDay(selectedDate) : [];
    const selectedHoliday = selectedDate ? getHolidayForDay(selectedDate) : null;
    const isFutureOrToday = selectedDate ? (isFuture(selectedDate) || isToday(selectedDate)) : false;

    const handleMarkHoliday = () => {
        if (!selectedDate) return;
        startTransition(async () => {
            const res = await markHoliday(selectedDateStr, holidayLabel || 'Holiday');
            if (res.error) {
                toast.error(res.error);
            } else {
                const newH: Holiday = { id: Date.now().toString(), date: selectedDateStr, label: holidayLabel || 'Holiday' };
                setHolidays(prev => [...prev.filter(h => h.date !== selectedDateStr), newH]);
                toast.success(`${selectedDateStr} marked as holiday`);
            }
        });
    };

    const handleRemoveHoliday = () => {
        if (!selectedDate) return;
        startTransition(async () => {
            const res = await removeHoliday(selectedDateStr);
            if (res.error) {
                toast.error(res.error);
            } else {
                setHolidays(prev => prev.filter(h => h.date !== selectedDateStr));
                toast.success('Holiday removed');
            }
        });
    };

    const handleStatusChange = (recordId: string, newStatus: string, userId: string) => {
        setUpdatingId(recordId);
        startTransition(async () => {
            // If setting to Paid Off, check if they have balance left this month
            if (newStatus === 'Paid Off') {
                const monthStr = format(selectedDate!, 'yyyy-MM');
                const userRecords = records.filter(r =>
                    r.user_id === userId &&
                    format(parseISO(r.date), 'yyyy-MM') === monthStr
                );
                const paidUsed = userRecords.filter(r => r.status === 'Paid Off').length;
                if (paidUsed >= 1) { // 1 is the monthly limit
                    toast.error('User has no paid leaves left this month');
                    setUpdatingId(null);
                    return;
                }
            }

            const res = await updateAttendanceStatus(recordId, newStatus);
            if (res.error) {
                toast.error(res.error);
            } else {
                setRecords(prev => prev.map(r => r.id === recordId ? { ...r, status: newStatus } : r));
                toast.success('Status updated');
            }
            setUpdatingId(null);
        });
    };

    const statusColor = (status: string) => {
        if (status === 'Present') return 'bg-emerald-500/10 text-emerald-600';
        if (status === 'Half Day') return 'bg-amber-500/10 text-amber-600';
        if (status === 'Paid Off') return 'bg-blue-500/10 text-blue-600';
        if (status === 'Holiday') return 'bg-purple-500/10 text-purple-600';
        return 'bg-red-500/10 text-red-600';
    };

    return (
        <>
            <Card className="border border-border/50 shadow-sm rounded-xl bg-white overflow-hidden">
                <CardHeader className="p-6 md:p-8 border-b border-border/50 flex flex-row items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                            <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">{format(currentMonth, 'MMMM yyyy')}</h2>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Click any date to manage attendance</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-9 w-9 rounded-lg hover:bg-muted">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-9 w-9 rounded-lg hover:bg-muted">
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                    <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden bg-border/50 border border-border/50">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="bg-muted/50 py-3 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{d}</div>
                        ))}
                        {days.map((day, idx) => {
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isDayToday = isToday(day);
                            const mainStatus = getMainStatus(day);
                            const holiday = getHolidayForDay(day);

                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedDate(day)}
                                    className={`min-h-[80px] p-2 bg-white flex flex-col items-center justify-start transition-all cursor-pointer hover:bg-muted/30 ${!isCurrentMonth ? 'opacity-20' : ''} ${holiday ? 'bg-purple-50/40' : ''}`}
                                >
                                    <span className={`text-[12px] font-semibold flex items-center justify-center w-7 h-7 rounded-lg mb-1.5 transition-all duration-300 ${isDayToday ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 'text-muted-foreground'}`}>
                                        {format(day, 'd')}
                                    </span>
                                    {holiday ? (
                                        <Badge className="border-none text-[8px] font-bold h-4 px-1.5 bg-purple-500/10 text-purple-600 leading-none uppercase tracking-tighter shadow-none">
                                            {holiday.label}
                                        </Badge>
                                    ) : mainStatus && (
                                        <Badge className={`border-none text-[8px] font-bold h-4 px-1.5 leading-none uppercase tracking-tighter shadow-none ${statusColor(mainStatus)}`}>
                                            {mainStatus}
                                        </Badge>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-6 justify-center">
                        {[
                            { color: 'bg-emerald-500', label: 'Present' },
                            { color: 'bg-amber-500', label: 'Half Day' },
                            { color: 'bg-red-500', label: 'Absent' },
                            { color: 'bg-blue-500', label: 'Paid Off' },
                            { color: 'bg-purple-500', label: 'Holiday' },
                        ].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${color}`} />
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedDate} onOpenChange={open => !open && setSelectedDate(null)}>
                <DialogContent className="md:max-w-3xl max-h-[75vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-primary" />
                            {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : ''}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 space-y-5">
                        {/* Holiday Section — only for today or future dates */}
                        {isFutureOrToday && (
                            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Sun className="w-4 h-4 text-purple-500" />
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-700">Holiday Management</p>
                                </div>
                                {selectedHoliday ? (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{selectedHoliday.label}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Marked as holiday for all employees</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-red-500 hover:bg-red-50 font-bold text-[10px] uppercase"
                                            onClick={handleRemoveHoliday}
                                            disabled={isPending}
                                        >
                                            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Remove Holiday'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Input
                                            value={holidayLabel}
                                            onChange={e => setHolidayLabel(e.target.value)}
                                            placeholder="Holiday name (e.g. Diwali)"
                                            className="h-9 text-[12px] font-medium flex-1"
                                        />
                                        <Button
                                            size="sm"
                                            className="h-9 bg-purple-500 hover:bg-purple-600 text-white font-semibold text-[10px] uppercase tracking-wider whitespace-nowrap"
                                            onClick={handleMarkHoliday}
                                            disabled={isPending}
                                        >
                                            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Mark Holiday'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Attendance Records */}
                        {selectedRecords.length > 0 ? (
                            <div className="border border-border/50 rounded-xl overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="h-10 border-border">
                                            <TableHead className="font-semibold text-[10px] uppercase tracking-wider px-4">User</TableHead>
                                            <TableHead className="font-semibold text-[10px] uppercase tracking-wider">Time</TableHead>
                                            <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-right px-4">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedRecords.map(record => (
                                            <TableRow key={record.id} className="border-border h-16">
                                                <TableCell className="px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-[10px] overflow-hidden">
                                                            {record.user?.avatar_url ? (
                                                                <img src={record.user.avatar_url} className="w-full h-full rounded-full object-cover" />
                                                            ) : (
                                                                record.user?.name?.charAt(0) || '?'
                                                            )}
                                                        </div>
                                                        <span className="font-semibold text-[12px]">{record.user?.name || 'Unknown'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                                                        <Clock className="w-3 h-3" />
                                                        {formatISTTime(record.check_in) || '—'}
                                                        <span className="opacity-30">/</span>
                                                        {formatISTTime(record.check_out) || '—'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right px-4">
                                                    <Select
                                                        value={record.status}
                                                        onValueChange={val => handleStatusChange(record.id, val, record.user_id)}
                                                        disabled={updatingId === record.id}
                                                    >
                                                        <SelectTrigger className={`h-7 w-32 text-[10px] font-bold border-none rounded-lg ml-auto ${statusColor(record.status)} bg-opacity-100`}>
                                                            {updatingId === record.id ? (
                                                                <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                                            ) : (
                                                                <SelectValue />
                                                            )}
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {STATUS_OPTIONS.map(s => (
                                                                <SelectItem key={s} value={s} className="text-[11px] font-medium">{s}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-10 text-center border border-dashed border-border rounded-xl">
                                <p className="text-muted-foreground/30 font-bold text-[10px] uppercase tracking-widest">No attendance records for this date</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
