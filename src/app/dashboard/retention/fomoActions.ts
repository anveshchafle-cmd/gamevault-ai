"use server";

import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send";
import { fomoFlashMessage } from "@/lib/whatsapp/templates";
import { revalidatePath } from "next/cache";

export async function sendFomoCampaign(
  cafeId: string,
  offerDescription: string,
  expiryInfo: string,
  segment: "all_active" | "whale" | "at_risk" | "grinder" | "socialite"
) {
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("id, name, phone, clv_tier")
    .eq("cafe_id", cafeId);

  if (segment !== "all_active") {
    query = query.eq("clv_tier", segment);
  }

  const { data: customers, error } = await query;

  if (error || !customers) {
    return { success: false, error: error?.message ?? "Failed to load customers" };
  }

  if (customers.length === 0) {
    return { success: false, error: "No customers found matching that segment." };
  }

  let sent = 0;
  let failed = 0;
  for (const customer of customers) {
    const messageText = fomoFlashMessage(
      customer.name ?? "there",
      offerDescription,
      expiryInfo
    );
    const result = await sendWhatsAppMessage({
      cafeId,
      customerId: customer.id,
      phone: customer.phone,
      campaignType: "fomo_flash",
      messageText,
    });
    if (result) {
      sent++;
    } else {
      failed++;
    }
  }

  revalidatePath("/dashboard/retention");
  return {
    success: true,
    sent,
    failed,
    totalFound: customers.length,
  };
}
