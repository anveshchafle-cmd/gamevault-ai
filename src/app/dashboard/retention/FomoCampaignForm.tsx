"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendFomoCampaign } from "./fomoActions";

export default function FomoCampaignForm({ cafeId }: { cafeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [offer, setOffer] = useState("");
  const [expiry, setExpiry] = useState("");
  const [segment, setSegment] = useState<"all_active" | "whale" | "at_risk" | "grinder" | "socialite">("all_active");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSend() {
    setLoading(true);
    setResult(null);
    const res = await sendFomoCampaign(cafeId, offer, expiry, segment);
    setLoading(false);
    if (!res.success) {
      setResult(`Error: ${res.error}`);
      return;
    }
    setResult(`Sent to ${res.sent} customers.`);
    setOffer("");
    setExpiry("");
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-outline rounded px-4 py-2 text-sm">
        Send FOMO Offer
      </button>
    );
  }

  return (
    <div className="surface rounded p-5 max-w-lg">
      <p className="label mb-3">Send FOMO Flash Offer</p>
      {result && <p className="text-xs text-[var(--ok)] mb-2">{result}</p>}
      <div className="space-y-2">
        <input
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          placeholder="Offer, e.g. 'Only 3 RTX 4090 seats left tonight'"
          className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        />
        <input
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          placeholder="Expiry, e.g. 'Offer expires in 2 hours.'"
          className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        />
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value as any)}
          className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
        >
          <option value="all_active">All customers</option>
          <option value="whale">Whales only</option>
          <option value="at_risk">At Risk only</option>
          <option value="grinder">Grinders only</option>
          <option value="socialite">Socialites only</option>
        </select>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={handleSend} disabled={loading || !offer} className="btn-primary rounded px-4 py-1.5 text-sm disabled:opacity-50">
          {loading ? "Sending…" : "Send"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-outline rounded px-4 py-1.5 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}
