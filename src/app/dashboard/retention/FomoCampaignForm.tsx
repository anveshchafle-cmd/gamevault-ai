"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendFomoCampaign } from "./fomoActions";
import { generateAiFomoText } from "./aiActions";

export default function FomoCampaignForm({ cafeId }: { cafeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roughIdea, setRoughIdea] = useState("");
  const [offer, setOffer] = useState("");
  const [expiry, setExpiry] = useState("");
  const [segment, setSegment] = useState<"all_active" | "whale" | "at_risk" | "grinder" | "socialite">("all_active");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleGenerateAi() {
    setAiLoading(true);
    setResult(null);
    const res = await generateAiFomoText(cafeId, roughIdea);
    setAiLoading(false);
    if (!res.success) {
      setResult(`AI error: ${res.error}`);
      return;
    }
    setOffer(res.message ?? "");
  }

  async function handleSend() {
    setLoading(true);
    setResult(null);
    const res = await sendFomoCampaign(cafeId, offer, expiry, segment);
    setLoading(false);
    if (!res.success) {
      setResult(`Error: ${res.error}`);
      return;
    }
    setResult(`Found ${res.totalFound} customer(s). Sent: ${res.sent}. Failed: ${res.failed}.`);
    setOffer("");
    setExpiry("");
    setRoughIdea("");
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
      {result && <p className="text-xs text-[var(--text-dim)] mb-2">{result}</p>}

      <div className="space-y-2">
        <div>
          <label className="label block mb-1">Rough idea</label>
          <div className="flex gap-2">
            <input
              value={roughIdea}
              onChange={(e) => setRoughIdea(e.target.value)}
              placeholder="e.g. weekend RTX seats filling up fast"
              className="flex-1 rounded border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            />
            <button
              onClick={handleGenerateAi}
              disabled={aiLoading || !roughIdea.trim()}
              className="btn-primary rounded px-3 py-2 text-xs disabled:opacity-50 whitespace-nowrap"
            >
              {aiLoading ? "Writing…" : "Generate with AI"}
            </button>
          </div>
        </div>

        <div>
          <label className="label block mb-1">Message (edit as needed)</label>
          <textarea
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="Or write your own message directly"
            rows={3}
            className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>

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
