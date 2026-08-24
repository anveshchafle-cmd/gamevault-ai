import { createServiceRoleClient } from "@/lib/supabase/server";

// Analyzes past pricing_rule_applications against actual session revenue
// to find which multiplier level genuinely produced the most revenue per
// hour of occupancy, for a given rule. This is the "does raising the price
// actually make more money, or just lose customers" question, answered
// with real data instead of a guess.
export type ElasticityInsight = {
  ruleId: string;
  ruleName: string;
  currentMultiplier: number;
  sampleSize: number;
  avgRevenuePerApplication: number;
  suggestion: string;
};

export async function analyzeRuleElasticity(cafeId: string): Promise<ElasticityInsight[]> {
  const supabase = createServiceRoleClient();

  const { data: rules } = await supabase
    .from("pricing_rules")
    .select("id, rule_name, price_multiplier")
    .eq("cafe_id", cafeId)
    .eq("is_active", true);

  if (!rules || rules.length === 0) return [];

  const insights: ElasticityInsight[] = [];

  for (const rule of rules) {
    const { data: applications } = await supabase
      .from("pricing_rule_applications")
      .select("session_id, occupancy_pct_at_time")
      .eq("pricing_rule_id", rule.id);

    if (!applications || applications.length < 5) {
      insights.push({
        ruleId: rule.id,
        ruleName: rule.rule_name,
        currentMultiplier: rule.price_multiplier,
        sampleSize: applications?.length ?? 0,
        avgRevenuePerApplication: 0,
        suggestion: "Not enough data yet — need at least 5 applications to analyze.",
      });
      continue;
    }

    const sessionIds = applications.map((a) => a.session_id).filter(Boolean) as string[];
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, rate_applied, duration_minutes")
      .in("id", sessionIds);

    const totalRevenue = (sessions ?? []).reduce((sum, s) => {
      const hours = (s.duration_minutes ?? 0) / 60;
      return sum + hours * Number(s.rate_applied);
    }, 0);

    const avgRevenue = sessions && sessions.length > 0 ? totalRevenue / sessions.length : 0;
    const avgOccupancy =
      applications.reduce((sum, a) => sum + Number(a.occupancy_pct_at_time ?? 0), 0) / applications.length;

    let suggestion = `Averaging ₹${avgRevenue.toFixed(0)} per session at ${rule.price_multiplier}x, ${avgOccupancy.toFixed(0)}% avg occupancy when applied.`;
    if (avgOccupancy < 40 && rule.price_multiplier > 1) {
      suggestion += " Low occupancy at this multiplier — consider testing a lower rate to see if volume increases enough to offset.";
    } else if (avgOccupancy > 85 && rule.price_multiplier <= 1.2) {
      suggestion += " High occupancy even at this rate — there may be room to raise the multiplier without losing customers.";
    }

    insights.push({
      ruleId: rule.id,
      ruleName: rule.rule_name,
      currentMultiplier: rule.price_multiplier,
      sampleSize: applications.length,
      avgRevenuePerApplication: avgRevenue,
      suggestion,
    });
  }

  return insights;
}
