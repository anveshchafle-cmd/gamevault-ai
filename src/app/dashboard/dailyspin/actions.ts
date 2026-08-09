"use server";

import { performDailySpin } from "@/lib/dailyspin/engine";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function spinForCustomer(cafeId: string, phone: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name")
    .eq("cafe_id", cafeId)
    .eq("phone", phone.trim())
    .maybeSingle();

  if (!customer) {
    return { success: false, error: "No customer found with that phone number." };
  }

  const result = await performDailySpin(cafeId, customer.id);
  revalidatePath("/dashboard/dailyspin");

  return { ...result, customerName: customer.name };
}
