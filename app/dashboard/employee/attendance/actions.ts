"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/get-profile";
import { revalidatePath } from "next/cache";
import {
  getISTISOString,
  getISTToday,
  getISTHours,
  getISTParts,
  getISTMonthKey,
} from "@/lib/date-utils";

const isWithinCheckInHours = () => {
  const hours = getISTHours();
  // 10 AM to 6 PM (18:00)
  return hours >= 10 && hours < 18;
};

const isWithinCheckOutHours = () => {
  const parts = getISTParts();
  const hours = parseInt(parts.hour);
  const minutes = parseInt(parts.minute);

  // Checkout allowed from 5:50 PM (17:50) onwards until midnight
  if (hours > 17 || (hours === 17 && minutes >= 50)) {
    return true;
  }
  return false;
};

/**
 * Automatically find and close attendance sessions that were never checked out.
 * This should be called by the system (dashboards or check-in) to ensure data integrity.
 */
export async function autoFixMissingCheckouts(userId?: string) {
  const supabase = await createAdminClient();
  const today = getISTToday();

  // Find records where check_out is null and date < today
  let query = supabase
    .from("attendance")
    .select("*")
    .is("check_out", null)
    .lt("date", today);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: hangingRecords } = await query;

  if (!hangingRecords || hangingRecords.length === 0) return;

  for (const record of hangingRecords) {
    // Generate midnight ISO string for that specific date: YYYY-MM-DDT23:59:59+05:30
    const midnightTime = `${record.date}T23:59:59+05:30`;

    await supabase
      .from("attendance")
      .update({
        check_out: midnightTime,
        status: "Absent", // Per user request: if they forgot to checkout, they are marked Absent
        // check_out_location and workplace stay null
      })
      .eq("id", record.id);
  }

  revalidatePath("/dashboard/employee/attendance");
  revalidatePath("/dashboard/admin/attendance");
}

export async function checkIn(
  workPlace: string,
  location?: {
    latitude: number;
    longitude: number;
  },
) {
  if (!isWithinCheckInHours()) {
    return {
      error: "Check-in is only allowed between 10:00 AM and 06:00 PM IST.",
    };
  }

  const profile = await getProfile();
  if (!profile) return { error: "Not authenticated" };

  // Fix any missing checkouts from previous days for THIS user
  await autoFixMissingCheckouts(profile.id);

  const supabase = await createAdminClient();
  const today = getISTToday();
  const currentMonth = getISTMonthKey();

  // Monthly Leave Credit Logic:
  // If it's a new month, credit 1.0 paid leave to the employee
  if (profile.last_leave_credited_month !== currentMonth) {
    const currentPaidBalance = parseFloat(String(profile.paid_leaves || "0"));
    await supabase
      .from("profiles")
      .update({
        paid_leaves: currentPaidBalance + 1.0,
        last_leave_credited_month: currentMonth,
      })
      .eq("id", profile.id);
  }

  const { error } = await supabase.from("attendance").insert({
    user_id: profile.id,
    date: today,
    check_in: getISTISOString(),
    status: "Present", // Initial status, will be refined on checkout
    check_in_location: location || null,
    check_in_workplace: workPlace,
  });

  if (error) {
    if (error.code === "23505")
      return { error: "Already checked in for today" };
    return { error: error.message };
  }

  revalidatePath("/dashboard/employee/attendance");
  revalidatePath("/dashboard/admin/attendance");
  return { success: true };
}

export async function checkOut(
  workPlace: string,
  location?: {
    latitude: number;
    longitude: number;
  },
) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authenticated" };

  const supabase = await createAdminClient();
  const today = getISTToday();

  // Fetch check_in time to calculate status/duration
  const { data: currentEntry } = await supabase
    .from("attendance")
    .select("check_in")
    .eq("user_id", profile.id)
    .eq("date", today)
    .single();

  if (!currentEntry?.check_in) {
    return { error: "No check-in record found for today." };
  }

  const checkInTime = new Date(currentEntry.check_in).getTime();
  const checkOutTime = new Date().getTime();
  const durationHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

  const isInFullDayWindow = isWithinCheckOutHours(); // 5:50 PM onwards
  const HALF_DAY_MIN_HOURS = 2.5;
  const HALF_DAY_MAX_HOURS = 4.5;

  // --- Checkout Rules ---
  // 1. Less than 2.5 hours worked → always blocked (not enough for anything)
  if (durationHours < HALF_DAY_MIN_HOURS && !isInFullDayWindow) {
    return {
      error: "REMAINING_WORK",
      message: `You need at least ${HALF_DAY_MIN_HOURS} hours of work for a Half Day checkout. (Current: ${durationHours.toFixed(1)}h)`,
    };
  }

  // 2. Between 2.5 and 4.5 hours → allow early checkout as Half Day
  //    (this is the half-day window, no blocking needed)

  // 3. More than 4.5 hours BUT before 5:50 PM → block, ask to finish full day
  if (durationHours >= HALF_DAY_MAX_HOURS && !isInFullDayWindow) {
    return {
      error: "REMAINING_WORK",
      message: `You've worked ${durationHours.toFixed(1)}h which is past the half-day window. Please complete your full day and check out after 05:50 PM IST.`,
    };
  }

  // 4. Determine final status
  let status: string;

  if (isInFullDayWindow) {
    // After 5:50 PM → Full day (Present)
    status = "Present";
  } else {
    // Before 5:50 PM with 2.5–4.5h of work → Half Day
    status = "Half Day";
  }

  const { error } = await supabase
    .from("attendance")
    .update({
      check_out: getISTISOString(),
      check_out_location: location || null,
      check_out_workplace: workPlace,
      status: status,
    })
    .eq("user_id", profile.id)
    .eq("date", today);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/employee/attendance");
  revalidatePath("/dashboard/admin/attendance");
  return { success: true };
}

export async function submitLeaveRequest(data: {
  dates: string[];
  reason: string;
  will_work_sunday: boolean;
  is_paid_leave?: boolean;
}) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authenticated" };

  const supabase = await createAdminClient();

  const requests = data.dates.map((date, index) => ({
    user_id: profile.id,
    date,
    reason: data.reason,
    status: "Pending",
    will_work_sunday: data.will_work_sunday,
    is_paid_leave: data.is_paid_leave && index === 0, // Only the first day is paid
  }));

  const { error } = await supabase.from("leave_requests").insert(requests);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/employee/attendance");
  revalidatePath("/dashboard/admin/attendance");
  revalidatePath("/dashboard/admin/approvals");
  return { success: true };
}
