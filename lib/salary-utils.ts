import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSunday,
  isAfter,
  parseISO,
  format,
} from "date-fns";
import { getISTToday } from "./date-utils";

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
  // Use IST for "now" and "today"
  const todayStr = getISTToday();
  const today = parseISO(todayStr);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // If joiningDate is provided, start from that date if it's within the current month
  const effectiveStart = joiningDate
    ? parseISO(joiningDate) > monthStart
      ? parseISO(joiningDate)
      : monthStart
    : monthStart;

  // Working days are EVERY day up to today
  const allDaysSoFar = eachDayOfInterval({
    start: effectiveStart,
    end: isAfter(monthEnd, today) ? today : monthEnd,
  });

  let absencesCount = 0;
  const attendanceMap = new Map(
    attendanceRecords.map((r) => [r.date, r.status]),
  );

  allDaysSoFar.forEach((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const status = attendanceMap.get(dayStr);

    // If marked Present, Paid Off, or Half Day, it's not a full absence
    if (
      status === "Present" ||
      status === "Paid Off" ||
      status === "Off" ||
      status === "Half Day"
    ) {
      if (status === "Half Day") {
        absencesCount += 0.5;
      }
      return;
    }

    // Default: Absent if no record or explicitly absent
    absencesCount++;
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
    presentCount: attendanceRecords.filter(
      (r) => r.status === "Present" || r.status === "Half Day",
    ).length,
  };
}
