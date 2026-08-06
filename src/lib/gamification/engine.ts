import { createServiceRoleClient } from "@/lib/supabase/server";

// Call this once, right after a session's ended_at gets set (i.e. at the
// end of your existing endSession server action). It's intentionally a
// single entry point so all gamification logic lives in one place.
export async function onSessionCompleted(params: {
  cafeId: string;
  customerId: string;
  sessionId: string;
  durationMinutes: number;
  startedAt: string; // ISO timestamp
}) {
  const { cafeId, customerId, sessionId, durationMinutes, startedAt } = params;
  const supabase = createServiceRoleClient();

  // --- XP: 10 XP per 10 minutes played, credited to the active season ---
  const xpEarned = Math.floor(durationMinutes / 10) * 10;
  if (xpEarned > 0) {
    await awardXp(cafeId, customerId, xpEarned);
  }

  // --- Achievements ---
  await checkFirstBlood(cafeId, customerId);
  await checkNightOwl(customerId, startedAt);
  await checkCenturyClub(cafeId, customerId);

  return { xpEarned };
}

async function awardXp(cafeId: string, customerId: string, xp: number) {
  const supabase = createServiceRoleClient();

  const { data: season } = await supabase
    .from("battle_pass_seasons")
    .select("id")
    .eq("cafe_id", cafeId)
    .eq("is_active", true)
    .maybeSingle();

  if (!season) return; // no active season, nothing to award into

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
      current_xp: xp,
      current_tier: 0,
    });
  } else {
    await supabase
      .from("customer_battle_pass_progress")
      .update({ current_xp: progress.current_xp + xp, updated_at: new Date().toISOString() })
      .eq("id", progress.id);
  }

  // Recompute current_tier based on new XP total against the season's tiers
  const { data: tiers } = await supabase
    .from("battle_pass_tiers")
    .select("tier_number, xp_required")
    .eq("season_id", season.id)
    .order("tier_number", { ascending: true });

  if (tiers) {
    const { data: updatedProgress } = await supabase
      .from("customer_battle_pass_progress")
      .select("current_xp")
      .eq("customer_id", customerId)
      .eq("season_id", season.id)
      .maybeSingle();

    if (updatedProgress) {
      const highestTierReached = tiers
        .filter((t) => updatedProgress.current_xp >= t.xp_required)
        .reduce((max, t) => Math.max(max, t.tier_number), 0);

      await supabase
        .from("customer_battle_pass_progress")
        .update({ current_tier: highestTierReached })
        .eq("customer_id", customerId)
        .eq("season_id", season.id);
    }
  }
}

async function grantAchievement(customerId: string, code: string) {
  const supabase = createServiceRoleClient();
  // unique constraint on (customer_id, achievement_code) prevents duplicates —
  // this insert will just silently no-op via on-conflict-style handling
  const { data: existing } = await supabase
    .from("customer_achievements")
    .select("id")
    .eq("customer_id", customerId)
    .eq("achievement_code", code)
    .maybeSingle();

  if (!existing) {
    await supabase.from("customer_achievements").insert({
      customer_id: customerId,
      achievement_code: code,
    });
  }
}

async function checkFirstBlood(cafeId: string, customerId: string) {
  const supabase = createServiceRoleClient();
  const { count } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .not("ended_at", "is", null);

  if (count && count >= 1) {
    await grantAchievement(customerId, "first_blood");
  }
}

async function checkNightOwl(customerId: string, startedAt: string) {
  const hour = new Date(startedAt).getHours();
  if (hour >= 22 || hour < 4) {
    await grantAchievement(customerId, "night_owl");
  }
}

async function checkCenturyClub(cafeId: string, customerId: string) {
  const supabase = createServiceRoleClient();
  const { data: sessions } = await supabase
    .from("sessions")
    .select("duration_minutes")
    .eq("customer_id", customerId)
    .not("ended_at", "is", null);

  const totalMinutes = (sessions ?? []).reduce(
    (sum, s) => sum + (s.duration_minutes ?? 0),
    0
  );

  if (totalMinutes >= 100 * 60) {
    await grantAchievement(customerId, "century_club");
  }
}
