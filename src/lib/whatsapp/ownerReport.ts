import { createServiceRoleClient } from "@/lib/supabase/server";

export async function sendOwnerReportMessage(
  cafeId: string,
  ownerPhone: string,
  messageText: string
): Promise<{ success: boolean; error?: string }> {
  const isLive = process.env.WHATSAPP_MODE === "live";
  const supabase = createServiceRoleClient();

  if (!isLive) {
    console.log(`\n[DRY RUN] Owner report to ${ownerPhone}:\n${messageText}\n`);
    await supabase.from("whatsapp_messages").insert({
      cafe_id: cafeId,
      customer_id: null,
      campaign_type: "owner_digest",
      message_text: `[DRY RUN] ${messageText}`,
    });
    return { success: true };
  }

  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      return { success: false, error: "Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN env var" };
    }

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: ownerPhone,
          type: "text",
          text: { body: messageText },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      return { success: false, error: errorBody };
    }

    await supabase.from("whatsapp_messages").insert({
      cafe_id: cafeId,
      customer_id: null,
      campaign_type: "owner_digest",
      message_text: messageText,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
