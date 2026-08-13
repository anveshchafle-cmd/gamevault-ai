import { createClient } from "@/lib/supabase/server";
import RecomputeClvButton from "./RecomputeClvButton";
import EditCustomerButton from "./EditCustomerButton";
import CopyReferralLinkButton from "./CopyReferralLinkButton";

const SEGMENT_LABEL: Record<string, string> = {
  whale: "Whale",
  grinder: "Grinder",
  socialite: "Socialite",
  tourist: "Tourist",
  at_risk: "At Risk",
  unscored: "Unscored",
};

const COMP_LABEL: Record<string, string> = {
  diamond: "Diamond",
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
  none: "—",
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-8 py-12 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="label mb-2">Customer Intelligence</p>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        </div>
        <RecomputeClvButton />
      </div>

      <div className="grid grid-cols-5 gap-6 mb-10 pb-10 border-b border-[var(--border)]">
        {Object.entries(SEGMENT_LABEL).map(([key, label]) => (
          <div key={key}>
            <p className="label mb-1">{label}</p>
            <p className="font-stat text-2xl font-semibold">{segmentCounts[key] ?? 0}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="surface rounded p-4 border-[var(--danger)] text-[var(--danger)] text-sm mb-6">
          Failed to load customers: {error.message}
        </div>
      )}

      <div className="space-y-0">
        <div className="grid grid-cols-6 gap-4 pb-3 border-b border-[var(--border)]">
          <span className="label">Customer</span>
          <span className="label">Segment</span>
          <span className="label">Comp Tier</span>
          <span className="label">LTV</span>
          <span className="label">Referral</span>
          <span className="label">Edit</span>
        </div>
        {customers && customers.length > 0 ? (
          customers.map((c) => (
            <div key={c.id} className="grid grid-cols-6 gap-4 py-4 border-b border-[var(--border)] items-center text-sm">
              <span>{c.name ?? c.phone}</span>
              <span className="text-[var(--text-dim)]">{SEGMENT_LABEL[c.clv_tier || "unscored"]}</span>
              <span className="text-[var(--text-dim)]">{COMP_LABEL[c.comp_tier || "none"]}</span>
              <span className="font-stat">{c.clv_score ? `₹${Number(c.clv_score).toFixed(0)}` : "—"}</span>
              <CopyReferralLinkButton referralCode={c.referral_code} />
              <EditCustomerButton customerId={c.id} cafeId={c.cafe_id} />
            </div>
          ))
        ) : (
          <p className="text-sm text-[var(--text-dim)] py-8">No customers yet.</p>
        )}
      </div>
    </div>
  );
}
