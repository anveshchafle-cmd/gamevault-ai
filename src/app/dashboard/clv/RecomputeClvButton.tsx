"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RecomputeClvButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      await fetch("/api/cron/recompute-clv");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-4 py-2 text-sm font-medium transition"
    >
      {loading ? "Scoring..." : "Recompute CLV"}
    </button>
  );
}
