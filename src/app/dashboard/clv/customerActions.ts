"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/types/database";

export async function updateCustomerDetails(
  customerId: string,
  cafeId: string,
  updates: { referredByPhone?: string; dateOfBirth?: string }
) {
  const supabase = await createClient();

  let referredById: string | null = null;

  if (updates.referredByPhone) {
    const { data: referrer } = await supabase
      .from("customers")
      .select("id")
      .eq("cafe_id", cafeId)
      .eq("phone", updates.referredByPhone.trim())
      .maybeSingle();

    if (!referrer) {
      return { success: false, error: "No customer found with that referrer phone number." };
    }
    referredById = referrer.id;
  }
  const updatePayload: Database["public"]["Tables"]["customers"]["Update"] = {};
  
  if (referredById) updatePayload.referred_by = referredById;
  if (updates.dateOfBirth) updatePayload.date_of_birth = updates.dateOfBirth;

  const { error } = await supabase
    .from("customers")
    .update(updatePayload)
    .eq("id", customerId);

  if (error) return { success: false, error: error.message };

  if (referredById) {
    await supabase.from("customer_events").insert({
      cafe_id: cafeId,
      customer_id: referredById,
      event_type: "referral_made",
      event_payload: { referred_customer_id: customerId },
    });
  }

  revalidatePath("/dashboard/clv");
  return { success: true };
}
