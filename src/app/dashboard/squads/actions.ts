"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createSquad(formData: {
  cafeId: string;
  name: string;
  squadType: "squad" | "family" | "college_gang" | "corporate";
  planTier: string;
  sharedHoursPool: number;
  monthlyFee: number;
  leaderPhone: string;
}) {
  const supabase = await createClient();

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("cafe_id", formData.cafeId)
    .eq("phone", formData.leaderPhone)
    .maybeSingle();

  let leaderId = existingCustomer?.id;

  if (!leaderId) {
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({ cafe_id: formData.cafeId, phone: formData.leaderPhone })
      .select()
      .single();

    if (customerError || !newCustomer) {
      return { success: false, error: customerError?.message ?? "Failed to create leader" };
    }
    leaderId = newCustomer.id;
  }

  const cycleStart = new Date().toISOString().split("T")[0];
  const cycleEnd = new Date();
  cycleEnd.setDate(cycleEnd.getDate() + 30);

  const { error } = await supabase.from("squads").insert({
    cafe_id: formData.cafeId,
    name: formData.name,
    squad_type: formData.squadType,
    plan_tier: formData.planTier,
    shared_hours_pool: formData.sharedHoursPool,
    monthly_fee: formData.monthlyFee,
    leader_customer_id: leaderId,
    cycle_starts_at: cycleStart,
    cycle_ends_at: cycleEnd.toISOString().split("T")[0],
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/squads");
  return { success: true };
}
