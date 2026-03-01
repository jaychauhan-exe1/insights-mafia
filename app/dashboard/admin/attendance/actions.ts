"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/get-profile";
import { revalidatePath } from "next/cache";

export async function markHoliday(
  date: string,
  label: string,
): Promise<{ error?: string }> {
  const profile = await getProfile();
  if (!profile || profile.role !== "Admin") return { error: "Unauthorized" };

  const supabase = await createAdminClient();

  // Upsert the holiday
  const { error } = await supabase
    .from("holidays")
    .upsert({ date, label, created_by: profile.id }, { onConflict: "date" });

  if (error) return { error: error.message };

  // Also upsert an attendance record with status "Holiday" for all employees/team members
  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("id")
    .in("role", ["Employee"]);

  if (teamMembers && teamMembers.length > 0) {
    const records = teamMembers.map((m) => ({
      user_id: m.id,
      date,
      status: "Holiday",
      check_in: null,
      check_out: null,
    }));

    await supabase
      .from("attendance")
      .upsert(records, { onConflict: "user_id,date" });
  }

  revalidatePath("/dashboard/admin/attendance");
  revalidatePath("/dashboard/employee/attendance");
  return {};
}

export async function removeHoliday(date: string): Promise<{ error?: string }> {
  const profile = await getProfile();
  if (!profile || profile.role !== "Admin") return { error: "Unauthorized" };

  const supabase = await createAdminClient();

  await supabase.from("holidays").delete().eq("date", date);
  // Also remove holiday attendance records for that date
  await supabase
    .from("attendance")
    .delete()
    .eq("date", date)
    .eq("status", "Holiday");

  revalidatePath("/dashboard/admin/attendance");
  revalidatePath("/dashboard/employee/attendance");
  return {};
}

export async function updateAttendanceStatus(
  attendanceId: string,
  newStatus: string,
): Promise<{ error?: string }> {
  const profile = await getProfile();
  if (!profile || profile.role !== "Admin") return { error: "Unauthorized" };

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("attendance")
    .update({ status: newStatus })
    .eq("id", attendanceId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/attendance");
  revalidatePath("/dashboard/employee/attendance");
  return {};
}

export async function upsertAttendanceStatusForUser(
  userId: string,
  date: string,
  newStatus: string,
): Promise<{ error?: string }> {
  const profile = await getProfile();
  if (!profile || profile.role !== "Admin") return { error: "Unauthorized" };

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("attendance")
    .upsert(
      { user_id: userId, date, status: newStatus },
      { onConflict: "user_id,date" },
    );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/attendance");
  revalidatePath("/dashboard/employee/attendance");
  return {};
}
