"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/get-profile";
import { revalidatePath } from "next/cache";

export async function processPayment(
  freelancerId: string,
  amount: number,
  description: string,
) {
  try {
    const admin = await getProfile();
    if (!admin || admin.role !== "Admin") {
      return { error: "Unauthorized" };
    }

    const supabase = await createAdminClient();

    // 1. Get current profile to update balance
    const { data: freelancer } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", freelancerId)
      .single();

    if (!freelancer) return { error: "Freelancer not found" };

    // 2. Create transaction record
    const { error: txError } = await supabase
      .from("wallet_transactions")
      .insert({
        freelancer_id: freelancerId,
        amount: amount,
        type: "debit",
        description: description || "Manual payment payout",
        created_at: new Date().toISOString(),
      });

    if (txError) throw txError;

    // 3. Update cached balance in profile
    const currentBalance = Number(freelancer.wallet_balance || 0);
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ wallet_balance: currentBalance - Number(amount) })
      .eq("id", freelancerId);

    if (profileError) throw profileError;

    revalidatePath("/dashboard/admin/payments");
    revalidatePath("/dashboard/freelancer/wallet");
    revalidatePath("/dashboard/account");
    return { success: true };
  } catch (err: any) {
    console.error("Process Payment Error:", err);
    return { error: err.message || "Failed to process payment" };
  }
}
