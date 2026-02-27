"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/get-profile";
import { revalidatePath } from "next/cache";

export async function createClient(data: {
  name: string;
  business?: string;
  contract_link?: string;
  monthly_charges?: number;
}) {
  const profile = await getProfile();
  if (profile?.role !== "Admin") return { error: "Unauthorized" };

  const supabase = await createAdminClient();
  const { error } = await supabase.from("clients").insert(data);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/clients");
  return { success: true };
}

export async function deleteClient(id: string) {
  const profile = await getProfile();
  if (profile?.role !== "Admin") return { error: "Unauthorized" };

  const supabase = await createAdminClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/clients");
  return { success: true };
}

export async function updateClient(
  id: string,
  data: {
    name: string;
    business?: string;
    contract_link?: string;
    monthly_charges?: number;
  },
) {
  const profile = await getProfile();
  if (profile?.role !== "Admin") return { error: "Unauthorized" };

  const supabase = await createAdminClient();
  const { error } = await supabase.from("clients").update(data).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/clients");
  return { success: true };
}
