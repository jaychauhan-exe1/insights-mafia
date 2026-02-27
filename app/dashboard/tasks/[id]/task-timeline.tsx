'use client';

import { Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface TaskTimelineProps {
    createdAt: string;
    assignedAt?: string | null;
    completedAt?: string | null;
    revisionAt?: string | null;
    deadline?: string | null;
}

export function TaskTimeline({ createdAt, assignedAt, completedAt, revisionAt, deadline }: TaskTimelineProps) {
    const events = [
        { label: 'Created', date: createdAt, icon: Calendar, color: 'text-gray-400', bg: 'bg-gray-50' },
        { label: 'Assigned', date: assignedAt, icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { label: 'Deadline', date: deadline, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
        { label: 'Revision', date: revisionAt, icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'Completed', date: completedAt, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    ].filter(e => e.date);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {events.map((event) => (
                <div key={event.label} className={`flex items-center gap-3 p-4 rounded-lg ${event.bg} border border-white shadow-sm`}>
                    <div className={`w-10 h-10 rounded-xl ${event.bg} flex items-center justify-center ${event.color} border border-white shadow-sm`}>
                        <event.icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{event.label}</p>
                        <p className="text-sm font-bold text-gray-700">
                            {format(new Date(event.date!), 'MMM dd, HH:mm')}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
