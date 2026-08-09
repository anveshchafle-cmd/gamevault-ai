import { createClient } from "@/lib/supabase/server";
import RecomputeClvButton from "./RecomputeClvButton";
import EditCustomerButton from "./EditCustomerButton";
import CopyReferralLinkButton from "./CopyReferralLinkButton";

const SEGMENT_STYLES: Record<string, { label: string; color: string }> = {
  whale: { label: "🐋 Whale", color: "bg-purple-900/50 text-purple-300" },
  grinder: { label: "⚙️ Grinder", color: "bg-blue-900/50 text-blue-300" },
  socialite: { label: "🤝 Socialite", color: "bg-emerald-900/50 text-emerald-300" },
  tourist: { label: "🎒 Tourist", color: "bg-neutral-800 text-neutral-400" },
  at_risk: { label: "⚠️ At Risk", color: "bg-red-900/50 text-red-300" },
  unscored: { label: "Unscored", color: "bg-neutral-800 text-neutral-500" },
};

const COMP_TIER_STYLES: Record<string, string> = {
  diamond: "bg-cyan-900/50 text-cyan-300",
  platinum: "bg-slate-700/50 text-slate-200",
  gold: "bg-yellow-900/50 text-yellow-300",
  silver: "bg-neutral-700/50 text-neutral-300",
  bronze: "bg-orange-900/50 text-orange-300",
  none: "bg-neutral-800 text-neutral-600",
};

export default async function ClvPage() {
  const supabase = await createClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, cafe_id, name, phone, clv_tier, clv_score, churn_risk_score, comp_tier, referral_code")
    .order("clv_score", { ascending: false, nullsFirst: false });

  const segmentCounts: Record<string, number> = {};
  (customers ?? []).forEach((c) => {
    const tier = c.clv_tier || "unscored";
    segmentCounts[tier] = (segmentCounts[tier] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customer Intelligence</h1>
          <p className="text-neutral-400 text-sm">
            CLV segmentation + comp tiers — recomputed on demand from last 30 days
          </p>
        </div>
        <RecomputeClvButton />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {Object.entries(SEGMENT_STYLES).map(([key, style]) => (
          <div key={key} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-center">
            <div className={`inline-block text-xs px-2 py-0.5 rounded mb-1 ${style.color}`}>
              {style.label}
            </div>
            <div className="text-xl font-bold">{segmentCounts[key] ?? 0}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-800 bg-red-950/40 px-4 py-3 text-red-300">
          Failed to load customers: {error.message}
        </div>
      )}

      <div className="rounded-lg border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-800 text-neutral-400">
            <tr>
              <th className="text-left px-4 py-2">Customer</th>
              <th className="text-left px-4 py-2">Segment</th>
              <th className="text-left px-4 py-2">Comp Tier</th>
              <th className="text-left px-4 py-2">Predicted LTV</th>
              <th className="text-left px-4 py-2">Churn Risk</th>
              <th className="text-left px-4 py-2">Referral Link</th>
              <th className="text-left px-4 py-2">Edit</th>
            </tr>
          </thead>
          <tbody>
            {customers && customers.length > 0 ? (
              customers.map((c) => {
                const style = SEGMENT_STYLES[c.clv_tier || "unscored"];
                const compStyle = COMP_TIER_STYLES[c.comp_tier || "none"];
                return (
                  <tr key={c.id} className="border-t border-neutral-800">
                    <td className="px-4 py-2">{c.name ?? c.phone}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${style.color}`}>
                        {style.label}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${compStyle}`}>
                        {c.comp_tier ?? "none"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-neutral-300">
                      {c.clv_score ? `₹${Number(c.clv_score).toFixed(0)}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-neutral-400">
                      {c.churn_risk_score != null ? `${(c.churn_risk_score * 100).toFixed(0)}%` : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <CopyReferralLinkButton referralCode={c.referral_code} />
                    </td>
                    <td className="px-4 py-2">
                      <EditCustomerButton customerId={c.id} cafeId={c.cafe_id} />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
