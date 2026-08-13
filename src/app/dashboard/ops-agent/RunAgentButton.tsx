"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunAgentButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      await fetch("/api/cron/daily-ops-agent");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-primary rounded px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
    >
      {loading ? "Running full ops cycle…" : "Run Daily Ops Now"}
    </button>
  );
}
