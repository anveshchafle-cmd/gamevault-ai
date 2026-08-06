import { createServiceRoleClient } from "@/lib/supabase/server";

type SendWhatsAppParams = {
  cafeId: string;
  customerId: string;
  phone: string;
  campaignType: string;
  variant?: string;
  messageText: string;
};

export async function sendWhatsAppMessage(params: SendWhatsAppParams) {
  const { cafeId, customerId, phone, campaignType, variant, messageText } = params;
  const isLive = process.env.WHATSAPP_MODE === "live";
  const supabase = createServiceRoleClient();

  if (!isLive) {
    console.log(
      `\n[DRY RUN] Would send to ${phone} (campaign: ${campaignType})\nMessage: ${messageText}\n`
    );

    const { data, error } = await supabase
      .from("whatsapp_messages")
      .insert({
        cafe_id: cafeId,
        customer_id: customerId,
        campaign_type: campaignType,
        variant: variant ?? "default",
        message_text: `[DRY RUN] ${messageText}`,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to log dry-run message:", error);
      return null;
    }
    return data;
  }

  // Live mode — actually call Meta's WhatsApp Cloud API
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      console.error("WHATSAPP_MODE is 'live' but credentials are missing in .env.local");
      return null;
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
          to: phone,
          type: "text",
          text: { body: messageText },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("WhatsApp API send failed:", errorBody);
      return null;
    }

    const { data, error } = await supabase
      .from("whatsapp_messages")
      .insert({
        cafe_id: cafeId,
        customer_id: customerId,
        campaign_type: campaignType,
        variant: variant ?? "default",
        message_text: messageText,
      })
      .select()
      .single();

    if (error) {
      console.error("Message sent but failed to log:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("sendWhatsAppMessage error:", err);
    return null;
  }
}
