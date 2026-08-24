import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = createServiceRoleClient();

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { data: messages } = await supabase
    .from("whatsapp_messages")
    .select("id, customer_id, sent_at, variant")
    .eq("campaign_type", "churn_recovery")
    .is("led_to_visit", null)
    .lt("sent_at", threeDaysAgo.toISOString());

  if (!messages || messages.length === 0) {
    return NextResponse.json({ measured: 0 });
  }

  let measured = 0;

  for (const message of messages) {
    if (!message.customer_id) continue;

    const windowEnd = new Date(message.sent_at);
    windowEnd.setDate(windowEnd.getDate() + 3);

    const { data: sessionsAfter } = await supabase
      .from("sessions")
      .select("id")
      .eq("customer_id", message.customer_id)
      .gte("started_at", message.sent_at)
      .lte("started_at", windowEnd.toISOString())
      .limit(1);

    const ledToVisit = (sessionsAfter?.length ?? 0) > 0;

    await supabase
      .from("whatsapp_messages")
      .update({ led_to_visit: ledToVisit })
      .eq("id", message.id);

    measured++;
  }

  return NextResponse.json({ measured });
}
