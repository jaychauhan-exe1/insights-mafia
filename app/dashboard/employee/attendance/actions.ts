"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/get-profile";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

export async function checkIn(location?: {
  latitude: number;
  longitude: number;
}) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authenticated" };

  const supabase = await createAdminClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { error } = await supabase.from("attendance").insert({
    user_id: profile.id,
    date: today,
    check_in: new Date().toISOString(),
    status: "Present",
    check_in_location: location || null,
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

export async function checkOut(location?: {
  latitude: number;
  longitude: number;
}) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authenticated" };

  const supabase = await createAdminClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { error } = await supabase
    .from("attendance")
    .update({
      check_out: new Date().toISOString(),
      check_out_location: location || null,
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
