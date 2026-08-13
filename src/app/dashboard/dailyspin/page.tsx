import { createClient } from "@/lib/supabase/server";
import SpinWheel from "./SpinWheel";

export default async function DailySpinPage() {
  const supabase = await createClient();
  const { data: cafe } = await supabase.from("cafes").select("id").limit(1).maybeSingle();

  const { data: recentSpins } = await supabase
    .from("customer_events")
    .select("*, customers(name, phone)")
    .eq("event_type", "daily_spin")
    .order("occurred_at", { ascending: false })
    .limit(12);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-8 py-12 max-w-3xl mx-auto">
      <p className="label mb-2">Free &middot; Once Per Day &middot; Disclosed Rewards</p>
      <h1 className="text-3xl font-bold tracking-tight mb-10">Daily Spin</h1>

      {cafe && <SpinWheel cafeId={cafe.id} />}

      <section className="mt-14">
        <p className="label mb-4">Recent Spins</p>
        <div className="space-y-0">
          {recentSpins && recentSpins.length > 0 ? (
            recentSpins.map((s: any) => (
              <div key={s.id} className="grid grid-cols-3 gap-4 py-3 border-b border-[var(--border)] text-sm items-center">
                <span>{s.customers?.name ?? s.customers?.phone}</span>
                <span className="text-[var(--accent)]">{s.event_payload?.reward?.label ?? "—"}</span>
                <span className="text-[var(--text-dim)] text-xs">{new Date(s.occurred_at).toLocaleDateString()}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--text-dim)] py-4">No spins yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
