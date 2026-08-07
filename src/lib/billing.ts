import { createServiceRoleClient } from "@/lib/supabase/server";

// Call this when starting a session, to check if the customer belongs to
// an active squad with hours remaining. Returns the squad info if so,
// so the UI can offer "bill to squad" vs "bill individually".
export async function getEligibleSquadForCustomer(customerId: string) {
  const supabase = createServiceRoleClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("squad_id")
    .eq("id", customerId)
    .maybeSingle();

  if (!customer?.squad_id) return null;

  const { data: squad } = await supabase
    .from("squads")
    .select("*")
    .eq("id", customer.squad_id)
    .maybeSingle();

  if (!squad) return null;

  const today = new Date().toISOString().split("T")[0];
  const cycleActive =
    (!squad.cycle_starts_at || squad.cycle_starts_at <= today) &&
    (!squad.cycle_ends_at || squad.cycle_ends_at >= today);

  const hoursRemaining = squad.shared_hours_pool - squad.hours_used_this_cycle;

  if (!cycleActive || hoursRemaining <= 0) return null;

  return { squad, hoursRemaining };
}

// Call this from your endSession action, right after computing durationMinutes,
// ONLY if the session was flagged as squad-billed (rate_reason === 'squad_pass').
export async function deductSquadHours(squadId: string, durationMinutes: number) {
  const supabase = createServiceRoleClient();
  const hoursUsed = durationMinutes / 60;

  const { data: squad } = await supabase
    .from("squads")
    .select("hours_used_this_cycle, shared_hours_pool")
    .eq("id", squadId)
    .maybeSingle();

  if (!squad) return { success: false, error: "Squad not found" };

  const newUsed = Math.min(
    squad.shared_hours_pool,
    squad.hours_used_this_cycle + hoursUsed
  );

  const { error } = await supabase
    .from("squads")
    .update({ hours_used_this_cycle: newUsed })
    .eq("id", squadId);

  if (error) return { success: false, error: error.message };
  return { success: true, newHoursUsed: newUsed };
}
