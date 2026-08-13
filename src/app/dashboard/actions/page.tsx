import { createClient } from "@/lib/supabase/server";
import GenerateActionsButton from "./GenerateActionsButton";
import MarkDoneButton from "./MarkDoneButton";
import MeasureOutcomesButton from "./MeasureOutcomesButton";

const ACTION_LABELS: Record<string, { label: string }> = {
  send_churn_whatsapp: { label: "At Risk" },
  offer_vip_perk: { label: "Whale" },
  suggest_upsell: { label: "Grinder" },
  referral_push: { label: "Socialite" },
  no_action: { label: "—" },
};

export default async function ActionsPage() {
  const supabase = await createClient();

  const { data: actions, error } = await supabase
    .from("next_best_actions")
    .select("*, customers(name, phone)")
    .neq("recommended_action", "no_action")
    .order("expected_value", { ascending: false })
    .limit(30);

  const totalExpectedValue = (actions ?? []).reduce(
    (sum, a) => sum + Number(a.expected_value ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-8 py-12 max-w-4xl mx-auto">
      <p className="label mb-2">GameVault Intelligence</p>
      <h1 className="text-3xl font-bold tracking-tight mb-10">What To Do Right Now</h1>

      <div className="mb-10">
        <p className="label mb-2">Today's Opportunity</p>
        <p className="font-stat text-5xl font-bold text-[var(--accent)]">
          ₹{totalExpectedValue.toFixed(0)}
        </p>
        <p className="text-sm text-[var(--text-dim)] mt-2">
          Potential opportunity across {actions?.length ?? 0} customers
        </p>
      </div>

      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
        <p className="label">Prioritized Actions</p>
        <div className="flex items-center gap-3">
          <MeasureOutcomesButton />
          <GenerateActionsButton />
        </div>
      </div>

      {error && (
        <div className="surface rounded p-4 border-[var(--danger)] text-[var(--danger)] text-sm mb-6">
          Failed to load actions: {error.message}
        </div>
      )}

      <div className="space-y-0">
        {actions && actions.length > 0 ? (
          actions.map((a: any, i: number) => {
            const tag = ACTION_LABELS[a.recommended_action] ?? { label: "Signal" };
            return (
              <div
                key={a.id}
                className={`py-5 flex items-start justify-between gap-6 ${i !== actions.length - 1 ? "border-b border-[var(--border)]" : ""}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-medium">{a.customers?.name ?? a.customers?.phone}</span>
                    <span className="label opacity-70">{tag.label}</span>
                  </div>
                  <p className="text-sm text-[var(--text)] mb-1">
                    {a.recommended_action === "send_churn_whatsapp" && "Send churn recovery message"}
                    {a.recommended_action === "offer_vip_perk" && "Offer VIP perk"}
                    {a.recommended_action === "suggest_upsell" && "Suggest upsell"}
                    {a.recommended_action === "referral_push" && "Referral push"}
                  </p>
                  <p className="text-xs text-[var(--text-dim)]">{a.reasoning?.why ?? "No explanation available"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-stat text-lg font-semibold text-[var(--accent)] mb-2">
                    ₹{Number(a.expected_value ?? 0).toFixed(0)}
                  </p>
                  <MarkDoneButton
                    actionId={a.id}
                    wasExecuted={a.was_executed}
                    actualOutcomeValue={a.actual_outcome_value}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-[var(--text-dim)] py-8">
            No actions yet — click "Generate Actions" above (make sure you've run CLV recompute first).
          </p>
        )}
      </div>
    </div>
  );
}
