import { createClient } from "@/lib/supabase/server";
import RunChurnButton from "./RunChurnButton";

export default async function RetentionPage() {
  const supabase = await createClient();

  const { data: messages, error } = await supabase
    .from("whatsapp_messages")
    .select("id, campaign_type, message_text, sent_at, customer_id")
    .order("sent_at", { ascending: false })
    .limit(50);

  // Fetch customer names/phones separately (simple approach for v1;
  // a joined query works too once you're comfortable with Supabase's
  // nested select syntax)
  let customerMap: Record<string, { name: string | null; phone: string }> = {};
  if (messages && messages.length > 0) {
    const customerIds = [...new Set(messages.map((m) => m.customer_id).filter(Boolean))];
    const { data: customers } = await supabase
      .from("customers")
      .select("id, name, phone")
      .in("id", customerIds as string[]);

    if (customers) {
      customerMap = Object.fromEntries(
        customers.map((c) => [c.id, { name: c.name, phone: c.phone }])
      );
    }
  }

  const isDryRun = process.env.WHATSAPP_MODE !== "live";

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Retention Engine</h1>
          <p className="text-neutral-400 text-sm">
            WhatsApp churn recovery, milestones, referrals — message log
          </p>
        </div>
        <RunChurnButton />
      </div>

      {isDryRun && (
        <div className="mb-4 rounded-md border border-yellow-700 bg-yellow-950/40 px-4 py-2 text-sm text-yellow-300">
          Running in DRY RUN mode — messages are logged here but not actually sent.
          Set WHATSAPP_MODE=live in .env.local once your WhatsApp credentials are ready.
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-800 bg-red-950/40 px-4 py-3 text-red-300">
          Failed to load messages: {error.message}
        </div>
      )}

      <div className="rounded-lg border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-800 text-neutral-400">
            <tr>
              <th className="text-left px-4 py-2">Sent At</th>
              <th className="text-left px-4 py-2">Customer</th>
              <th className="text-left px-4 py-2">Campaign</th>
              <th className="text-left px-4 py-2">Message</th>
            </tr>
          </thead>
          <tbody>
            {messages && messages.length > 0 ? (
              messages.map((m) => {
                const customer = m.customer_id ? customerMap[m.customer_id] : null;
                return (
                  <tr key={m.id} className="border-t border-neutral-800">
                    <td className="px-4 py-2 text-neutral-400">
                      {new Date(m.sent_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {customer?.name ?? customer?.phone ?? "Unknown"}
                    </td>
                    <td className="px-4 py-2">
                      <span className="rounded bg-emerald-900/50 text-emerald-300 px-2 py-0.5 text-xs">
                        {m.campaign_type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-neutral-300">{m.message_text}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  No messages yet — click &quot;Run Churn Detection Now&quot; to test.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}