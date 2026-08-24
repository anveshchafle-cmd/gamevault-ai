import { createClient } from "@/lib/supabase/server";
import CreatePricingRuleForm from "./CreatePricingRuleForm";
import { analyzeRuleElasticity } from "@/lib/pricing/elasticity";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function PricingPage() {
  const supabase = await createClient();

  const { data: rules, error } = await supabase
    .from("pricing_rules")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: cafe } = await supabase.from("cafes").select("id").limit(1).maybeSingle();

  const elasticityInsights = cafe ? await analyzeRuleElasticity(cafe.id) : [];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-8 py-12 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="label mb-2">Transparent, Rule-Based</p>
          <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
        </div>
        {cafe && <CreatePricingRuleForm cafeId={cafe.id} />}
      </div>

      {error && (
        <div className="surface rounded p-4 border-[var(--danger)] text-[var(--danger)] text-sm mb-6">
          Failed to load rules: {error.message}
        </div>
      )}

      {elasticityInsights.length > 0 && (
        <div className="mb-10">
          <p className="label mb-3">Revenue Insights (from real data)</p>
          <div className="space-y-3">
            {elasticityInsights.map((insight) => (
              <div key={insight.ruleId} className="surface rounded p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{insight.ruleName}</span>
                  <span className="text-xs text-[var(--text-dim)]">{insight.sampleSize} sessions analyzed</span>
                </div>
                <p className="text-xs text-[var(--text-dim)]">{insight.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-0">
        {rules && rules.length > 0 ? (
          rules.map((r) => {
            const days = r.day_of_week && r.day_of_week.length > 0
              ? r.day_of_week.map((d) => DAYS[d]).join(" + ")
              : "Every day";
            const occupancy = r.min_occupancy_pct != null || r.max_occupancy_pct != null
              ? `Occupancy ${r.min_occupancy_pct ?? 0}&ndash;${r.max_occupancy_pct ?? 100}%`
              : null;
            const direction = r.price_multiplier > 1 ? "increase" : r.price_multiplier < 1 ? "decrease" : "no change";

            return (
              <div key={r.id} className="py-5 border-b border-[var(--border)]">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold">{r.rule_name}</h3>
                  <span className={`font-stat text-sm font-semibold ${r.price_multiplier > 1 ? "text-[var(--danger)]" : r.price_multiplier < 1 ? "text-[var(--ok)]" : "text-[var(--text-dim)]"}`}>
                    {r.price_multiplier}x
                  </span>
                </div>
                <p className="text-sm text-[var(--text-dim)]">
                  {days} &middot; {r.station_tier ?? "All tiers"}
                  {occupancy && <> &middot; {occupancy}</>}
                  &middot; {r.price_multiplier}x is a {Math.abs((r.price_multiplier - 1) * 100).toFixed(0)}% {direction}
                </p>
                <p className="text-xs mt-1">
                  <span className={`label ${r.is_active ? "text-[var(--ok)]" : ""}`}>
                    {r.is_active ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-[var(--text-dim)] py-8">
            No pricing rules yet. Without rules, all sessions bill at each station's base rate.
          </p>
        )}
      </div>
    </div>
  );
}
