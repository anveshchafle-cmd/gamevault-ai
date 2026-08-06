import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send";
import { churnRecoveryMessage } from "@/lib/whatsapp/templates";

export async function GET() {
  const supabase = createServiceRoleClient();
  const summary: { scanned: number; messagesSent: number; customers: string[] } = {
    scanned: 0,
    messagesSent: 0,
    customers: [],
  };

  // Get all customers along with their most recent session start time
  const { data: customers, error: customersError } = await supabase
    .from("customers")
    .select("id, cafe_id, name, phone, favorite_game");

  if (customersError || !customers) {
    return NextResponse.json(
      { error: customersError?.message ?? "Failed to fetch customers" },
      { status: 500 }
    );
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  for (const customer of customers) {
    summary.scanned++;

    // Find their most recent session
    const { data: lastSession } = await supabase
      .from("sessions")
      .select("started_at")
      .eq("customer_id", customer.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastSession) continue; // never visited, not a churn case yet
    const lastVisit = new Date(lastSession.started_at);
    if (lastVisit > sevenDaysAgo) continue; // still active, skip

    // Check if we already sent a churn message recently
    const { data: recentMessage } = await supabase
      .from("whatsapp_messages")
      .select("id, sent_at")
      .eq("customer_id", customer.id)
      .eq("campaign_type", "churn_recovery")
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentMessage && new Date(recentMessage.sent_at) > threeDaysAgo) {
      continue; // already messaged recently, don't spam
    }

    const daysInactive = Math.floor(
      (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
    );

    const messageText = churnRecoveryMessage(
      customer.name ?? "there",
      customer.favorite_game,
      daysInactive
    );

    const result = await sendWhatsAppMessage({
      cafeId: customer.cafe_id,
      customerId: customer.id,
      phone: customer.phone,
      campaignType: "churn_recovery",
      messageText,
    });

    if (result) {
      summary.messagesSent++;
      summary.customers.push(customer.name ?? customer.phone);
    }
  }

  return NextResponse.json(summary);
}
