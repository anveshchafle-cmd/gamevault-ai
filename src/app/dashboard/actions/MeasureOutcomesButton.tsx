"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MeasureOutcomesButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/cron/measure-nba-outcomes");
      const json = await res.json();
      setResult(`${json.measured} measured`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-outline rounded px-3 py-1.5 text-xs disabled:opacity-50"
      >
        {loading ? "Measuring…" : "Measure Outcomes"}
      </button>
      {result && <span className="text-xs text-[var(--text-dim)]">{result}</span>}
    </div>
  );
}
