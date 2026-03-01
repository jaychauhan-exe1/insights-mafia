"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/get-profile";
import { calculateSalary } from "@/lib/salary-utils";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface MonthlyFinanceSummary {
  totalEmployeeSalary: number;
  totalFreelancerEarned: number;
  employeeCount: number;
  freelancerCount: number;
}

/**
 * Calculates employee net salaries and freelancer credits for a given month.
 * @param month - YYYY-MM format
 */
export async function getMonthlyFinanceSummary(
  month: string,
): Promise<MonthlyFinanceSummary | { error: string }> {
  const profile = await getProfile();
  if (!profile || profile.role !== "Admin") return { error: "Unauthorized" };

  const supabase = await createAdminClient();

  const monthStart = `${month}-01`;
  // Get last day of month
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
    // First attendance per employee ever (for joining date logic)
    supabase
      .from("attendance")
      .select("user_id, date")
      .order("date", { ascending: true }),
    // Freelancer credits (wallet top-ups) for this month
    supabase
      .from("wallet_transactions")
      .select("freelancer_id, amount, type, created_at")
      .eq("type", "credit")
      .gte("created_at", `${monthStart}T00:00:00Z`)
      .lte("created_at", `${monthEnd}T23:59:59Z`),
  ]);

  const employees = employeesRes.data || [];
  const attendance = attendanceRes.data || [];
  const leaveRequests = leaveRequestsRes.data || [];
  const firstCheckins = firstCheckinRes.data || [];
  const transactions = transactionsRes.data || [];

  // Calculate salary per employee for this specific month
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
      month, // <-- pass target month
    );
    return sum + calc.finalSalary;
  }, 0);

  // Freelancer earned = sum of credits added that month
  const totalFreelancerEarned = transactions.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0,
  );

  return {
    totalEmployeeSalary,
    totalFreelancerEarned,
    employeeCount: employees.length,
    freelancerCount: new Set(transactions.map((t) => t.freelancer_id)).size,
  };
}
