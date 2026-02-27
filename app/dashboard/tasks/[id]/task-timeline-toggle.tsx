'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { TaskTimeline } from './task-timeline';

interface TaskTimelineToggleProps {
    createdAt: string;
    assignedAt?: string | null;
    completedAt?: string | null;
    revisionAt?: string | null;
    deadline?: string | null;
}

export function TaskTimelineToggle(props: TaskTimelineToggleProps) {
    const [showTimeline, setShowTimeline] = useState(false);

    return (
        <div className="flex flex-col items-start md:items-end gap-3 w-full">
            <Button
                variant="outline"
                onClick={() => setShowTimeline(!showTimeline)}
                className="h-9 rounded-full px-4 border-gray-100 bg-white shadow-sm hover:bg-gray-50 transition-all gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500"
            >
                {showTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {showTimeline ? 'Hide History' : 'Show History'}
                {!showTimeline && <ChevronDown className="w-3.5 h-3.5" />}
            </Button>

            {showTimeline && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 w-full">
                    <TaskTimeline {...props} />
                </div>
            )}
        </div>
    );
}
