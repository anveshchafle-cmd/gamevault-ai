"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addSquadMember(squadId: string, cafeId: string, phone: string) {
  const supabase = await createClient();
  const trimmedPhone = phone.trim();

  if (!trimmedPhone) {
    return { success: false, error: "Phone number is required." };
  }

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id, squad_id")
    .eq("cafe_id", cafeId)
    .eq("phone", trimmedPhone)
    .maybeSingle();

  if (existingCustomer) {
    if (existingCustomer.squad_id === squadId) {
      return { success: false, error: "This person is already in the squad." };
    }
    const { error } = await supabase
      .from("customers")
      .update({ squad_id: squadId })
      .eq("id", existingCustomer.id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("customers")
      .insert({ cafe_id: cafeId, phone: trimmedPhone, squad_id: squadId });

    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/squads");
  return { success: true };
}

export async function removeSquadMember(customerId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .update({ squad_id: null })
    .eq("id", customerId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/squads");
  return { success: true };
}
