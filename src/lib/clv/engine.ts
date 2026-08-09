import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCompTier } from "@/lib/comps/engine";

export async function recomputeClvForCafe(cafeId: string) {
  const supabase = createServiceRoleClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id")
    .eq("cafe_id", cafeId);

  if (!customers) return { scored: 0 };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let scored = 0;

  for (const customer of customers) {
    const { data: recentSessions } = await supabase
      .from("sessions")
      .select("started_at")
      .eq("customer_id", customer.id)
      .gte("started_at", thirtyDaysAgo.toISOString())
      .order("started_at", { ascending: false });

    const { data: recentTransactions } = await supabase
      .from("transactions")
      .select("total_amount")
      .eq("customer_id", customer.id)
      .gte("created_at", thirtyDaysAgo.toISOString());

    const { count: referralCount } = await supabase
      .from("customer_events")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customer.id)
      .eq("event_type", "referral_made");

    const frequency30d = recentSessions?.length ?? 0;
    const monetary30d =
      recentTransactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) ?? 0;

    let recencyDays: number | null = null;
    if (recentSessions && recentSessions.length > 0) {
      const lastVisit = new Date(recentSessions[0].started_at);
      recencyDays = Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
    }

    let segment = "tourist";
    if (recencyDays !== null && recencyDays > 14) {
      segment = "at_risk";
    } else if (monetary30d >= 2000 && frequency30d >= 4) {
      segment = "whale";
    } else if (frequency30d >= 6) {
      segment = "grinder";
    } else if ((referralCount ?? 0) >= 2) {
      segment = "socialite";
    } else if (frequency30d >= 1) {
      segment = "tourist";
    }

    const predictedLtv = monetary30d * 12;
    const compTierInfo = getCompTier(monetary30d);

    await supabase.from("customer_clv_snapshots").insert({
      customer_id: customer.id,
      recency_days: recencyDays,
      frequency_30d: frequency30d,
      monetary_30d: monetary30d,
      predicted_ltv: predictedLtv,
      segment,
      computed_by: "rule_engine",
    });

    await supabase
      .from("customers")
      .update({
        clv_tier: segment,
        clv_score: predictedLtv,
        comp_tier: compTierInfo.tier,
      })
      .eq("id", customer.id);

    scored++;
  }

  return { scored };
}
