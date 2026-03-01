'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subMonths, addMonths, parseISO } from 'date-fns';

export function MonthFilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const month = searchParams.get('month') || format(new Date(), 'yyyy-MM');
    const [y, m] = month.split('-').map(Number);
    const currentDate = new Date(y, m - 1, 1);

    const navigate = (date: Date) => {
        const newMonth = format(date, 'yyyy-MM');
        const params = new URLSearchParams(searchParams.toString());
        params.set('month', newMonth);
        router.push(`?${params.toString()}`);
    };

    const MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const THIS_YEAR = new Date().getFullYear();
    const YEARS = Array.from({ length: 8 }, (_, i) => THIS_YEAR - 5 + i);

    return (
        <div className="flex items-center justify-between mb-8 p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                    <Calendar className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-foreground">{format(currentDate, 'MMMM yyyy')}</h2>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Filtering Finance Data</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg border border-border/50"
                    onClick={() => navigate(subMonths(currentDate, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <select
                    value={currentDate.getMonth()}
                    onChange={e => navigate(new Date(currentDate.getFullYear(), Number(e.target.value), 1))}
                    className="h-9 rounded-lg border border-border/50 bg-white text-[11px] font-medium px-3 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                    {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select
                    value={currentDate.getFullYear()}
                    onChange={e => navigate(new Date(Number(e.target.value), currentDate.getMonth(), 1))}
                    className="h-9 rounded-lg border border-border/50 bg-white text-[11px] font-medium px-3 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg border border-border/50"
                    onClick={() => navigate(addMonths(currentDate, 1))}>
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
