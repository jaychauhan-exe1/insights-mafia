"use server";

import { createClient } from "@/lib/supabase/server";
import { login } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function authenticate(formData: FormData) {
  try {
    const email = (formData.get("email") as string)?.toLowerCase();
    const password = formData.get("password") as string;

    console.log(`Login attempt for: ${email}`);

    const supabase = await createClient();

    // 1. Fetch user by email
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !profile) {
      console.log(`User not found: ${email}`);
      return { error: "Invalid email or password" };
    }

    console.log(`User found: ${profile.email}, role: ${profile.role}`);

    // 2. Check if user has a password_hash
    if (!profile.password_hash) {
      console.log(`User has no password_hash: ${email}`);
      return {
        error:
          "Your account is not configured for manual login. Please contact admin.",
      };
    }

    // 3. Verify password
    const passwordMatch = await bcrypt.compare(password, profile.password_hash);

    if (!passwordMatch) {
      console.log(`Password mismatch for: ${email}`);
      return { error: "Invalid email or password" };
    }

    console.log(`Password matched! Creating session...`);

    const rememberMe = formData.get("remember") === "true";

    // 4. Create custom JWT session
    await login(
      {
        id: profile.id,
        email: profile.email,
        role: profile.role,
      },
      rememberMe,
    );

    console.log(`Login successful for: ${email}`);
    return { success: true };
  } catch (err) {
    console.error("Login Action Error:", err);
    return { error: "An unexpected error occurred during login" };
  }
}
