import { createServiceRoleClient } from "@/lib/supabase/server";

// Rule-based Next-Best-Action generator for v1. For each customer, looks
// at their latest CLV snapshot and decides the single highest-value action
// to take right now. A trained ranking model can replace this logic later
// without changing the next_best_actions table shape or the dashboard.
export async function generateNextBestActions(cafeId: string) {
  const supabase = createServiceRoleClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, phone, clv_tier, clv_score")
    .eq("cafe_id", cafeId);

  if (!customers) return { generated: 0 };

  let generated = 0;

  for (const customer of customers) {
    const { data: latestSnapshot } = await supabase
      .from("customer_clv_snapshots")
      .select("*")
      .eq("customer_id", customer.id)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestSnapshot) continue;

    let action = "no_action";
    let reasoning: Record<string, unknown> = {};
    let expectedValue = 0;

    if (latestSnapshot.segment === "at_risk") {
      action = "send_churn_whatsapp";
      reasoning = {
        why: `Recency ${latestSnapshot.recency_days} days, was active before. High risk of full churn.`,
        segment: latestSnapshot.segment,
      };
      expectedValue = Number(latestSnapshot.monetary_30d ?? 0) * 0.2; // recovery estimate
    } else if (latestSnapshot.segment === "whale") {
      action = "offer_vip_perk";
      reasoning = {
        why: `Top spender this month (₹${latestSnapshot.monetary_30d}). Retention here has outsized impact.`,
        segment: latestSnapshot.segment,
      };
      expectedValue = Number(latestSnapshot.monetary_30d ?? 0) * 0.15;
    } else if (latestSnapshot.segment === "grinder") {
      action = "suggest_upsell";
      reasoning = {
        why: `High session frequency (${latestSnapshot.frequency_30d} visits) but lower spend. Food/merch upsell opportunity.`,
        segment: latestSnapshot.segment,
      };
      expectedValue = Number(latestSnapshot.frequency_30d ?? 0) * 30; // est. upsell per visit
    } else if (latestSnapshot.segment === "socialite") {
      action = "referral_push";
      reasoning = {
        why: "Already brings friends — a referral nudge is likely to compound.",
        segment: latestSnapshot.segment,
      };
      expectedValue = 200;
    } else {
      action = "no_action";
      reasoning = { why: "No strong signal yet — insufficient activity." };
      expectedValue = 0;
    }

    await supabase.from("next_best_actions").insert({
      cafe_id: cafeId,
      customer_id: customer.id,
      recommended_action: action,
      reasoning,
      expected_value: expectedValue,
      was_executed: false,
    });

    generated++;
  }

  return { generated };
}
