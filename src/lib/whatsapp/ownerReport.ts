import { createServiceRoleClient } from "@/lib/supabase/server";

// Sends the daily executive summary directly to the cafe owner's own
// WhatsApp. Separate from sendWhatsAppMessage since this isn't tied to
// a customer record — it's a message to the owner themselves.
export async function sendOwnerReportMessage(
  cafeId: string,
  ownerPhone: string,
  messageText: string
) {
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
    return true;
  }

  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      console.error("Owner report: WhatsApp credentials missing");
      return false;
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
      console.error("Owner report send failed:", errorBody);
      return false;
    }

    await supabase.from("whatsapp_messages").insert({
      cafe_id: cafeId,
      customer_id: null,
      campaign_type: "owner_digest",
      message_text: messageText,
    });

    return true;
  } catch (err) {
    console.error("sendOwnerReportMessage error:", err);
    return false;
  }
}
