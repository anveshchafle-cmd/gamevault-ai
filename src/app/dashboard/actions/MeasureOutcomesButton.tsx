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
      setResult(`Measured ${json.measured} outcomes.`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-md border border-neutral-700 hover:border-neutral-500 px-3 py-1.5 text-xs transition disabled:opacity-50"
      >
        {loading ? "Measuring..." : "Measure Outcomes"}
      </button>
      {result && <p className="text-[10px] text-neutral-500">{result}</p>}
    </div>
  );
}
