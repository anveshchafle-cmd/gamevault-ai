import { createServiceRoleClient } from "@/lib/supabase/server";

// Called whenever the squads page loads. Checks every squad's cycle end
// date — if it's passed, resets hours_used_this_cycle to 0, rolls the
// cycle window forward another 30 days, and increments streak_weeks if
// the squad actually used hours last cycle (a rough "stayed active" proxy).
export async function rolloverExpiredSquadCycles(cafeId: string) {
  const supabase = createServiceRoleClient();

  const today = new Date().toISOString().split("T")[0];

  const { data: expiredSquads } = await supabase
    .from("squads")
    .select("id, cycle_ends_at, hours_used_this_cycle, streak_weeks")
    .eq("cafe_id", cafeId)
    .lt("cycle_ends_at", today);

  if (!expiredSquads || expiredSquads.length === 0) return { rolledOver: 0 };

  let rolledOver = 0;

  for (const squad of expiredSquads) {
    const newCycleStart = new Date();
    const newCycleEnd = new Date();
    newCycleEnd.setDate(newCycleEnd.getDate() + 30);

    const wasActive = (squad.hours_used_this_cycle ?? 0) > 0;

    await supabase
      .from("squads")
      .update({
        hours_used_this_cycle: 0,
        cycle_starts_at: newCycleStart.toISOString().split("T")[0],
        cycle_ends_at: newCycleEnd.toISOString().split("T")[0],
        streak_weeks: wasActive ? (squad.streak_weeks ?? 0) + 1 : 0,
      })
      .eq("id", squad.id);

    rolledOver++;
  }

  return { rolledOver };
}
