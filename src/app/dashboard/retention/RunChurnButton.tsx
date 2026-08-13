"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunChurnButton() {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/cron/churn-detection");
      const json = await res.json();
      setLastResult(`Scanned ${json.scanned}, sent ${json.messagesSent}`);
      router.refresh();
    } catch {
      setLastResult("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-primary rounded px-4 py-2 text-sm disabled:opacity-50"
      >
        {loading ? "Running…" : "Run Churn Detection"}
      </button>
      {lastResult && <span className="text-xs text-[var(--text-dim)]">{lastResult}</span>}
    </div>
  );
}
