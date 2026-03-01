"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/get-profile";
import { revalidatePath } from "next/cache";
import { calculateSalary } from "@/lib/salary-utils";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface MonthlyExpense {
  id: string;
  month: string;
  category: string;
  amount: number;
  is_auto: boolean;
}

/** Fetch all expenses for a given month */
export async function getMonthlyExpenses(
  month: string,
): Promise<MonthlyExpense[]> {
  const profile = await getProfile();
  if (!profile || profile.role !== "Admin") return [];

  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("monthly_expenses")
    .select("*")
    .eq("month", month)
    .order("is_auto", { ascending: false })
    .order("created_at", { ascending: true });

  return (data || []) as MonthlyExpense[];
}

/** Upsert a single expense row (create or update by month+category) */
export async function upsertMonthlyExpense(
  month: string,
  category: string,
  amount: number,
  is_auto: boolean = false,
): Promise<{ error?: string; id?: string }> {
  const profile = await getProfile();
  if (!profile || profile.role !== "Admin") return { error: "Unauthorized" };

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("monthly_expenses")
    .upsert(
      {
        month,
        category,
        amount,
        is_auto,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "month,category" },
    )
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/payments");
  return { id: data.id };
}

/** Delete a custom expense row by ID */
export async function deleteMonthlyExpense(
  id: string,
): Promise<{ error?: string }> {
  const profile = await getProfile();
  if (!profile || profile.role !== "Admin") return { error: "Unauthorized" };

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("monthly_expenses")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/payments");
  return {};
}

/** Calculate and save auto rows (Employee Salaries + Freelancer Payouts) for a month */
export async function syncAutoExpenses(
  month: string,
): Promise<{ error?: string }> {
  const profile = await getProfile();
  if (!profile || profile.role !== "Admin") return { error: "Unauthorized" };

  const supabase = await createAdminClient();

  const monthStart = `${month}-01`;
  const monthEnd = format(endOfMonth(new Date(`${month}-01`)), "yyyy-MM-dd");

  const [
    employeesRes,
    attendanceRes,
    leaveRequestsRes,
    firstCheckinRes,
    transactionsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, salary, deduction_amount")
      .eq("role", "Employee"),
    supabase
      .from("attendance")
      .select("user_id, date, status")
      .gte("date", monthStart)
      .lte("date", monthEnd),
    supabase
      .from("leave_requests")
      .select("user_id, date, status, will_work_sunday")
      .gte("date", monthStart)
      .lte("date", monthEnd),
    supabase
      .from("attendance")
      .select("user_id, date")
      .order("date", { ascending: true }),
    supabase
      .from("wallet_transactions")
      .select("freelancer_id, amount, type, created_at, profiles(*)")
      .eq("type", "credit")
      .gte("created_at", `${monthStart}T00:00:00Z`)
      .lte("created_at", `${monthEnd}T23:59:59Z`),
  ]);

  const employees = employeesRes.data || [];
  const attendance = attendanceRes.data || [];
  const leaveRequests = leaveRequestsRes.data || [];
  const firstCheckins = firstCheckinRes.data || [];
  const transactions = transactionsRes.data || [];

  const totalEmployeeSalary = employees.reduce((sum, emp) => {
    const empAttendance = attendance.filter((a) => a.user_id === emp.id);
    const empLeaves = leaveRequests.filter((l) => l.user_id === emp.id);
    const joiningDate = firstCheckins.find((a) => a.user_id === emp.id)?.date;
    const calc = calculateSalary(
      Number(emp.salary || 0),
      Number(emp.deduction_amount || 0),
      empAttendance,
      empLeaves,
      joiningDate,
      month,
    );
    return sum + calc.finalSalary;
  }, 0);

  const totalFreelancerEarned = transactions.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0,
  );

  // Save both as auto rows (Totals)
  const syncTotals = Promise.all([
    supabase.from("monthly_expenses").upsert(
      {
        month,
        category: "Employee Salaries",
        amount: totalEmployeeSalary,
        is_auto: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "month,category" },
    ),
    supabase.from("monthly_expenses").upsert(
      {
        month,
        category: "Freelancer Payouts",
        amount: totalFreelancerEarned,
        is_auto: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "month,category" },
    ),
  ]);

  // Save detailed individual breakdown
  const employeePayments = employees.map((emp) => {
    const empAttendance = attendance.filter((a) => a.user_id === emp.id);
    const empLeaves = leaveRequests.filter((l) => l.user_id === emp.id);
    const joiningDate = firstCheckins.find((a) => a.user_id === emp.id)?.date;
    const calc = calculateSalary(
      Number(emp.salary || 0),
      Number(emp.deduction_amount || 0),
      empAttendance,
      empLeaves,
      joiningDate,
      month,
    );
    return {
      month,
      user_id: emp.id,
      name: (emp as any).name,
      email: (emp as any).email,
      role: "Employee",
      base_amount: Number(emp.salary || 0),
      deductions: calc.totalDeduction,
      net_amount: calc.finalSalary,
      meta: {
        absencesCount: calc.absencesCount,
        halfDaysConverted: calc.halfDaysConverted,
        paidLeavesUsed: calc.paidLeavesUsed,
        remainingPaidLeaves: calc.remainingPaidLeaves,
      },
    };
  });

  const freelancerPayments = transactions.reduce((acc: any[], t) => {
    const existing = acc.find((f) => f.user_id === t.freelancer_id);
    if (existing) {
      existing.net_amount += Number(t.amount || 0);
    } else {
      const profile = (t as any).profiles; // If profile was joined
      acc.push({
        month,
        user_id: t.freelancer_id,
        name: profile?.name || "Freelancer",
        email: profile?.email || "",
        role: "Freelancer",
        base_amount: 0,
        deductions: 0,
        net_amount: Number(t.amount || 0),
        meta: {},
      });
    }
    return acc;
  }, []);

  const syncBreakdown = supabase
    .from("payment_history")
    .upsert([...employeePayments, ...freelancerPayments], {
      onConflict: "month,user_id",
    });

  await Promise.all([syncTotals, syncBreakdown]);

  return {};
}
