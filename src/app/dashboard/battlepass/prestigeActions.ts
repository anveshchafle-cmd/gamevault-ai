"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function prestigeCustomer(customerId: string, progressId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("prestige_level")
    .eq("id", customerId)
    .maybeSingle();

  if (!customer) {
    return { success: false, error: "Customer not found." };
  }

  const newPrestigeLevel = (customer.prestige_level ?? 0) + 1;

  const { error: customerError } = await supabase
    .from("customers")
    .update({ prestige_level: newPrestigeLevel })
    .eq("id", customerId);

  if (customerError) {
    return { success: false, error: customerError.message };
  }

  const { error: progressError } = await supabase
    .from("customer_battle_pass_progress")
    .update({ current_xp: 0, current_tier: 0 })
    .eq("id", progressId);

  if (progressError) {
    return { success: false, error: progressError.message };
  }

  revalidatePath("/dashboard/battlepass");
  return { success: true, newPrestigeLevel };
}
