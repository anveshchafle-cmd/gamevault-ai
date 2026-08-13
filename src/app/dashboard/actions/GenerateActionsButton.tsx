"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateActionsButton() {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/cron/generate-nba");
      const json = await res.json();
      setLastResult(`${json.totalGenerated} generated`);
      router.refresh();
    } catch {
      setLastResult("Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-primary rounded px-3 py-1.5 text-xs disabled:opacity-50"
      >
        {loading ? "Generating…" : "Generate Actions"}
      </button>
      {lastResult && <span className="text-xs text-[var(--text-dim)]">{lastResult}</span>}
    </div>
  );
}
