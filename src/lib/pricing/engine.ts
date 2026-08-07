import { createServiceRoleClient } from "@/lib/supabase/server";

export async function computeRateForStation(
  stationId: string,
  cafeId: string,
  baseHourlyRate: number,
  stationTier: string
): Promise<{ rate: number; reason: string; ruleId: string | null }> {
  const supabase = createServiceRoleClient();

  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = now.toTimeString().slice(0, 8);

  const { data: rules } = await supabase
    .from("pricing_rules")
    .select("*")
    .eq("cafe_id", cafeId)
    .eq("is_active", true);

  if (!rules || rules.length === 0) {
    return { rate: baseHourlyRate, reason: "base", ruleId: null };
  }

  const { data: allStations } = await supabase
    .from("stations")
    .select("id, status")
    .eq("cafe_id", cafeId);

  const totalStations = allStations?.length ?? 1;
  const occupiedStations = allStations?.filter((s) => s.status === "occupied").length ?? 0;
  const occupancyPct = (occupiedStations / totalStations) * 100;

  const matchingRule = rules.find((rule) => {
    if (rule.station_tier && rule.station_tier !== stationTier) return false;
    if (rule.day_of_week && rule.day_of_week.length > 0) {
      if (!rule.day_of_week.includes(dayOfWeek)) return false;
    }
    if (rule.start_time && rule.end_time) {
      if (currentTime < rule.start_time || currentTime > rule.end_time) return false;
    }
    if (rule.min_occupancy_pct != null && occupancyPct < rule.min_occupancy_pct) return false;
    if (rule.max_occupancy_pct != null && occupancyPct > rule.max_occupancy_pct) return false;
    return true;
  });

  if (!matchingRule) {
    return { rate: baseHourlyRate, reason: "base", ruleId: null };
  }

  const rate = Math.round(baseHourlyRate * matchingRule.price_multiplier * 100) / 100;

  await supabase.from("pricing_rule_applications").insert({
    pricing_rule_id: matchingRule.id,
    occupancy_pct_at_time: occupancyPct,
  });

  return { rate, reason: matchingRule.rule_name, ruleId: matchingRule.id };
}
