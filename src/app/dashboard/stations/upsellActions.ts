"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUpsellSuggestion } from "@/lib/upsell/engine";

export async function fetchUpsellSuggestion(customerId: string) {
  const suggestion = await getUpsellSuggestion(customerId);
  return suggestion;
}

export async function logUpsellSale(
  cafeId: string,
  customerId: string,
  sessionId: string,
  itemName: string,
  price: number
) {
  const supabase = await createClient();

  const { error } = await supabase.from("transactions").insert({
    cafe_id: cafeId,
    customer_id: customerId,
    session_id: sessionId,
    item_type: "food",
    item_name: itemName,
    quantity: 1,
    unit_price: price,
    total_amount: price,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/stations");
  return { success: true };
}
