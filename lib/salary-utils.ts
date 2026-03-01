import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isAfter,
  parseISO,
  format,
  getDay,
} from "date-fns";

export function calculateSalary(
  baseSalary: number,
  deductionAmount: number,
  attendanceRecords: { date: string; status: string }[],
  leaveRequests: {
    date: string;
    status: string;
    will_work_sunday: boolean;
  }[] = [],
  joiningDate?: string,
  targetMonth?: string,
) {
  const now = new Date();
  const referenceDate = targetMonth ? parseISO(`${targetMonth}-01`) : now;

  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);

  const isCurrentMonth =
    format(monthStart, "yyyy-MM") === format(now, "yyyy-MM");
  const effectiveEnd =
    isCurrentMonth && isAfter(monthEnd, now) ? now : monthEnd;

  const effectiveStart = joiningDate
    ? parseISO(joiningDate) > monthStart
      ? parseISO(joiningDate)
      : monthStart
    : monthStart;

  const allDaysSoFar = eachDayOfInterval({
    start: effectiveStart,
    end: isAfter(effectiveEnd, effectiveStart) ? effectiveEnd : effectiveStart,
  });

  const attendanceMap = new Map(
    attendanceRecords.map((r) => [r.date, r.status]),
  );

  let absencesCount = 0;
  let halfDaysCount = 0;
  let paidLeavesUsed = 0;
  const monthlyAllowance = 1; // Each month has exactly 1 paid leave
  const todayStr = format(now, "yyyy-MM-dd");

  allDaysSoFar.forEach((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const isToday = dayStr === todayStr;
    const status = attendanceMap.get(dayStr);

    if (status === "Present" || status === "Holiday") {
      return;
    }

    if (status === "Paid Off") {
      paidLeavesUsed++;
      return;
    }

    if (status === "Half Day") {
      halfDaysCount++;
      return;
    }

    // Skip Sundays unless there is an override status (like Holiday or Present)
    if (getDay(day) === 0 && !status) {
      return;
    }

    // Skip Today if there is no record yet (assume they haven't checked in)
    // Only count today as absent if explicitly marked "Absent"
    if (isToday && !status) {
      return;
    }

    // Default: Absent or unpaid 'Off'
    absencesCount++;
  });

  // LOGIC: If month ended (or for current month calculation)
  // and they have unused paid leave balance, use it to cover half days.
  let halfDaysCoveredByLeave = 0;
  let remainingAllowance = Math.max(0, monthlyAllowance - paidLeavesUsed);

  if (remainingAllowance > 0 && halfDaysCount > 0) {
    // 1 paid leave covers all half days (1 or 2 as per user request)
    halfDaysCoveredByLeave = halfDaysCount;
    remainingAllowance = 0;
  }

  // Calculate deductions
  // Only unpaid absences and non-covered half days cost money
  const realHalfDayAbsences = (halfDaysCount - halfDaysCoveredByLeave) * 0.5;
  const totalAbsenceUnits = absencesCount + realHalfDayAbsences;

  const totalDeduction = totalAbsenceUnits * deductionAmount;
  const finalSalary = Math.max(0, baseSalary - totalDeduction);

  return {
    baseSalary,
    deductionAmount,
    absencesCount: totalAbsenceUnits,
    totalDeduction,
    finalSalary,
    workingDaysCount: allDaysSoFar.length,
    presentCount: attendanceRecords.filter(
      (r) => r.status === "Present" || r.status === "Half Day",
    ).length,
    paidLeavesUsed: monthlyAllowance - remainingAllowance,
    remainingPaidLeaves: remainingAllowance,
    halfDaysConverted: halfDaysCoveredByLeave > 0,
    hasActivity: attendanceRecords.length > 0 || leaveRequests.length > 0,
  };
}
