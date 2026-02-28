'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon, Users, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskFiltersProps {
    users?: any[];
    showAssignee?: boolean;
    showStatus?: boolean;
}

export function TaskFilters({ users = [], showAssignee = true, showStatus = true }: TaskFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const year = searchParams.get('year') || '';
    const month = searchParams.get('month') || '';
    const day = searchParams.get('day') || '';
    const assignee = searchParams.get('assignee') || '';
    const status = searchParams.get('status') || '';

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
    const months = [
        { label: 'January', value: '1' },
        { label: 'February', value: '2' },
        { label: 'March', value: '3' },
        { label: 'April', value: '4' },
        { label: 'May', value: '5' },
        { label: 'June', value: '6' },
        { label: 'July', value: '7' },
        { label: 'August', value: '8' },
        { label: 'September', value: '9' },
        { label: 'October', value: '10' },
        { label: 'November', value: '11' },
        { label: 'December', value: '12' },
    ];

    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

    const updateFilter = (newParams: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(newParams).forEach(([key, value]) => {
            if (value && value !== '0') {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push(window.location.pathname);
    };

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Date Filters */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-border shadow-sm">
                <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground/50" />

                <Select value={year} onValueChange={(v) => updateFilter({ year: v })}>
                    <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0 w-[80px] text-xs font-bold text-foreground">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>

                <div className="w-px h-4 bg-border mx-1" />

                <Select value={month} onValueChange={(v) => updateFilter({ month: v })}>
                    <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0 w-[100px] text-xs font-bold text-foreground">
                        <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">All Months</SelectItem>
                        {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                </Select>

                <div className="w-px h-4 bg-border mx-1" />

                <Select value={day} onValueChange={(v) => updateFilter({ day: v })}>
                    <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0 w-[80px] text-xs font-bold text-foreground">
                        <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">All Days</SelectItem>
                        {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Assignee Filter */}
            {showAssignee && (
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-border shadow-sm">
                    <Users className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <Select value={assignee} onValueChange={(v) => updateFilter({ assignee: v })}>
                        <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0 w-[130px] text-xs font-bold text-foreground">
                            <SelectValue placeholder="Assignee" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            <SelectItem value="0">All Team</SelectItem>
                            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Status Filter */}
            {showStatus && (
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-border shadow-sm">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <Select value={status} onValueChange={(v) => updateFilter({ status: v })}>
                        <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0 w-[110px] text-xs font-bold text-foreground">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">All Status</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Review">Review</SelectItem>
                            <SelectItem value="Revision">Revision</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {(year || month || day || assignee || status) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-muted-foreground hover:text-red-500 font-bold text-[10px] uppercase tracking-widest gap-1.5 transition-colors">
                    <X className="w-3.5 h-3.5" />
                    Clear
                </Button>
            )}
        </div>
    );
}
