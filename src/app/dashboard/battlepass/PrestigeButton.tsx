"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { prestigeCustomer } from "./prestigeActions";

const PRESTIGE_DISCOUNTS = ["5%", "10%", "15%", "20%", "25%"];

export default function PrestigeButton({
  customerId,
  progressId,
  currentTier,
  maxTier,
  prestigeLevel,
}: {
  customerId: string;
  progressId: string;
  currentTier: number;
  maxTier: number;
  prestigeLevel: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const canPrestige = currentTier >= maxTier;
  const nextDiscount = PRESTIGE_DISCOUNTS[Math.min(prestigeLevel, PRESTIGE_DISCOUNTS.length - 1)];

  async function handlePrestige() {
    setLoading(true);
    const result = await prestigeCustomer(customerId, progressId);
    setLoading(false);
    setConfirming(false);
    if (result.success) {
      router.refresh();
    }
  }

  if (prestigeLevel > 0 && !canPrestige) {
    return (
      <span className="text-xs text-[var(--accent)]">
        ★ Prestige {prestigeLevel} &middot; {PRESTIGE_DISCOUNTS[prestigeLevel - 1]} off forever
      </span>
    );
  }

  if (!canPrestige) return null;

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-[var(--text-dim)]">Reset to Tier 0, keep {nextDiscount} off forever?</span>
        <button onClick={handlePrestige} disabled={loading} className="btn-primary rounded px-2 py-0.5 disabled:opacity-50">
          {loading ? "…" : "Confirm"}
        </button>
        <button onClick={() => setConfirming(false)} className="btn-outline rounded px-2 py-0.5">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-xs text-[var(--accent)] hover:opacity-80 transition">
      ★ Prestige Available
    </button>
  );
}
