'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IndianRupee, Plus, Trash2, Pencil, Check, X, Loader2, RefreshCw } from 'lucide-react';
import { upsertMonthlyExpense, deleteMonthlyExpense, getMonthlyExpenses, syncAutoExpenses, MonthlyExpense } from './expense-actions';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface Props {
    initialExpenses: MonthlyExpense[];
    currentMonth: string; // YYYY-MM (from URL searchParams)
}

export function ExpenseTracker({ initialExpenses, currentMonth: monthStr }: Props) {
    const [expenses, setExpenses] = useState<MonthlyExpense[]>(initialExpenses);
    const [isFetching, setIsFetching] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [showAddRow, setShowAddRow] = useState(false);

    const monthExpenses = expenses.filter(e => e.month === monthStr);
    const grandTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const displayDate = parseISO(`${monthStr}-01`);

    // Effect to update local state when month changes (prop changes)
    useEffect(() => {
        setExpenses(initialExpenses);
    }, [initialExpenses]);

    const fetchMonth = useCallback(async (month: string) => {
        setIsFetching(true);
        try {
            const data = await getMonthlyExpenses(month);
            setExpenses(prev => [
                ...prev.filter(e => e.month !== month),
                ...data,
            ]);
        } catch {
            toast.error('Failed to load expenses');
        } finally {
            setIsFetching(false);
        }
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        const res = await syncAutoExpenses(monthStr);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success('Synced with latest data');
            await fetchMonth(monthStr);
        }
        setIsSyncing(false);
    };

    const startEdit = (e: MonthlyExpense) => { setEditingId(e.id); setEditLabel(e.category); setEditAmount(String(e.amount)); };
    const cancelEdit = () => { setEditingId(null); setEditLabel(''); setEditAmount(''); };

    const saveEdit = (entry: MonthlyExpense) => {
        if (!editLabel.trim()) return;
        const amount = parseFloat(editAmount) || 0;
        startTransition(async () => {
            const res = await upsertMonthlyExpense(monthStr, editLabel.trim(), amount, entry.is_auto);
            if (res.error) { toast.error(res.error); return; }
            setExpenses(prev => prev.map(e => e.id === entry.id ? { ...e, category: editLabel.trim(), amount } : e));
            cancelEdit();
            toast.success('Updated');
        });
    };

    const addEntry = () => {
        if (!newLabel.trim()) return;
        const amount = parseFloat(newAmount) || 0;
        startTransition(async () => {
            const res = await upsertMonthlyExpense(monthStr, newLabel.trim(), amount, false);
            if (res.error) { toast.error(res.error); return; }
            await fetchMonth(monthStr);
            setNewLabel(''); setNewAmount(''); setShowAddRow(false);
            toast.success('Added');
        });
    };

    const removeEntry = (id: string) => {
        startTransition(async () => {
            const res = await deleteMonthlyExpense(id);
            if (res.error) { toast.error(res.error); return; }
            setExpenses(prev => prev.filter(e => e.id !== id));
            toast.success('Removed');
        });
    };

    const autoRows = monthExpenses.filter(e => e.is_auto);
    const customRows = monthExpenses.filter(e => !e.is_auto);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Expense Breakdown</h3>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                        Manage all outflows for {format(displayDate, 'MMMM yyyy')}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 text-[10px] font-medium uppercase tracking-wider border-primary/20 text-primary hover:bg-primary/5"
                    onClick={handleSync}
                    disabled={isSyncing}
                >
                    {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Sync Category Totals
                </Button>
            </div>

            <Card className="border border-border/50 shadow-sm rounded-xl overflow-hidden bg-white">
                {isFetching ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/30" />
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {autoRows.map(entry => (
                            <div key={entry.id} className="flex items-center justify-between px-6 py-4 bg-muted/20 group">
                                {editingId === entry.id ? (
                                    <div className="flex items-center gap-3 flex-1 mr-4">
                                        <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="h-8 text-[12px] font-medium flex-1" />
                                        <div className="relative w-32">
                                            <IndianRupee className="absolute left-2.5 top-2 w-3 h-3 text-muted-foreground" />
                                            <Input value={editAmount} onChange={e => setEditAmount(e.target.value)} className="h-8 text-[12px] font-medium pl-6" type="number" min="0" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[12px] font-semibold text-foreground">{entry.category}</span>
                                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">Auto</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    {editingId === entry.id ? (
                                        <>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-emerald-600" onClick={() => saveEdit(entry)} disabled={isPending}>
                                                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={cancelEdit}><X className="w-3.5 h-3.5" /></Button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-[13px] font-semibold text-primary tabular-nums">₹{Number(entry.amount).toLocaleString('en-IN')}</span>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary" onClick={() => startEdit(entry)}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {customRows.map(entry => (
                            <div key={entry.id} className="flex items-center justify-between px-6 py-4 group hover:bg-muted/10 transition-colors">
                                {editingId === entry.id ? (
                                    <div className="flex items-center gap-3 flex-1 mr-4">
                                        <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="h-8 text-[12px] font-medium flex-1" />
                                        <div className="relative w-32">
                                            <IndianRupee className="absolute left-2.5 top-2 w-3 h-3 text-muted-foreground" />
                                            <Input value={editAmount} onChange={e => setEditAmount(e.target.value)} className="h-8 text-[12px] font-medium pl-6" type="number" min="0" />
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-[12px] font-semibold text-foreground">{entry.category}</span>
                                )}
                                <div className="flex items-center gap-2">
                                    {editingId === entry.id ? (
                                        <>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-emerald-600" onClick={() => saveEdit(entry)} disabled={isPending}>
                                                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={cancelEdit}><X className="w-3.5 h-3.5" /></Button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-[13px] font-semibold text-orange-500 tabular-nums">₹{Number(entry.amount).toLocaleString('en-IN')}</span>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary" onClick={() => startEdit(entry)}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500" onClick={() => removeEntry(entry.id)} disabled={isPending}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {showAddRow ? (
                            <div className="flex items-center gap-3 px-6 py-4">
                                <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} className="h-8 text-[12px] font-medium flex-1" placeholder="Category label..." autoFocus
                                    onKeyDown={e => { if (e.key === 'Enter') addEntry(); if (e.key === 'Escape') setShowAddRow(false); }} />
                                <div className="relative w-32">
                                    <IndianRupee className="absolute left-2.5 top-2 w-3 h-3 text-muted-foreground" />
                                    <Input value={newAmount} onChange={e => setNewAmount(e.target.value)} className="h-8 text-[12px] font-medium pl-6" type="number" min="0" placeholder="0"
                                        onKeyDown={e => { if (e.key === 'Enter') addEntry(); }} />
                                </div>
                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-emerald-600 hover:bg-emerald-50" onClick={addEntry} disabled={isPending}>
                                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => setShowAddRow(false)}><X className="w-3.5 h-3.5" /></Button>
                            </div>
                        ) : (
                            <div className="px-6 py-3">
                                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary gap-2" onClick={() => setShowAddRow(true)}>
                                    <Plus className="w-3.5 h-3.5" /> Add Expense
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center justify-between px-6 py-5 bg-foreground/5">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Total Month Outflow</span>
                            <span className="text-[16px] font-bold text-foreground tabular-nums">₹{grandTotal.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
