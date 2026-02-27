'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export function TaskDateFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentYear = searchParams.get('year') || '';
    const currentMonth = searchParams.get('month') || '';

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

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set('page', '1'); // Reset to page 1 on filter change
        router.push(`?${params.toString()}`);
    };

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('year');
        params.delete('month');
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />

                {/* Year Select */}
                <Select value={currentYear} onValueChange={(v) => updateFilter('year', v)}>
                    <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0 w-[100px] text-xs font-bold text-gray-700">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100">
                        {years.map((y) => (
                            <SelectItem key={y} value={y} className="text-xs font-medium">
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="w-px h-4 bg-gray-100 mx-1" />

                {/* Month Select */}
                <Select value={currentMonth} onValueChange={(v) => updateFilter('month', v)}>
                    <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0 w-[120px] text-xs font-bold text-gray-700">
                        <SelectValue placeholder="Month (All)" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100">
                        <SelectItem value="0" className="text-xs font-medium italic text-gray-400">All Months</SelectItem>
                        {months.map((m) => (
                            <SelectItem key={m.value} value={m.value} className="text-xs font-medium">
                                {m.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(currentYear || currentMonth) && (
                    <button
                        onClick={clearFilters}
                        className="p-1 hover:bg-gray-50 rounded-full transition-colors ml-2"
                    >
                        <X className="w-3.5 h-3.5 text-gray-300 hover:text-red-400" />
                    </button>
                )}
            </div>
        </div>
    );
}
