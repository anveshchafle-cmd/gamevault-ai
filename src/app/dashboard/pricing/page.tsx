import { createClient } from "@/lib/supabase/server";
import CreatePricingRuleForm from "./CreatePricingRuleForm";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function PricingPage() {
  const supabase = await createClient();

  const { data: rules, error } = await supabase
    .from("pricing_rules")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: cafe } = await supabase.from("cafes").select("id").limit(1).maybeSingle();

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dynamic Pricing</h1>
        <p className="text-neutral-400 text-sm">
          Transparent, rule-based pricing — no bidding wars, no hidden multipliers
        </p>
      </div>

      {cafe && <CreatePricingRuleForm cafeId={cafe.id} />}

      {error && (
        <div className="mt-6 rounded-md border border-red-800 bg-red-950/40 px-4 py-3 text-red-300">
          Failed to load rules: {error.message}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-800 text-neutral-400">
            <tr>
              <th className="text-left px-4 py-2">Rule</th>
              <th className="text-left px-4 py-2">Tier</th>
              <th className="text-left px-4 py-2">Days</th>
              <th className="text-left px-4 py-2">Time</th>
              <th className="text-left px-4 py-2">Occupancy</th>
              <th className="text-left px-4 py-2">Multiplier</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rules && rules.length > 0 ? (
              rules.map((r) => (
                <tr key={r.id} className="border-t border-neutral-800">
                  <td className="px-4 py-2 font-medium">{r.rule_name}</td>
                  <td className="px-4 py-2 text-neutral-400">{r.station_tier ?? "all"}</td>
                  <td className="px-4 py-2 text-neutral-400">
                    {r.day_of_week && r.day_of_week.length > 0
                      ? r.day_of_week.map((d) => DAYS[d]).join(", ")
                      : "all"}
                  </td>
                  <td className="px-4 py-2 text-neutral-400">
                    {r.start_time && r.end_time ? `${r.start_time}–${r.end_time}` : "all day"}
                  </td>
                  <td className="px-4 py-2 text-neutral-400">
                    {r.min_occupancy_pct != null || r.max_occupancy_pct != null
                      ? `${r.min_occupancy_pct ?? 0}–${r.max_occupancy_pct ?? 100}%`
                      : "any"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        r.price_multiplier > 1
                          ? "text-red-400"
                          : r.price_multiplier < 1
                          ? "text-emerald-400"
                          : "text-neutral-400"
                      }
                    >
                      {r.price_multiplier}x
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        r.is_active
                          ? "bg-emerald-900/50 text-emerald-300"
                          : "bg-neutral-800 text-neutral-500"
                      }`}
                    >
                      {r.is_active ? "active" : "inactive"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  No pricing rules yet — create one above. Without rules, all sessions bill at
                  each station's base rate.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
