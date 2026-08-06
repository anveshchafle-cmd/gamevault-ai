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
      setLastResult(
        `Scanned ${json.scanned} customers, sent ${json.messagesSent} messages.`
      );
      router.refresh();
    } catch {
      setLastResult("Something went wrong — check the terminal for errors.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-md bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-4 py-2 text-sm font-medium transition"
      >
        {loading ? "Running..." : "Run Churn Detection Now"}
      </button>
      {lastResult && <p className="text-xs text-neutral-400">{lastResult}</p>}
    </div>
  );
}
