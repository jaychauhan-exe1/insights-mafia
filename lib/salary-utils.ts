import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSunday,
  isAfter,
  startOfToday,
  nextSunday,
  parseISO,
  format,
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
  joiningDate?: string, // New parameter for first ever check-in date
) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const today = startOfToday();

  // If joiningDate is provided, start from that date if it's within the current month
  const effectiveStart = joiningDate
    ? parseISO(joiningDate) > monthStart
      ? parseISO(joiningDate)
      : monthStart
    : monthStart;

  // Working days are EVERY day except one day off per week (usually sunday, unless they worked it)
  // Actually, the user says "dont make sunday as a holiday" and "only 1 off per week".
  // This means we should count EVERY day as a potential work day up to today.
  const allDaysSoFar = eachDayOfInterval({
    start: effectiveStart,
    end: isAfter(monthEnd, today) ? today : monthEnd,
  });

  let absencesCount = 0;
  const attendanceMap = new Map(
    attendanceRecords.map((r) => [r.date, r.status]),
  );

  // Track assigned "Off" days (paid leaves)
  const offDays = new Set(
    attendanceRecords
      .filter((r) => r.status === "Paid Off" || r.status === "Off")
      .map((r) => r.date),
  );

  allDaysSoFar.forEach((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const status = attendanceMap.get(dayStr);

    // If marked Present or Off/Paid Off, it's not an absence
    if (status === "Present" || status === "Paid Off" || status === "Off") {
      return;
    }

    // Special Sunday logic:
    // If it's a Sunday and they didn't work (status is not Present), check if they had a leave that depended on this Sunday.
    if (isSunday(day)) {
      // If they just didn't work and no special leave was attached, it's an absence (per user: if doesn't check in mark absent)
      // Wait, "1 holiday per week (usually sunday)".
      // If they DIDN'T work on Sunday, they use their 1 holiday.
      // If they work on Sunday, they can take another day off.

      // Let's refine: A week is valid if it has at least 6 working days (Present or Off).
      // If a week has 7 days and only 5 are working/off, then 1 day is an absence.
      // Actually, the user's specific rule:
      // "if an employee requests for leave... toggles it [will work sunday]... mark leave as paid leave.
      // if doesn't check in on upcoming sunday, mark BOTH dates to be absent."

      // Let's look for leave requests that promised this specific Sunday
      const promisedLeaves = leaveRequests.filter(
        (l) =>
          l.will_work_sunday &&
          l.status === "Approved" &&
          isSameDay(nextSunday(parseISO(l.date)), day),
      );

      if (promisedLeaves.length > 0 && status !== "Present") {
        // Promise broken! Both the Sunday AND the leave are absences.
        absencesCount += 1 + promisedLeaves.length; // The Sunday + the promised leaves
        return;
      }

      // Normal Sunday: If not present, check if it's their "1 off per week"
      // For simplicity in a daily loop, we can't easily check the whole week.
      // But the user said: "if user doesn't check in on sunday mark employee absent".
      // This contradicts "1 holiday per week (usually sunday)".
      // Interpretation: If you don't check in on Sunday, you are absent UNLESS it's your designated off day.
      // But if you worked Sunday, you get another day off.

      // Let's stick to the user's most explicit instruction: "if user doesn't check in sunday mark employee absent".
      // AND "Saturdays are also working days".
      // This implies every day is a working day, and "Off" status is the only way to not be absent.

      if (status !== "Present") {
        absencesCount++;
      }
    } else {
      // Normal day (Mon-Sat): Absent if not Present and not Off
      absencesCount++;
    }
  });

  const totalDeduction = absencesCount * deductionAmount;
  const finalSalary = Math.max(0, baseSalary - totalDeduction);

  return {
    baseSalary,
    deductionAmount,
    absencesCount,
    totalDeduction,
    finalSalary,
    workingDaysCount: allDaysSoFar.length,
    presentCount: attendanceRecords.filter((r) => r.status === "Present")
      .length,
  };
}
