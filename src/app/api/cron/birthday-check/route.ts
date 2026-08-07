import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send";
import { milestoneMessage } from "@/lib/whatsapp/templates";

export async function GET() {
  const supabase = createServiceRoleClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, cafe_id, name, phone, date_of_birth")
    .not("date_of_birth", "is", null);

  if (!customers) {
    return NextResponse.json({ sent: 0 });
  }

  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();
  const thisYear = today.getFullYear();

  let sent = 0;

  for (const customer of customers) {
    if (!customer.date_of_birth) continue;
    const dob = new Date(customer.date_of_birth);
    if (dob.getMonth() !== todayMonth || dob.getDate() !== todayDate) continue;

    // Avoid sending twice in the same year
    const { data: alreadySent } = await supabase
      .from("whatsapp_messages")
      .select("id, sent_at")
      .eq("customer_id", customer.id)
      .eq("campaign_type", "birthday")
      .gte("sent_at", `${thisYear}-01-01`)
      .maybeSingle();

    if (alreadySent) continue;

    const messageText = milestoneMessage(
      customer.name ?? "there",
      "Happy Birthday from all of us at GameVault! Come celebrate — first hour free today."
    );

    await sendWhatsAppMessage({
      cafeId: customer.cafe_id,
      customerId: customer.id,
      phone: customer.phone,
      campaignType: "birthday",
      messageText,
    });
    sent++;
  }

  return NextResponse.json({ sent });
}
