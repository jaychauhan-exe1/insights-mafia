import { createAdminClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/get-profile';
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
import { format, startOfMonth } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AdminPaymentsPage() {
    const profile = await getProfile();
    const supabase = await createAdminClient();

    if (!profile || profile.role !== 'Admin') return null;

    const now = new Date();
    const monthName = format(now, 'MMMM yyyy');

    // Fetch data for both freelancers and employees
    const [
        freelancersRes,
        allTransactionsRes,
        employeesRes,
        attendanceRes,
        leaveRequestsRes,
        firstAttendanceRes
    ] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'Freelancer'),
        supabase.from('wallet_transactions').select('*'),
        supabase.from('profiles').select('*').eq('role', 'Employee').order('name'),
        supabase.from('attendance')
            .select('user_id, date, status')
            .gte('date', startOfMonth(now).toISOString().split('T')[0]),
        supabase.from('leave_requests')
            .select('*')
            .gte('date', startOfMonth(now).toISOString().split('T')[0]),
        supabase.from('attendance')
            .select('user_id, date')
            .order('date', { ascending: true })
    ]);

    // Freelancer data
    const freelancers = freelancersRes.data || [];
    const allTransactions = allTransactionsRes.data || [];
    const freelancerBalances = freelancers?.map(f => ({
        ...f,
        balance: Number(f.wallet_balance || 0)
    })) || [];

    // Employee data
    const employees = employeesRes.data || [];
    const attendance = attendanceRes.data || [];
    const leaveRequests = leaveRequestsRes.data || [];
    const firstCheckins = firstAttendanceRes.data || [];

    const salaryData = employees.map(emp => {
        const empAttendance = attendance.filter(a => a.user_id === emp.id);
        const empLeaves = leaveRequests.filter(l => l.user_id === emp.id);
        const joiningDate = firstCheckins.find(a => a.user_id === emp.id)?.date;
        const calc = calculateSalary(Number(emp.salary || 0), Number(emp.deduction_amount || 0), empAttendance, empLeaves, joiningDate);
        return {
            ...emp,
            ...calc
        };
    });

    const totalFreelancerUnpaid = freelancerBalances.reduce((acc, curr) => acc + Math.max(0, curr.balance), 0);
    const totalEmployeeNet = salaryData.reduce((acc, curr) => acc + curr.finalSalary, 0);

    return (
        <div className="space-y-6 pb-20 lg:pb-0">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Financial Management</h2>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Manage payouts and salary across the team</p>
                </div>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-border/50">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Payout Layer Active</span>
                </div>
            </header>

            <Tabs defaultValue="employees" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8 bg-gray-100 pb-11 pt-2 px-3">
                    <TabsTrigger value="employees" className="font-medium py-2 text-[10px] uppercase tracking-widest">Employee Salary</TabsTrigger>
                    <TabsTrigger value="freelancers" className="font-medium py-2 text-[10px] uppercase tracking-widest">Freelancer Payouts</TabsTrigger>
                </TabsList>

                <TabsContent value="employees" className="space-y-6 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-6 border-border/50 bg-primary text-white shadow-xl relative overflow-hidden group">
                            <Banknote className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-500" />
                            <div className="relative z-10">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-1">Total Net Salary</p>
                                <h3 className="text-2xl font-bold tabular-nums">₹{totalEmployeeNet.toLocaleString('en-IN')}</h3>
                            </div>
                        </Card>
                        <Card className="p-6 border-border/50 bg-white shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Deductions</p>
                                <h3 className="text-2xl font-bold tabular-nums text-red-500">₹{salaryData.reduce((acc, s) => acc + s.totalDeduction, 0).toLocaleString('en-IN')}</h3>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-500/10" />
                        </Card>
                        <Card className="p-6 border-border/50 bg-white shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Active Employees</p>
                                <h3 className="text-2xl font-bold tabular-nums">{employees.length}</h3>
                            </div>
                            <Users className="w-8 h-8 text-muted/20" />
                        </Card>
                    </div>

                    <div className="hidden md:block">
                        <Card className="border border-border/50 shadow-sm rounded-xl overflow-hidden bg-white">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="border-border hover:bg-transparent h-12">
                                            <TableHead className="px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Employee</TableHead>
                                            <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Base Salary</TableHead>
                                            <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest text-center">Absences</TableHead>
                                            <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest text-center">Deductions</TableHead>
                                            <TableHead className="text-right px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Net Payable</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {salaryData.map((s) => (
                                            <TableRow key={s.id} className="border-border group h-20 hover:bg-muted/30 transition-all duration-300">
                                                <TableCell className="px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-muted border border-white flex items-center justify-center font-bold text-[10px] overflow-hidden">
                                                            {s.avatar_url ? <Image src={s.avatar_url} alt="" width={32} height={32} unoptimized /> : s.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[13px] text-foreground leading-none">{s.name}</p>
                                                            <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter mt-1">{s.joiningDate ? `Since ${format(new Date(s.joiningDate), 'MMM yyyy')}` : 'Full Month'}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-bold text-[12px]">₹{Number(s.salary || 0).toLocaleString('en-IN')}</TableCell>
                                                <TableCell className="text-center font-bold text-[12px] text-red-500">{s.absencesCount}</TableCell>
                                                <TableCell className="text-center font-bold text-[12px] text-red-400">₹{s.totalDeduction.toLocaleString('en-IN')}</TableCell>
                                                <TableCell className="text-right px-6">
                                                    <p className="text-[14px] font-bold text-primary">₹{s.finalSalary.toLocaleString('en-IN')}</p>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </div>

                    {/* Mobile Card View */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {salaryData.map((s) => (
                            <Card key={s.id} className="p-5 border-border/50 shadow-sm bg-white space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-muted border border-white flex items-center justify-center font-bold text-[12px] overflow-hidden">
                                            {s.avatar_url ? <Image src={s.avatar_url} alt="" width={40} height={40} unoptimized /> : s.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[14px] text-foreground leading-none">{s.name}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter mt-1.5">{s.joiningDate ? `Since ${format(new Date(s.joiningDate), 'MMM yyyy')}` : 'Full Month'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[14px] font-bold text-primary tabular-nums">₹{s.finalSalary.toLocaleString('en-IN')}</p>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Net Pay</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
                                    <div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Base</p>
                                        <p className="text-[11px] font-bold text-foreground">₹{Number(s.salary || 0).toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Absences</p>
                                        <p className="text-[11px] font-bold text-red-500">{s.absencesCount}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Penalty</p>
                                        <p className="text-[11px] font-bold text-red-400">₹{s.totalDeduction.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="freelancers" className="space-y-6 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border border-border/50 shadow-xl rounded-xl p-6 bg-emerald-500 text-white flex items-center justify-between overflow-hidden relative group">
                            <IndianRupee className="absolute -right-4 -bottom-4 w-24 h-24 text-white/20 rotate-12 group-hover:scale-110 transition-transform duration-500" />
                            <div className="relative z-10">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 mb-1">Total Unpaid Balance</p>
                                <h3 className="text-2xl font-bold tabular-nums">₹{totalFreelancerUnpaid.toLocaleString('en-IN')}</h3>
                            </div>
                        </Card>
                        <Card className="border border-border/50 shadow-sm rounded-xl p-6 bg-white flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Payouts Done</p>
                                <h3 className="text-2xl font-bold tabular-nums text-foreground">
                                    ₹{allTransactions?.filter(t => t.type === 'debit').reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString('en-IN') || 0}
                                </h3>
                            </div>
                            <ArrowUpRight className="w-8 h-8 text-emerald-500/10" />
                        </Card>
                        <Card className="border border-border/50 shadow-sm rounded-xl p-6 bg-white flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Verified Freelancers</p>
                                <h3 className="text-2xl font-bold tabular-nums text-foreground">{freelancers.length}</h3>
                            </div>
                            <Users className="w-8 h-8 text-muted/30" />
                        </Card>
                    </div>

                    <div className="hidden md:block">
                        <Card className="border border-border/50 shadow-sm rounded-xl overflow-hidden bg-white">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="border-border hover:bg-transparent h-12">
                                            <TableHead className="px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Freelancer</TableHead>
                                            <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Available Balance</TableHead>
                                            <TableHead className="text-right px-6 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {freelancerBalances.map((f) => (
                                            <TableRow key={f.id} className="border-border group h-20 hover:bg-muted/30 transition-all duration-300">
                                                <TableCell className="px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-muted border border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-xs text-muted-foreground uppercase tracking-tighter">
                                                            {f.avatar_url ? <Image src={f.avatar_url} alt="" width={32} height={32} unoptimized /> : f.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[13px] text-foreground leading-none">{f.name}</p>
                                                            <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter mt-1">{f.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className={`font-bold text-[14px] tabular-nums ${f.balance > 0 ? 'text-primary' : 'text-muted-foreground/30'}`}>
                                                        ₹{f.balance.toLocaleString('en-IN')}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-right px-6">
                                                    {f.balance > 0 ? (
                                                        <PayoutDialog freelancerId={f.id} freelancerName={f.name} balance={f.balance} />
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest px-3">Settled</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </div>

                    {/* Mobile Card View */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {freelancerBalances.map((f) => (
                            <Card key={f.id} className="p-5 border-border/50 shadow-sm bg-white space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-muted border border-white flex items-center justify-center font-bold text-[12px] overflow-hidden">
                                            {f.avatar_url ? <Image src={f.avatar_url} alt="" width={40} height={40} unoptimized /> : f.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[14px] text-foreground leading-none">{f.name}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter mt-1.5 truncate max-w-[120px]">{f.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[14px] font-bold tabular-nums ${f.balance > 0 ? 'text-primary' : 'text-muted-foreground/30'}`}>
                                            ₹{f.balance.toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Balance</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-border/50">
                                    {f.balance > 0 ? (
                                        <PayoutDialog freelancerId={f.id} freelancerName={f.name} balance={f.balance} />
                                    ) : (
                                        <Button disabled className="w-full bg-muted/30 text-muted-foreground/50 font-bold text-[10px] uppercase tracking-widest h-10 rounded-xl cursor-not-allowed">
                                            Balance Settled
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

