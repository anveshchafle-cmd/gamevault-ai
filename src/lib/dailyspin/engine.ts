import { createServiceRoleClient } from "@/lib/supabase/server";

// Free daily spin — no payment, fixed disclosed reward pool. This is
// deliberately NOT a paid randomized mechanic (that would be gambling).
// Once per customer per calendar day, purely a loyalty perk.
export type SpinReward = {
  label: string;
  type: "xp" | "discount" | "shoutout";
  value: number;
};

const REWARD_POOL: SpinReward[] = [
  { label: "10 XP", type: "xp", value: 10 },
  { label: "20 XP", type: "xp", value: 20 },
  { label: "50 XP", type: "xp", value: 50 },
  { label: "5% off your next food order", type: "discount", value: 5 },
  { label: "10% off your next food order", type: "discount", value: 10 },
  { label: "Shoutout on the leaderboard screen", type: "shoutout", value: 0 },
];

export async function canSpinToday(customerId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("customer_events")
    .select("id")
    .eq("customer_id", customerId)
    .eq("event_type", "daily_spin")
    .gte("occurred_at", startOfDay.toISOString())
    .maybeSingle();

  return !data;
}

export async function performDailySpin(
  cafeId: string,
  customerId: string
): Promise<{ success: boolean; reward?: SpinReward; error?: string }> {
  const supabase = createServiceRoleClient();

  const eligible = await canSpinToday(customerId);
  if (!eligible) {
    return { success: false, error: "Already spun today — come back tomorrow!" };
  }

  const reward = REWARD_POOL[Math.floor(Math.random() * REWARD_POOL.length)];

  await supabase.from("customer_events").insert({
    cafe_id: cafeId,
    customer_id: customerId,
    event_type: "daily_spin",
    event_payload: { reward },
  });

  if (reward.type === "xp") {
    const { data: season } = await supabase
      .from("battle_pass_seasons")
      .select("id")
      .eq("cafe_id", cafeId)
      .eq("is_active", true)
      .maybeSingle();

    if (season) {
      const { data: progress } = await supabase
        .from("customer_battle_pass_progress")
        .select("*")
        .eq("customer_id", customerId)
        .eq("season_id", season.id)
        .maybeSingle();

      if (!progress) {
        await supabase.from("customer_battle_pass_progress").insert({
          customer_id: customerId,
          season_id: season.id,
          current_xp: reward.value,
          current_tier: 0,
        });
      } else {
        await supabase
          .from("customer_battle_pass_progress")
          .update({ current_xp: progress.current_xp + reward.value })
          .eq("id", progress.id);
      }
    }
  }

  return { success: true, reward };
}
