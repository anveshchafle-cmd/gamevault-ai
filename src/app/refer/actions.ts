"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send";
import { referralMessage } from "@/lib/whatsapp/templates";

export async function claimReferral(referralCode: string, newPersonPhone: string, newPersonName: string) {
  const supabase = createServiceRoleClient();
  const phone = newPersonPhone.trim();

  if (!phone) {
    return { success: false, error: "Phone number is required." };
  }

  const { data: referrer } = await supabase
    .from("customers")
    .select("id, cafe_id, name, phone")
    .eq("referral_code", referralCode)
    .maybeSingle();

  if (!referrer) {
    return { success: false, error: "Invalid referral link." };
  }

  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("cafe_id", referrer.cafe_id)
    .eq("phone", phone)
    .maybeSingle();

  if (existing) {
    if (existing.id === referrer.id) {
      return { success: false, error: "You can't refer yourself." };
    }
    await supabase.from("customers").update({ referred_by: referrer.id }).eq("id", existing.id);
  } else {
    await supabase.from("customers").insert({
      cafe_id: referrer.cafe_id,
      phone,
      name: newPersonName || null,
      referred_by: referrer.id,
    });
  }

  await supabase.from("customer_events").insert({
    cafe_id: referrer.cafe_id,
    customer_id: referrer.id,
    event_type: "referral_made",
    event_payload: { referred_phone: phone },
  });

  const messageText = referralMessage(referrer.name ?? "there", newPersonName || "your friend", 1);
  await sendWhatsAppMessage({
    cafeId: referrer.cafe_id,
    customerId: referrer.id,
    phone: referrer.phone,
    campaignType: "referral",
    messageText,
  });

  return { success: true, referrerName: referrer.name };
}
