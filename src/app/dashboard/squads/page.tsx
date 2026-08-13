import { createClient } from "@/lib/supabase/server";
import CreateSquadForm from "./CreateSquadForm";
import SquadMembers from "./SquadMembers";
import { rolloverExpiredSquadCycles } from "@/lib/squads/rollover";

export default async function SquadsPage() {
  const supabase = await createClient();

  const { data: cafeForRollover } = await supabase.from("cafes").select("id").limit(1).maybeSingle();
  if (cafeForRollover) {
    await rolloverExpiredSquadCycles(cafeForRollover.id);
  }

  const { data: squads, error } = await supabase
    .from("squads")
    .select("*, leader:leader_customer_id(name, phone)")
    .order("created_at", { ascending: false });

  const { data: cafe } = await supabase.from("cafes").select("id").limit(1).maybeSingle();

  const squadIds = (squads ?? []).map((s: any) => s.id);
  const { data: allMembers } =
    squadIds.length > 0
      ? await supabase.from("customers").select("id, name, phone, squad_id").in("squad_id", squadIds)
      : { data: [] };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-8 py-12 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="label mb-2">Shared-Hour Group Subscriptions</p>
          <h1 className="text-3xl font-bold tracking-tight">Squads</h1>
        </div>
        {cafe && <CreateSquadForm cafeId={cafe.id} />}
      </div>

      {error && (
        <div className="surface rounded p-4 border-[var(--danger)] text-[var(--danger)] text-sm mb-6">
          Failed to load squads: {error.message}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {squads && squads.length > 0 ? (
          squads.map((s: any) => {
            const usedPct = s.shared_hours_pool > 0
              ? Math.min(100, (s.hours_used_this_cycle / s.shared_hours_pool) * 100)
              : 0;
            const members = (allMembers ?? []).filter((m: any) => m.squad_id === s.id);

            return (
              <div key={s.id} className="surface rounded-lg p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold">{s.name}</h3>
                  <span className="label">{s.squad_type}</span>
                </div>
                <p className="text-xs text-[var(--text-dim)] mb-4">
                  {s.leader?.name ?? s.leader?.phone ?? "Unassigned"} &middot; {s.plan_tier ?? "custom"}
                </p>

                <div className="flex justify-between text-xs text-[var(--text-dim)] mb-1.5">
                  <span>{s.hours_used_this_cycle}h / {s.shared_hours_pool}h</span>
                  <span>{usedPct.toFixed(0)}%</span>
                </div>
                <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden mb-4">
                  <div
                    className={`h-full ${usedPct > 90 ? "bg-[var(--danger)]" : "bg-[var(--accent)]"}`}
                    style={{ width: `${usedPct}%` }}
                  />
                </div>

                {s.monthly_fee && (
                  <p className="text-xs text-[var(--text-dim)] mb-4">
                    ₹{s.monthly_fee}/month &middot; {s.streak_weeks} week streak
                  </p>
                )}

                {cafe && <SquadMembers squadId={s.id} cafeId={cafe.id} members={members} />}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-[var(--text-dim)] col-span-full py-8">No squads yet &mdash; create one above.</p>
        )}
      </div>
    </div>
  );
}
