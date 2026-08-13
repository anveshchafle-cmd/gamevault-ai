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

  const { data: customers, error: customersError } = await supabase
    .from("customers")
    .select("id, cafe_id, name, phone, favorite_game");

  if (customersError || !customers) {
    return NextResponse.json(
      { error: customersError?.message ?? "Failed to fetch customers" },
      { status: 500 }
    );
  }

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  for (const customer of customers) {
    summary.scanned++;

    // Pull this customer's full visit history to learn their normal rhythm
    const { data: allSessions } = await supabase
      .from("sessions")
      .select("started_at")
      .eq("customer_id", customer.id)
      .order("started_at", { ascending: false });

    if (!allSessions || allSessions.length === 0) continue; // never visited, not a churn case

    const lastVisit = new Date(allSessions[0].started_at);
    const daysInactive = Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

    // Personalized threshold: median gap between this customer's own visits.
    // Falls back to a flat 7 days if there's not enough history to learn a pattern yet.
    let threshold = 7;
    if (allSessions.length >= 3) {
      const gaps: number[] = [];
      for (let i = 0; i < allSessions.length - 1; i++) {
        const a = new Date(allSessions[i].started_at).getTime();
        const b = new Date(allSessions[i + 1].started_at).getTime();
        gaps.push((a - b) / (1000 * 60 * 60 * 24));
      }
      gaps.sort((x, y) => x - y);
      const medianGap = gaps[Math.floor(gaps.length / 2)];
      // Flag once they've gone noticeably past their own normal rhythm (1.5x),
      // with sane floor/ceiling so it never fires too early or waits forever.
      threshold = Math.min(30, Math.max(3, Math.round(medianGap * 1.5)));
    }

    if (daysInactive < threshold) continue; // still within their normal rhythm

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
