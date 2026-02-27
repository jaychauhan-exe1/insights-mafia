"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/get-profile";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function createUser(formData: FormData) {
  try {
    const admin = await getProfile();
    if (!admin || admin.role !== "Admin") return { error: "Unauthorized" };

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as "Admin" | "Employee" | "Freelancer";
    const salary = Number(formData.get("salary") || 0);
    const deduction_amount = Number(formData.get("deduction_amount") || 0);

    if (!email || !password || !name || !role) {
      return { error: "Missing required fields" };
    }

    const supabase = await createAdminClient();

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return { error: "A user with this email already exists." };
    }

    // 2. Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    // 3. Insert into profiles table
    // We generate a new UUID for the user ID since we aren't using Supabase Auth
    const { error: profileError } = await supabase.from("profiles").insert({
      id: uuidv4(),
      name,
      email,
      role,
      password_hash,
      salary,
      deduction_amount,
    });

    if (profileError) {
      console.error("Profile Creation Error:", profileError);
      return { error: `Database Error: ${profileError.message}` };
    }

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (err: any) {
    console.error("Create User Action Error:", err);
    return { error: err.message || "An unexpected error occurred" };
  }
}

export async function updateUser(userId: string, formData: FormData) {
  try {
    const admin = await getProfile();
    if (!admin || admin.role !== "Admin") return { error: "Unauthorized" };

    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as "Admin" | "Employee" | "Freelancer";
    const salary = Number(formData.get("salary") || 0);
    const deduction_amount = Number(formData.get("deduction_amount") || 0);

    if (!email || !name || !role) {
      return { error: "Missing required fields" };
    }

    const supabase = await createAdminClient();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name,
        email,
        role,
        salary,
        deduction_amount,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Profile Update Error:", updateError);
      return { error: `Database Error: ${updateError.message}` };
    }

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (err: any) {
    console.error("Update User Action Error:", err);
    return { error: err.message || "An unexpected error occurred" };
  }
}

export async function deleteUser(userId: string) {
  try {
    const admin = await getProfile();
    if (!admin || admin.role !== "Admin") return { error: "Unauthorized" };

    const supabase = await createAdminClient();

    // Prevent deleting self
    if (admin.id === userId) {
      return { error: "You cannot delete your own account." };
    }

    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      console.error("Profile Delete Error:", deleteError);
      return { error: `Database Error: ${deleteError.message}` };
    }

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (err: any) {
    console.error("Delete User Action Error:", err);
    return { error: err.message || "An unexpected error occurred" };
  }
}
