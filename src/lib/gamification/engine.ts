import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send";
import { milestoneMessage } from "@/lib/whatsapp/templates";

export async function onSessionCompleted(params: {
  cafeId: string;
  customerId: string;
  sessionId: string;
  durationMinutes: number;
  startedAt: string;
}) {
  const { cafeId, customerId, sessionId, durationMinutes, startedAt } = params;
  const supabase = createServiceRoleClient();

  const xpEarned = Math.floor(durationMinutes / 10) * 10;
  if (xpEarned > 0) {
    await awardXp(cafeId, customerId, xpEarned);
  }

  await checkFirstBlood(cafeId, customerId);
  await checkNightOwl(customerId, startedAt);
  await checkCenturyClub(cafeId, customerId);
  await checkClutchMaster(customerId);
  await checkNoRageQuit(customerId);
  await checkSquadLeader(customerId);
  await checkHundredHourMilestone(cafeId, customerId);

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

  if (!season) return;

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

async function checkClutchMaster(customerId: string) {
  const supabase = createServiceRoleClient();
  const { data: sessions } = await supabase
    .from("sessions")
    .select("started_at")
    .eq("customer_id", customerId)
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false });

  if (!sessions) return;

  const fridayWeeks = new Set<string>();
  for (const s of sessions) {
    const d = new Date(s.started_at);
    if (d.getDay() === 5) {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      fridayWeeks.add(weekStart.toISOString().split("T")[0]);
    }
  }

  const sortedWeeks = Array.from(fridayWeeks).sort().reverse();
  let consecutive = 1;
  for (let i = 1; i < sortedWeeks.length; i++) {
    const prev = new Date(sortedWeeks[i - 1]);
    const curr = new Date(sortedWeeks[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 7) {
      consecutive++;
      if (consecutive >= 5) {
        await grantAchievement(customerId, "clutch_master");
        return;
      }
    } else {
      consecutive = 1;
    }
  }
}

async function checkNoRageQuit(customerId: string) {
  const supabase = createServiceRoleClient();
  const { data: sessions } = await supabase
    .from("sessions")
    .select("duration_minutes")
    .eq("customer_id", customerId)
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(10);

  if (!sessions || sessions.length < 10) return;

  const allClean = sessions.every((s) => (s.duration_minutes ?? 0) >= 10);
  if (allClean) {
    await grantAchievement(customerId, "no_rage_quit");
  }
}

async function checkSquadLeader(customerId: string) {
  const supabase = createServiceRoleClient();
  const { count } = await supabase
    .from("customer_events")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("event_type", "referral_made");

    if (count && count >= 5) {
      await grantAchievement(customerId, "squad_leader");
    }
  }
  
  async function checkHundredHourMilestone(cafeId: string, customerId: string) {
    const supabase = createServiceRoleClient();
  
    const { data: sessions } = await supabase
      .from("sessions")
      .select("duration_minutes")
      .eq("customer_id", customerId)
      .not("ended_at", "is", null);
  
    const totalHours = (sessions ?? []).reduce(
      (sum, s) => sum + (s.duration_minutes ?? 0) / 60,
      0
    );
  
    // Only fire once, right as they cross the threshold — check they weren't
    // already over 100 before this session (rough guard against re-firing).
    const thisSessionHours = 0; // already counted above; guard via achievement-style uniqueness instead
    const { data: alreadySent } = await supabase
      .from("whatsapp_messages")
      .select("id")
      .eq("customer_id", customerId)
      .eq("campaign_type", "milestone")
      .maybeSingle();
  
    if (totalHours >= 100 && !alreadySent) {
      const { data: customer } = await supabase
        .from("customers")
        .select("name, phone")
        .eq("id", customerId)
        .maybeSingle();
  
      if (customer) {
        const messageText = milestoneMessage(
          customer.name ?? "there",
          "You just crossed 100 hours at GameVault! You're officially a LEGEND."
        );
        await sendWhatsAppMessage({
          cafeId,
          customerId,
          phone: customer.phone,
          campaignType: "milestone",
          messageText,
        });
      }
    }
  }
