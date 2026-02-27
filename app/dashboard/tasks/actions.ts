"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/get-profile";
import { revalidatePath } from "next/cache";

export async function submitTaskWithNote(
  taskId: string,
  note: string,
  links: string[],
) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authenticated" };

  const supabase = await createAdminClient();

  // Verify ownership
  const { data: task } = await supabase
    .from("tasks")
    .select("assignee_id")
    .eq("id", taskId)
    .single();

  if (task?.assignee_id !== profile.id) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      status: profile.role === "Employee" ? "Completed" : "Review",
      submission_note: note,
      submission_links: links,
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${taskId}`);
  return { success: true };
}

export async function updateTaskStatus(taskId: string, status: string) {
  const profile = await getProfile();
  if (profile?.role !== "Admin") return { error: "Unauthorized" };

  const supabase = await createAdminClient();

  // Get current task data for potential wallet updates
  const { data: task } = await supabase
    .from("tasks")
    .select("*, assignee:profiles!tasks_assignee_id_fkey(*)")
    .eq("id", taskId)
    .single();

  if (!task) return { error: "Task not found" };

  const updateData: any = { status };
  if (status === "Completed") {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId);

  if (error) return { error: error.message };

  // If newly completed and has a freelancer assignee with a payment amount
  if (
    status === "Completed" &&
    task.status !== "Completed" &&
    task.assignee?.role === "Freelancer" &&
    task.payment_amount > 0
  ) {
    // 1. Create transaction record
    await supabase.from("wallet_transactions").insert({
      freelancer_id: task.assignee_id,
      amount: task.payment_amount,
      task_id: taskId,
      type: "credit",
      created_at: new Date().toISOString(),
    });

    // 2. Update cached balance in profile
    const currentBalance = Number(task.assignee.wallet_balance || 0);
    await supabase
      .from("profiles")
      .update({ wallet_balance: currentBalance + Number(task.payment_amount) })
      .eq("id", task.assignee_id);
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath("/dashboard/admin/payments");
  return { success: true };
}

export async function reviewTask(
  taskId: string,
  status: "Completed" | "Revision",
  feedback?: string,
) {
  const profile = await getProfile();
  if (profile?.role !== "Admin") return { error: "Unauthorized" };

  const supabase = await createAdminClient();

  // Get current task data for potential wallet updates
  const { data: task } = await supabase
    .from("tasks")
    .select("*, assignee:profiles!tasks_assignee_id_fkey(*)")
    .eq("id", taskId)
    .single();

  if (!task) return { error: "Task not found" };

  const updateData: any = {
    status,
    feedback: feedback || null,
  };

  if (status === "Completed") {
    updateData.completed_at = new Date().toISOString();
  } else if (status === "Revision") {
    updateData.revision_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId);

  if (error) return { error: error.message };

  // If newly completed and has a freelancer assignee with a payment amount
  if (
    status === "Completed" &&
    task.status !== "Completed" &&
    task.assignee?.role === "Freelancer" &&
    task.payment_amount > 0
  ) {
    // 1. Create transaction record
    await supabase.from("wallet_transactions").insert({
      freelancer_id: task.assignee_id,
      amount: task.payment_amount,
      task_id: taskId,
      type: "credit",
      created_at: new Date().toISOString(),
    });

    // 2. Update cached balance in profile
    const currentBalance = Number(task.assignee.wallet_balance || 0);
    await supabase
      .from("profiles")
      .update({ wallet_balance: currentBalance + Number(task.payment_amount) })
      .eq("id", task.assignee_id);
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath("/dashboard/admin/payments");
  return { success: true };
}

export async function deleteTask(id: string) {
  const profile = await getProfile();
  if (profile?.role !== "Admin") return;

  const supabase = await createAdminClient();
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/dashboard/tasks");
}

export async function createTask(formData: FormData) {
  const profile = await getProfile();
  if (profile?.role !== "Admin") return { error: "Unauthorized" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const assignee_id = formData.get("assignee_id") as string;
  const deadline = formData.get("deadline") as string;
  const payment_amount = formData.get("payment_amount") as string;
  const client_id = formData.get("client_id") as string;
  const reference_links = formData.getAll("reference_links") as string[];

  const supabase = await createAdminClient();
  const { error } = await supabase.from("tasks").insert({
    title,
    description,
    assignee_id: assignee_id || null,
    deadline: deadline || null,
    payment_amount: payment_amount ? parseFloat(payment_amount) : null,
    client_id: client_id || null,
    status: "Pending",
    assigned_at: assignee_id ? new Date().toISOString() : null,
    reference_links: reference_links.filter((l) => l.trim() !== ""),
    created_by: profile.id,
  });

  if (error)
    return { error: `${error.message} (Client ID: ${client_id || "None"})` };

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/admin/clients");
  revalidatePath("/dashboard/admin/clients/[id]", "layout");
  return { success: true };
}

export async function updateTask(taskId: string, formData: FormData) {
  const profile = await getProfile();
  if (profile?.role !== "Admin") return { error: "Unauthorized" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const assignee_id = formData.get("assignee_id") as string;
  const deadline = formData.get("deadline") as string;
  const payment_amount = formData.get("payment_amount") as string;
  const client_id = formData.get("client_id") as string;
  const reference_links = formData.getAll("reference_links") as string[];

  const supabase = await createAdminClient();

  // Get current task to check for assignee change
  const { data: currentTask } = await supabase
    .from("tasks")
    .select("assignee_id")
    .eq("id", taskId)
    .single();

  const updateData: any = {
    title,
    description,
    assignee_id: assignee_id || null,
    deadline: deadline || null,
    payment_amount: payment_amount ? parseFloat(payment_amount) : null,
    client_id: client_id || null,
    reference_links: reference_links.filter((l) => l.trim() !== ""),
  };

  if (assignee_id && assignee_id !== currentTask?.assignee_id) {
    updateData.assigned_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${taskId}`);
  return { success: true };
}
