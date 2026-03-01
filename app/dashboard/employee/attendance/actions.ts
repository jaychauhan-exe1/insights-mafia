"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/get-profile";
import { revalidatePath } from "next/cache";
import {
  getISTISOString,
  getISTToday,
  getISTHours,
  getISTParts,
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

  const supabase = await createAdminClient();
  const today = getISTToday();

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
  if (!isWithinCheckOutHours()) {
    // We check duration even if outside window to provide better feedback
    const profile = await getProfile();
    const supabase = await createAdminClient();
    const today = getISTToday();
    const { data: currentEntry } = await supabase
      .from("attendance")
      .select("check_in")
      .eq("user_id", profile?.id)
      .eq("date", today)
      .single();

    if (currentEntry?.check_in) {
      const checkInTime = new Date(currentEntry.check_in).getTime();
      const checkOutTime = new Date().getTime();
      const durationHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

      if (durationHours >= 4 && durationHours < 8) {
        return {
          error: "REMAINING_WORK",
          message:
            "Please finish your 8 hours of full day work before checking out.",
        };
      }
    }

    return {
      error:
        "Check-out is only allowed after 05:50 PM IST to ensure a full working day.",
    };
  }

  const profile = await getProfile();
  if (!profile) return { error: "Not authenticated" };

  const supabase = await createAdminClient();
  const today = getISTToday();

  // Fetch check_in time to calculate status
  const { data: currentEntry } = await supabase
    .from("attendance")
    .select("check_in")
    .eq("user_id", profile.id)
    .eq("date", today)
    .single();

  let status = "Present";
  if (currentEntry?.check_in) {
    const checkInTime = new Date(currentEntry.check_in).getTime();
    const checkOutTime = new Date().getTime(); // Standard getTime is fine for duration calculation
    const durationHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

    if (durationHours < 4) {
      status = "Half Day";
    }
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
}) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authenticated" };

  const supabase = await createAdminClient();

  const requests = data.dates.map((date) => ({
    user_id: profile.id,
    date,
    reason: data.reason,
    status: "Pending",
    will_work_sunday: data.will_work_sunday,
  }));

  const { error } = await supabase.from("leave_requests").insert(requests);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/employee/attendance");
  revalidatePath("/dashboard/admin/attendance");
  revalidatePath("/dashboard/admin/approvals");
  return { success: true };
}
