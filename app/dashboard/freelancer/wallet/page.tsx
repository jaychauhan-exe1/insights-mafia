import { createAdminClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/get-profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Wallet, ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';
import { format } from 'date-fns';

export default async function WalletPage() {
    const profile = await getProfile();
    const supabase = await createAdminClient();

    if (!profile || profile.role !== 'Freelancer') return null;

    const { data: transactions } = await supabase
        .from('wallet_transactions')
        .select(`
            *,
            task:tasks(title)
        `)
        .eq('freelancer_id', profile.id)
        .order('created_at', { ascending: false });

    const balance = Number(profile.wallet_balance || 0);

    return (
        <div className="space-y-6 mx-auto pb-20 lg:pb-0">
            <header>
                <h2 className="text-xl font-bold tracking-tight text-foreground text-center sm:text-left">Earnings & Wallet</h2>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1 text-center sm:text-left">Manage your payouts and task earnings</p>
            </header>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Balance Card */}
                <Card className="md:col-span-1 border border-border/50 shadow-sm rounded-xl bg-primary text-white p-6 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 mb-2">Available Balance</p>
                        <h3 className="text-3xl font-bold tabular-nums">₹{balance.toLocaleString('en-IN')}</h3>
                    </div>

                    <div className="relative z-10 flex items-center gap-2 pt-4">
                        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                            <Wallet className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">INR - Rupee</span>
                    </div>

                    {/* Abstract Shapes */}
                    <div className="absolute right-[-20px] top-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl text-white" />
                </Card>

                {/* History Card */}
                <Card className="md:col-span-2 border border-border/50 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col">
                    <CardHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between bg-muted/30">
                        <h2 className="text-[10px] font-extrabold flex items-center gap-2 uppercase tracking-[0.2em] text-muted-foreground">
                            <History className="w-3.5 h-3.5 text-primary" /> Recent Transactions
                        </h2>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-x-auto">
                        <Table>
                            <TableBody>
                                {transactions?.map((tx) => (
                                    <TableRow key={tx.id} className="border-border group h-20 hover:bg-muted/30 transition-all duration-300">
                                        <TableCell className="px-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                                                    }`}>
                                                    {tx.type === 'credit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[13px] text-foreground leading-none">{tx.task?.title || tx.description || 'Payment'}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter mt-1">
                                                        {format(new Date(tx.created_at), 'MMM dd, yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <p className={`font-extrabold text-[14px] tabular-nums ${tx.type === 'credit' ? 'text-emerald-600' : 'text-foreground'
                                                }`}>
                                                {tx.type === 'credit' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-0.5">Verified</p>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!transactions || transactions.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-20">
                                            <p className="text-muted-foreground/30 font-bold text-[10px] uppercase tracking-widest italic">No financial activity recorded yet.</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
