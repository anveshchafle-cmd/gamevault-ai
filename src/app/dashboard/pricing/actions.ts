"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPricingRule(formData: {
  cafeId: string;
  ruleName: string;
  stationTier: string | null;
  daysOfWeek: number[];
  startTime: string | null;
  endTime: string | null;
  priceMultiplier: number;
  minOccupancyPct: number | null;
  maxOccupancyPct: number | null;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("pricing_rules").insert({
    cafe_id: formData.cafeId,
    rule_name: formData.ruleName,
    station_tier: formData.stationTier,
    day_of_week: formData.daysOfWeek.length > 0 ? formData.daysOfWeek : null,
    start_time: formData.startTime,
    end_time: formData.endTime,
    price_multiplier: formData.priceMultiplier,
    min_occupancy_pct: formData.minOccupancyPct,
    max_occupancy_pct: formData.maxOccupancyPct,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/pricing");
  return { success: true };
}
