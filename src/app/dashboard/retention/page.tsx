import { createClient } from "@/lib/supabase/server";
import RunChurnButton from "./RunChurnButton";
import FomoCampaignForm from "./FomoCampaignForm";

const CAMPAIGN_LABEL: Record<string, string> = {
  churn_recovery: "Churn Recovery",
  milestone: "Milestone",
  birthday: "Birthday",
  referral: "Referral",
  fomo_flash: "FOMO",
};

export default async function RetentionPage() {
  const supabase = await createClient();

  const { data: messages, error } = await supabase
    .from("whatsapp_messages")
    .select("id, campaign_type, message_text, sent_at, customer_id")
    .order("sent_at", { ascending: false })
    .limit(50);

  let customerMap: Record<string, { name: string | null; phone: string }> = {};
  if (messages && messages.length > 0) {
    const customerIds = [...new Set(messages.map((m) => m.customer_id).filter(Boolean))];
    const { data: customers } = await supabase
      .from("customers")
      .select("id, name, phone")
      .in("id", customerIds as string[]);
    if (customers) {
      customerMap = Object.fromEntries(customers.map((c) => [c.id, { name: c.name, phone: c.phone }]));
    }
  }

  const { data: cafe } = await supabase.from("cafes").select("id").limit(1).maybeSingle();

  const { data: variantMessages } = await supabase
    .from("whatsapp_messages")
    .select("variant, led_to_visit")
    .eq("campaign_type", "churn_recovery")
    .not("led_to_visit", "is", null);

  const variantStats: Record<string, { sent: number; converted: number }> = {};
  (variantMessages ?? []).forEach((m) => {
    const v = m.variant ?? "default";
    if (!variantStats[v]) variantStats[v] = { sent: 0, converted: 0 };
    variantStats[v].sent++;
    if (m.led_to_visit) variantStats[v].converted++;
  });

  const isDryRun = process.env.WHATSAPP_MODE !== "live";

  const campaignCounts: Record<string, number> = {};
  (messages ?? []).forEach((m) => {
    campaignCounts[m.campaign_type] = (campaignCounts[m.campaign_type] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-8 py-12 max-w-5xl mx-auto">
      <p className="label mb-2">Customer Relationship Control</p>
      <h1 className="text-3xl font-bold tracking-tight mb-10">Retention</h1>

      {isDryRun && (
        <div className="surface rounded p-4 text-sm text-[var(--text-dim)] mb-8">
          Running in dry-run mode &mdash; messages are logged but not sent. Set WHATSAPP_MODE=live once ready.
        </div>
      )}

      <div className="grid grid-cols-5 gap-6 mb-10 pb-10 border-b border-[var(--border)]">
        {Object.entries(CAMPAIGN_LABEL).map(([key, label]) => (
          <div key={key}>
            <p className="label mb-1">{label}</p>
            <p className="font-stat text-2xl font-semibold">{campaignCounts[key] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-8">
        <RunChurnButton />
      </div>

      {Object.keys(variantStats).length > 0 && (
        <div className="mb-8">
          <p className="label mb-3">Churn Message A/B Test Results</p>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {Object.entries(variantStats).map(([variant, stats]) => {
              const rate = stats.sent > 0 ? ((stats.converted / stats.sent) * 100).toFixed(0) : "0";
              return (
                <div key={variant} className="surface rounded p-3">
                  <p className="text-xs text-[var(--text-dim)] capitalize mb-1">{variant}</p>
                  <p className="text-lg font-semibold">{rate}%</p>
                  <p className="text-[10px] text-[var(--text-dim)]">{stats.converted}/{stats.sent} came back</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {cafe && <FomoCampaignForm cafeId={cafe.id} />}

      {error && (
        <div className="surface rounded p-4 border-[var(--danger)] text-[var(--danger)] text-sm mt-6">
          Failed to load messages: {error.message}
        </div>
      )}

      <div className="mt-10 space-y-0">
        <div className="grid grid-cols-4 gap-4 pb-3 border-b border-[var(--border)]">
          <span className="label">Sent</span>
          <span className="label">Customer</span>
          <span className="label">Campaign</span>
          <span className="label">Message</span>
        </div>
        {messages && messages.length > 0 ? (
          messages.map((m) => {
            const customer = m.customer_id ? customerMap[m.customer_id] : null;
            return (
              <div key={m.id} className="grid grid-cols-4 gap-4 py-3 border-b border-[var(--border)] text-sm items-start">
                <span className="text-[var(--text-dim)]">{new Date(m.sent_at).toLocaleDateString()}</span>
                <span>{customer?.name ?? customer?.phone ?? "Unknown"}</span>
                <span className="text-[var(--text-dim)]">{CAMPAIGN_LABEL[m.campaign_type] ?? m.campaign_type}</span>
                <span className="text-[var(--text-dim)] truncate">{m.message_text}</span>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-[var(--text-dim)] py-8">No messages yet.</p>
        )}
      </div>
    </div>
  );
}
