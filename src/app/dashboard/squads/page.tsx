import { createClient } from "@/lib/supabase/server";
import CreateSquadForm from "./CreateSquadForm";

export default async function SquadsPage() {
  const supabase = await createClient();

  const { data: squads, error } = await supabase
    .from("squads")
    .select("*, leader:leader_customer_id(name, phone)")
    .order("created_at", { ascending: false });

  const { data: cafe } = await supabase.from("cafes").select("id").limit(1).maybeSingle();

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Squad Passes</h1>
          <p className="text-neutral-400 text-sm">
            Shared-hours group subscriptions — Squad, Family, College Gang, Corporate
          </p>
        </div>
      </div>

      {cafe && <CreateSquadForm cafeId={cafe.id} />}

      {error && (
        <div className="mt-6 rounded-md border border-red-800 bg-red-950/40 px-4 py-3 text-red-300">
          Failed to load squads: {error.message}
        </div>
      )}

      <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {squads && squads.length > 0 ? (
          squads.map((s: any) => {
            const usedPct =
              s.shared_hours_pool > 0
                ? Math.min(100, (s.hours_used_this_cycle / s.shared_hours_pool) * 100)
                : 0;
            return (
              <div
                key={s.id}
                className="rounded-lg border border-neutral-800 bg-neutral-950 p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold">{s.name}</h3>
                  <span className="text-[10px] uppercase tracking-wide bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                    {s.squad_type}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mb-3">
                  Leader: {s.leader?.name ?? s.leader?.phone ?? "Unassigned"} · {s.plan_tier ?? "custom"}
                </p>

                <div className="mb-1 flex justify-between text-xs text-neutral-400">
                  <span>
                    {s.hours_used_this_cycle}h / {s.shared_hours_pool}h used
                  </span>
                  <span>{usedPct.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full ${usedPct > 90 ? "bg-red-500" : "bg-emerald-600"}`}
                    style={{ width: `${usedPct}%` }}
                  />
                </div>

                {s.monthly_fee && (
                  <p className="text-xs text-neutral-500 mt-3">
                    ₹{s.monthly_fee}/month · {s.streak_weeks} week streak
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center text-neutral-500 py-12">
            No squads yet — create one above.
          </div>
        )}
      </div>
    </div>
  );
}
