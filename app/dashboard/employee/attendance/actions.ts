"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/get-profile";
import { revalidatePath } from "next/cache";
import { getISTISOString, getISTToday, getISTHours } from "@/lib/date-utils";

const isWithinCheckInHours = () => {
  const hours = getISTHours();
  // 10 AM to 6 PM (18:00)
  return hours >= 10 && hours < 18;
};

const isWithinCheckOutHours = () => {
  const hours = getISTHours();
  // 10 AM to 12 AM (24:00)
  return hours >= 10;
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
    return {
      error: "Check-out is only allowed after 10:00 AM IST on the day of work.",
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
  date: string;
  reason: string;
  will_work_sunday: boolean;
}) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authenticated" };

  const supabase = await createAdminClient();

  const { error } = await supabase.from("leave_requests").insert({
    user_id: profile.id,
    date: data.date,
    reason: data.reason,
    status: "Pending",
    will_work_sunday: data.will_work_sunday,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/employee/attendance");
  revalidatePath("/dashboard/admin/attendance");
  revalidatePath("/dashboard/admin/approvals");
  return { success: true };
}
