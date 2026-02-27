import { createClient } from "./server";
import { Profile } from "@/types/database";
import { cache } from "react";
import { getSession } from "@/lib/auth";

export const getProfile = cache(async (): Promise<Profile | null> => {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return null;
    }

    const supabase = await createClient();

    // Fetch profile from our profiles table using the ID from the JWT
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error || !profile) {
      return null;
    }

    return profile;
  } catch (err) {
    console.error("Error in getProfile:", err);
    return null;
  }
});
