import { createAdminClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/get-profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    Calendar,
    MessageSquare,
    CheckCircle2,
    Clock,
    AlertCircle,
    IndianRupee,
    Briefcase,
    ExternalLink,
    StickyNote
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import Image from 'next/image';
import { updateTaskStatus } from '../actions';
import { ReviewTaskDialog } from '../review-task-dialog';
import { AdminStatusSelect } from '../admin-status-select';
import { SubmitTaskModal } from './submit-task-modal';
import { TaskTimelineToggle } from './task-timeline-toggle';

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const profile = await getProfile();
    const supabase = await createAdminClient();

    if (!profile) return null;

    const { data: task } = await supabase
        .from('tasks')
        .select(`
            *,
            assignee:profiles!tasks_assignee_id_fkey(*),
            client:clients(*)
        `)
        .eq('id', id)
        .single();

    if (!task) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center text-red-500">
                <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold">Task not found</h2>
            <Link href="/dashboard/tasks">
                <Button variant="outline" className="rounded-xl">Back to Tasks</Button>
            </Link>
        </div>
    );

    return (
        <div className="mx-auto space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ">
                <Link href="/dashboard/tasks" className="w-[40em] flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 font-bold text-[10px] tracking-widest uppercase group">
                    <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
                    Back to tasks
                </Link>
                <TaskTimelineToggle
                    createdAt={task.created_at}
                    assignedAt={task.assigned_at}
                    completedAt={task.completed_at}
                    revisionAt={task.revision_at}
                    deadline={task.deadline}
                />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-xl border border-border/50 shadow-sm">
                <div className="space-y-4 w-full">
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge className={`border-none font-bold text-[9px] rounded-md px-2.5 h-5 flex items-center gap-1.5 uppercase tracking-widest transition-all duration-300 ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                            task.status === 'Review' ? 'bg-indigo-50 text-indigo-600' :
                                task.status === 'Revision' ? 'bg-orange-50 text-orange-600' : 'bg-muted text-muted-foreground'
                            }`}>
                            {task.status === 'Completed' ? <CheckCircle2 className="w-3 h-3" /> : task.status === 'Review' ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {task.status}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] whitespace-nowrap">ID: {task.id.slice(0, 8)}</span>
                        {task.client && (
                            <Badge variant="outline" className="rounded-md px-2 h-5 font-bold text-[9px] border-primary/20 text-primary bg-primary/5 uppercase tracking-tight">
                                <Briefcase className="w-2.5 h-2.5 mr-1" />
                                {task.client.name}
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-none">{task.title}</h1>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
                        <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground/40" />
                            {format(new Date(task.created_at), 'MMM dd, yyyy')}
                        </div>
                        {task.deadline && (
                            <div className="flex items-center gap-2 text-red-500 font-bold text-[10px] uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
                                <Clock className="w-3 h-3" />
                                Deadline: {format(new Date(task.deadline), 'MMM dd, HH:mm')}
                            </div>
                        )}
                        {profile.role !== 'Employee' && task.payment_amount && (
                            <div className="flex items-center gap-1.5 text-primary font-bold text-[13px] bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10">
                                <IndianRupee className="w-3.5 h-3.5" />
                                {task.payment_amount.toLocaleString('en-IN')}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-end">
                    {profile.role === 'Admin' && (
                        <div className="w-[140px]">
                            <AdminStatusSelect taskId={task.id} currentStatus={task.status} />
                        </div>
                    )}
                    {profile.role === 'Admin' && task.status === 'Review' && (
                        <ReviewTaskDialog taskId={task.id} taskTitle={task.title} />
                    )}
                    {(profile.id === task.assignee_id) && (task.status === 'Pending' || task.status === 'Revision') && (
                        <SubmitTaskModal
                            taskId={task.id}
                            buttonText={profile.role === 'Employee' ? 'Mark as Done' : (task.status === 'Revision' ? 'Correct & Submit' : 'Send for Review')}
                        />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Details Column */}
                <Card className="md:col-span-2 border border-border/50 shadow-sm rounded-xl bg-white overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b border-border/50 bg-muted/30 flex flex-row items-center gap-2.5">
                        <StickyNote className="w-4 h-4 text-muted-foreground/40" />
                        <h2 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-widest">Task Brief</h2>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-8">
                        <div className="text-sm text-foreground/80 leading-relaxed font-medium whitespace-pre-wrap">
                            {task.description || 'No brief provided for this task.'}
                        </div>

                        {task.reference_links && task.reference_links.length > 0 && (
                            <div className="space-y-4 pt-6">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-0.5">Reference Assets</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {task.reference_links.map((link: string, idx: number) => (
                                        <a
                                            key={idx}
                                            href={link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between p-3.5 rounded-lg bg-muted/20 border border-border/50 hover:bg-white hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center text-primary shadow-sm border border-border/40">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-[11px] font-bold text-muted-foreground truncate">{link}</span>
                                            </div>
                                            <ChevronLeft className="w-3 h-3 text-muted-foreground/30 rotate-180 group-hover:translate-x-0.5 transition-transform" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(task.submission_note || (task.submission_links && task.submission_links.length > 0)) && (
                            <div className="space-y-6 pt-8 border-t border-border/50">
                                <div className="flex items-center gap-2.5 text-emerald-600 font-bold text-sm uppercase tracking-widest">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Submission Logs
                                </div>
                                <div className="space-y-4">
                                    {task.submission_note && (
                                        <div className="bg-muted/30 p-5 rounded-lg border border-border/50 flex gap-3 text-sm italic">
                                            <p className="text-foreground/70 font-medium leading-relaxed whitespace-pre-wrap">
                                                "{task.submission_note}"
                                            </p>
                                        </div>
                                    )}
                                    {task.submission_links && task.submission_links.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {task.submission_links.map((link: string, idx: number) => (
                                                <a
                                                    key={idx}
                                                    href={link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center justify-between p-3.5 rounded-lg bg-indigo-50/50 border border-indigo-100/50 hover:bg-indigo-50 transition-all duration-300 group"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                                                        <span className="text-[11px] font-bold text-indigo-600 truncate">{link}</span>
                                                    </div>
                                                    <ChevronLeft className="w-3 h-3 text-indigo-300 rotate-180 group-hover:translate-x-0.5 transition-transform" />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {task.feedback && (
                            <div className="space-y-4 pt-8 border-t border-border/50">
                                <div className="flex items-center gap-2.5 text-orange-500 font-bold text-sm uppercase tracking-widest">
                                    <MessageSquare className="w-4 h-4" />
                                    Revision Note
                                </div>
                                <div className="bg-orange-50/50 p-5 rounded-lg border border-orange-100 flex gap-3 text-sm">
                                    <p className="text-orange-900 font-medium leading-relaxed italic">
                                        "{task.feedback}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <Card className="border border-border/50 shadow-sm rounded-xl bg-white p-6 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Assignee</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-muted shadow-sm border border-white overflow-hidden flex items-center justify-center font-bold text-lg text-muted-foreground">
                                    {task.assignee?.avatar_url ? (
                                        <Image src={task.assignee.avatar_url} alt="" width={48} height={48} unoptimized />
                                    ) : (
                                        task.assignee?.name?.charAt(0) || '?'
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-foreground text-sm tracking-tight">{task.assignee?.name || 'Unassigned'}</p>
                                    <p className="text-[9px] font-bold text-muted-foreground/50 tracking-widest uppercase mt-0.5">{task.assignee?.role || 'Team Member'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-border/50 space-y-3">

                            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                                <span className="text-muted-foreground/50">Progress</span>
                                <span className="text-foreground">{task.status}</span>
                            </div>
                        </div>
                    </Card>

                    {task.client && (
                        <Card className="border border-border/50 shadow-sm rounded-xl bg-foreground p-6 text-white space-y-5 overflow-hidden relative group">
                            <Briefcase className="absolute -right-2 -bottom-2 w-24 h-24 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-500" />
                            <div className="relative space-y-4">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 leading-none">Client</p>
                                <div className="space-y-1">
                                    <h4 className="text-lg font-bold leading-tight">{task.client.name}</h4>
                                    <p className="text-xs font-semibold text-white/60">{task.client.business}</p>
                                </div>
                                <Link href={`/dashboard/admin/clients/${task.client.id}`} className="block">
                                    <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold rounded-lg h-9 text-[10px] uppercase tracking-widest transition-all duration-300">
                                        Client Workspace
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
