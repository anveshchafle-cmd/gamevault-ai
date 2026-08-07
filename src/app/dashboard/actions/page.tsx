import { createClient } from "@/lib/supabase/server";
import GenerateActionsButton from "./GenerateActionsButton";

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  send_churn_whatsapp: { label: "Send Churn Recovery Message", color: "bg-red-900/50 text-red-300", icon: "📱" },
  offer_vip_perk: { label: "Offer VIP Perk", color: "bg-purple-900/50 text-purple-300", icon: "👑" },
  suggest_upsell: { label: "Suggest Upsell", color: "bg-blue-900/50 text-blue-300", icon: "🍕" },
  referral_push: { label: "Referral Push", color: "bg-emerald-900/50 text-emerald-300", icon: "🤝" },
  no_action: { label: "No Action Needed", color: "bg-neutral-800 text-neutral-500", icon: "—" },
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
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold">What To Do Right Now</h1>
          <p className="text-neutral-400 text-sm">
            Ranked by expected ₹ impact — generated from CLV segments and churn signals
          </p>
        </div>
        <GenerateActionsButton />
      </div>

      <div className="mt-4 mb-6 rounded-lg border border-emerald-800 bg-emerald-950/30 px-5 py-4">
        <p className="text-sm text-neutral-400">Total opportunity on the board</p>
        <p className="text-3xl font-bold text-emerald-400">₹{totalExpectedValue.toFixed(0)}</p>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-800 bg-red-950/40 px-4 py-3 text-red-300">
          Failed to load actions: {error.message}
        </div>
      )}

      <div className="space-y-3">
        {actions && actions.length > 0 ? (
          actions.map((a: any) => {
            const style = ACTION_LABELS[a.recommended_action] ?? ACTION_LABELS.no_action;
            return (
              <div
                key={a.id}
                className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{style.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.customers?.name ?? a.customers?.phone}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${style.color}`}>
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {a.reasoning?.why ?? "No explanation available"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-semibold">
                    +₹{Number(a.expected_value ?? 0).toFixed(0)}
                  </p>
                  <p className="text-[10px] text-neutral-600">expected impact</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-neutral-500 py-12">
            No actions yet — click &quot;Generate Actions&quot; above (make sure you&apos;ve run
            CLV recompute first, since this reads from CLV segments).
          </div>
        )}
      </div>
    </div>
  );
}
