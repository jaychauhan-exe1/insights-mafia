'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { updateTaskStatus } from './actions';
import { toast } from 'sonner';
import { TaskStatus } from '@/types/database';

export function AdminStatusSelect({ taskId, currentStatus }: { taskId: string, currentStatus: TaskStatus }) {
    const statuses: TaskStatus[] = ["Pending", "Review", "Revision", "Completed"];

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === currentStatus) return;

        try {
            const res = await updateTaskStatus(taskId, newStatus as TaskStatus);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`Status updated to ${newStatus}`);
            }
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Review': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'Revision': return 'bg-orange-50 text-orange-600 border-orange-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <Select onValueChange={handleStatusChange} defaultValue={currentStatus}>
            <SelectTrigger className={`h-8 border rounded-lg focus:ring-1 focus:ring-primary/10 transition-all duration-300 font-bold text-[10px] uppercase tracking-wider px-3 ${getStatusStyles(currentStatus)}`}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-100 shadow-xl overflow-hidden">
                {statuses.map((status) => (
                    <SelectItem key={status} value={status} className={`rounded-lg py-2 my-1 mx-1 font-bold text-[10px] uppercase tracking-wider ${getStatusStyles(status)} data-[state=checked]:opacity-100 opacity-60 hover:opacity-100 transition-opacity`}>
                        {status}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
