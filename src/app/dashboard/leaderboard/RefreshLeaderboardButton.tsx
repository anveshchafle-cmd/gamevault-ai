"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshLeaderboardButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      await fetch("/api/cron/refresh-leaderboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-primary rounded px-4 py-2 text-sm disabled:opacity-50"
    >
      {loading ? "Refreshing…" : "Refresh Leaderboard"}
    </button>
  );
}
