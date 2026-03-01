import { createAdminClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/get-profile';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { IndianRupee, Users, ArrowUpRight, ShieldCheck, Banknote, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PayoutDialog } from './payout-dialog';
import Image from 'next/image';
import { calculateSalary } from '@/lib/salary-utils';
import { format, startOfMonth, endOfMonth, parseISO, isFuture } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseTracker } from './expense-tracker';
import { MonthFilterBar } from './month-filter-bar';
import { Badge } from '@/components/ui/badge';

interface Props {
    searchParams: Promise<{ month?: string; tab?: string }>;
}

export default async function AdminPaymentsPage({ searchParams }: Props) {
    const sp = await searchParams;
    const profile = await getProfile();
    const supabase = await createAdminClient();

    if (!profile || profile.role !== 'Admin') return null;

    const currentYearMonth = sp.month || format(new Date(), 'yyyy-MM');
    const activeTab = sp.tab || 'employees';
    const displayMonth = parseISO(`${currentYearMonth}-01`);
    const monthStartStr = format(startOfMonth(displayMonth), 'yyyy-MM-dd');
    const monthEndStr = format(endOfMonth(displayMonth), 'yyyy-MM-dd');

    // Fetch data for the selected month
    const [
        freelancersRes,
        allTransactionsRes,
        employeesRes,
        attendanceRes,
        leaveRequestsRes,
        firstAttendanceRes,
        initialExpensesRes,
        paymentHistoryRes,
    ] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'Freelancer'),
        supabase.from('wallet_transactions').select('*')
            .gte('created_at', `${monthStartStr}T00:00:00Z`)
            .lte('created_at', `${monthEndStr}T23:59:59Z`),
        supabase.from('profiles').select('*').eq('role', 'Employee').order('name'),
        supabase.from('attendance').select('user_id, date, status')
            .gte('date', monthStartStr)
            .lte('date', monthEndStr),
        supabase.from('leave_requests').select('*')
            .gte('date', monthStartStr)
            .lte('date', monthEndStr),
        supabase.from('attendance').select('user_id, date').order('date', { ascending: true }),
        supabase.from('monthly_expenses').select('*')
            .eq('month', currentYearMonth)
            .order('is_auto', { ascending: false })
            .order('created_at', { ascending: true }),
        supabase.from('payment_history').select('*')
            .eq('month', currentYearMonth),
    ]);

    const freelancers = freelancersRes.data || [];
    const allTransactions = allTransactionsRes.data || [];
    const initialExpenses = initialExpensesRes.data || [];
    const paymentHistory = (paymentHistoryRes as any)?.data || [];

    const isCurrentMonth = currentYearMonth === format(new Date(), 'yyyy-MM');
    const hasHistory = paymentHistory.length > 0;

    // FREELANCER PROCESSING
    const freelancerBalances = freelancers?.map(f => {
        const historyRecord = paymentHistory.find((h: any) => h.user_id === f.id && h.role === 'Freelancer');
        const monthCredits = historyRecord && !isCurrentMonth
            ? Number(historyRecord.net_amount)
            : allTransactions
                .filter(t => t.freelancer_id === f.id && t.type === 'credit')
                .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        return {
            ...f,
            monthlyEarned: monthCredits,
            balance: Number(f.wallet_balance || 0),
            isFromHistory: !!historyRecord && !isCurrentMonth
        };
    }) || [];

    // If we have history for a past month, we might want to show ONLY historical freelancers 
    // but the system usually has the same set. For now, keep live profiles but use historical earned.

    const employees = employeesRes.data || [];
    const attendance = attendanceRes.data || [];
    const leaveRequests = leaveRequestsRes.data || [];
    const firstCheckins = firstAttendanceRes.data || [];

    const salaryData = employees.map(emp => {
        const historyRecord = paymentHistory.find((h: any) => h.user_id === emp.id && h.role === 'Employee');

        if (hasHistory && !isCurrentMonth && historyRecord) {
            return {
                ...emp,
                finalSalary: Number(historyRecord.net_amount),
                totalDeduction: Number(historyRecord.deductions),
                absencesCount: historyRecord.meta?.absencesCount || 0,
                halfDaysConverted: historyRecord.meta?.halfDaysConverted || false,
                isFromHistory: true
            };
        }

        const empAttendance = attendance.filter(a => a.user_id === emp.id);
        const empLeaves = leaveRequests.filter(l => l.user_id === emp.id);
        const joiningDate = (firstCheckins as any[]).find(a => a.user_id === emp.id)?.date;
        const calc = calculateSalary(
            Number(emp.salary || 0),
            Number(emp.deduction_amount || 0),
            empAttendance,
            empLeaves,
            joiningDate,
            currentYearMonth
        );
        return {
            ...emp,
            ...calc,
            isFromHistory: false
        };
    });

    const isFutureMonth = isFuture(displayMonth);
    const hasActivityGlobally = salaryData.some(s => s.hasActivity) || freelancerBalances.some(f => f.monthlyEarned > 0) || initialExpenses.length > 0;
    const showEmptyState = (isFutureMonth || !hasActivityGlobally) && !isCurrentMonth;

    const totalFreelancerEarnedMonth = freelancerBalances.reduce((acc, curr) => acc + curr.monthlyEarned, 0);
    const totalEmployeeNet = salaryData.reduce((acc, curr) => acc + curr.finalSalary, 0);

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
                <div className="space-y-1.5">
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        Finance Hub
                        <span className="text-primary text-3xl leading-none">.</span>
                    </h1>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        Financial Operations Dashboard
                        <span className="inline-block w-4 h-[1px] bg-border/50"></span>
                    </p>
                </div>
            </header>

            {/* Global Month Selection for all Tabs */}
            <MonthFilterBar />

            {showEmptyState ? (
                <Card className="flex flex-col items-center justify-center py-24 border-dashed border-2 bg-muted/5">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                        <Calendar className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">No records for {format(displayMonth, 'MMMM yyyy')}</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xs text-center">
                        {isFutureMonth
                            ? "This month hasn't started yet. Check back once attendance and payments are logged."
                            : "We couldn't find any financial activity or attendance logs for this period."}
                    </p>
                    {!isFutureMonth && (
                        <div className="mt-8 flex gap-3">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`?month=${format(new Date(), 'yyyy-MM')}`}>Go to Current Month</Link>
                            </Button>
                        </div>
                    )}
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-6 border-border/50 bg-primary/5 hover:bg-primary/10 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Active Employees</p>
                                    <h3 className="text-xl font-bold">{employees.length}</h3>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-border/50 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                    <Banknote className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Employee Payroll</p>
                                    <h3 className="text-xl font-bold text-emerald-600 flex items-center">
                                        <IndianRupee className="w-5 h-5" />
                                        {totalEmployeeNet.toLocaleString('en-IN')}
                                    </h3>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-border/50 bg-blue-500/5 hover:bg-blue-500/10 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                    <ArrowUpRight className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Freelancer Earnings</p>
                                    <h3 className="text-xl font-bold text-blue-600 flex items-center">
                                        <IndianRupee className="w-5 h-5" />
                                        {totalFreelancerEarnedMonth.toLocaleString('en-IN')}
                                    </h3>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Tabs defaultValue={activeTab} value={activeTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 max-w-[500px] mb-8 bg-gray-100 h-11 px-1">
                            <TabsTrigger value="employees" className="py-2 text-[11px] font-medium uppercase tracking-wider" asChild>
                                <Link href={`?month=${currentYearMonth}&tab=employees`}>Employee Salary</Link>
                            </TabsTrigger>
                            <TabsTrigger value="freelancers" className="py-2 text-[11px] font-medium uppercase tracking-wider" asChild>
                                <Link href={`?month=${currentYearMonth}&tab=freelancers`}>Freelancer Payouts</Link>
                            </TabsTrigger>
                            <TabsTrigger value="all" className="py-2 text-[11px] font-medium uppercase tracking-wider" asChild>
                                <Link href={`?month=${currentYearMonth}&tab=all`}>All Expenses</Link>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="employees" className="space-y-6 outline-none">
                            <div className="bg-white rounded-2xl border border-border/50 overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="h-14 border-border/50 hover:bg-muted/50 transition-colors">
                                            <TableHead className="w-16 px-6"></TableHead>
                                            <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground px-6">Employee Info</TableHead>
                                            <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground text-center">Status</TableHead>
                                            <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground text-center">Base Salary</TableHead>
                                            <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground text-center">Deduction</TableHead>
                                            <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-primary text-right px-6">Net Salary</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {salaryData.map((emp) => (
                                            <TableRow key={emp.id} className="h-20 border-border/50 hover:bg-muted/30 transition-colors group">
                                                <TableCell className="px-6">
                                                    <div className="relative w-10 h-10 rounded-full bg-muted border-2 border-background shadow-sm overflow-hidden flex-shrink-0">
                                                        {emp.avatar_url ? (
                                                            <Image src={emp.avatar_url} alt={emp.name || ''} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center font-semibold text-muted-foreground uppercase text-[12px]">
                                                                {emp.name?.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <div className="space-y-1">
                                                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{emp.name}</p>
                                                        <p className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">{emp.email}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Badge variant="outline" className="text-[9px] font-medium h-5 border-border/50 bg-muted/30">
                                                            {emp.absencesCount} Absent Unit
                                                        </Badge>
                                                        {emp.halfDaysConverted && (
                                                            <Badge variant="outline" className="text-[9px] font-medium h-5 border-blue-100 bg-blue-50 text-blue-600">
                                                                {emp.isFromHistory ? 'Half Days Covered (Historical)' : 'Half Days Covered'}
                                                            </Badge>
                                                        )}
                                                        {emp.isFromHistory && (
                                                            <Badge variant="outline" className="text-[9px] font-medium h-5 border-amber-100 bg-amber-50 text-amber-600">
                                                                Record Processed
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-semibold text-sm tabular-nums">₹{Number(emp.salary || 0).toLocaleString('en-IN')}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1 text-red-500 font-semibold text-sm tabular-nums">
                                                        <span>-</span>
                                                        <span>₹{emp.totalDeduction.toLocaleString('en-IN')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right px-6">
                                                    <div className="text-lg font-bold text-primary tabular-nums">₹{emp.finalSalary.toLocaleString('en-IN')}</div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="freelancers" className="space-y-6 outline-none">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {freelancerBalances.map((freelancer) => (
                                    <Card key={freelancer.id} className="p-6 border-border/50 bg-white hover:border-primary/50 hover:shadow-xl transition-all duration-300 group">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-14 h-14 rounded-2xl bg-muted border-2 border-background shadow-lg overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    {freelancer.avatar_url ? (
                                                        <Image src={freelancer.avatar_url} alt={freelancer.name || ''} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-semibold text-muted-foreground uppercase text-lg">
                                                            {freelancer.name?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{freelancer.name}</p>
                                                    <p className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">{freelancer.email}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                                                    <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{format(displayMonth, 'MMM')} Earnings</p>
                                                    <p className="text-lg font-bold text-blue-600 flex items-center tabular-nums">
                                                        <IndianRupee className="w-4 h-4" />
                                                        {freelancer.monthlyEarned.toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                                                    <p className="text-[9px] font-medium text-primary uppercase tracking-wider mb-1">Unpaid Balance</p>
                                                    <p className="text-lg font-bold text-primary flex items-center tabular-nums">
                                                        <IndianRupee className="w-4 h-4" />
                                                        {freelancer.balance.toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            </div>

                                            {freelancer.balance > 0 ? (
                                                <PayoutDialog
                                                    freelancerId={freelancer.id}
                                                    freelancerName={freelancer.name || ''}
                                                    balance={freelancer.balance}
                                                />
                                            ) : (
                                                <Button disabled className="w-full bg-muted/30 text-muted-foreground/50 font-medium text-[10px] uppercase tracking-wider h-10 rounded-xl cursor-not-allowed">
                                                    Balance Settled
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="all" className="outline-none">
                            <ExpenseTracker
                                initialExpenses={initialExpenses as any}
                                currentMonth={currentYearMonth}
                            />
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
}

