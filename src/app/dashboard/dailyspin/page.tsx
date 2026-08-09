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
    .limit(15);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Daily Spin</h1>
        <p className="text-neutral-400 text-sm">
          Free loyalty perk — once per customer per day, no payment, fixed reward pool
        </p>
      </div>

      {cafe && <SpinWheel cafeId={cafe.id} />}

      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Recent Spins</h2>
        <div className="rounded-lg border border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-800 text-neutral-400">
              <tr>
                <th className="text-left px-4 py-2">Customer</th>
                <th className="text-left px-4 py-2">Reward</th>
                <th className="text-left px-4 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {recentSpins && recentSpins.length > 0 ? (
                recentSpins.map((s: any) => (
                  <tr key={s.id} className="border-t border-neutral-800">
                    <td className="px-4 py-2">{s.customers?.name ?? s.customers?.phone}</td>
                    <td className="px-4 py-2 text-emerald-400">
                      {s.event_payload?.reward?.label ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-neutral-400">
                      {new Date(s.occurred_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">
                    No spins yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
