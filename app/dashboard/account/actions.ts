"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/get-profile";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateAccount(formData: FormData) {
  try {
    const profile = await getProfile();
    if (!profile) return { error: "Unauthorized" };

    const name = formData.get("name") as string;
    const password = formData.get("password") as string;
    const avatar_url = formData.get("avatar_url") as string;

    const supabase = await createAdminClient();

    const updates: any = {};
    if (name) updates.name = name;
    if (avatar_url) updates.avatar_url = avatar_url;

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      updates.password_hash = password_hash;
    }

    if (Object.keys(updates).length === 0) {
      return { error: "No changes provided" };
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/account");
    return { success: true };
  } catch (err: any) {
    console.error("Update Account Error:", err);
    return { error: err.message || "Failed to update account" };
  }
}
