"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveLeaveRequest(requestId: string) {
  const supabase = await createAdminClient();

  // 1. Fetch request details
  const { data: request, error: fetchError } = await supabase
    .from("leave_requests")
    .select("*, user:profiles(*)")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) return { error: "Request not found" };

  // 2. Update status
  const { error: updateError } = await supabase
    .from("leave_requests")
    .update({ status: "Approved" })
    .eq("id", requestId);

  if (updateError) return { error: updateError.message };

  // 3. Create attendance record
  await supabase.from("attendance").insert({
    user_id: request.user_id,
    date: request.date,
    status: request.is_paid_leave ? "Paid Off" : "Off",
  });

  // 4. If paid leave, deduct from profile
  if (request.is_paid_leave) {
    const currentPaidLeaves = request.user?.paid_leaves || 0;
    await supabase
      .from("profiles")
      .update({ paid_leaves: Math.max(0, currentPaidLeaves - 1) })
      .eq("id", request.user_id);
  }

  revalidatePath("/dashboard/admin/approvals");
  revalidatePath("/dashboard/admin/attendance");
  revalidatePath(`/dashboard/admin/users/${request.user_id}`);
  return { success: true };
}

export async function rejectLeaveRequest(requestId: string) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("leave_requests")
    .update({ status: "Rejected" })
    .eq("id", requestId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/approvals");
  return { success: true };
}
