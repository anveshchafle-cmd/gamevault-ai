"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { spinForCustomer } from "./actions";

const WHEEL_LABELS = ["10 XP", "20 XP", "50 XP", "5% off food", "10% off food", "Shoutout"];

export default function SpinWheel({ cafeId }: { cafeId: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ label: string; error?: string } | null>(null);

  async function handleSpin() {
    if (!phone) return;
    setSpinning(true);
    setResult(null);

    const spinAmount = 1080 + Math.floor(Math.random() * 360);
    setRotation((r) => r + spinAmount);

    const res = await spinForCustomer(cafeId, phone);

    setTimeout(() => {
      setSpinning(false);
      if (!res.success) {
        setResult({ label: "", error: res.error });
      } else {
        const rewardLabel = "reward" in res && res.reward ? res.reward.label : "Reward";
        setResult({ label: rewardLabel });
      }
      router.refresh();
    }, 1600);
  }

  return (
    <div className="surface rounded-lg p-10 flex flex-col items-center gap-6">
      <div className="relative w-56 h-56">
        <div
          className="w-full h-full rounded-full border border-[var(--border)] grid grid-cols-2 grid-rows-3 overflow-hidden transition-transform ease-out"
          style={{ transform: `rotate(${rotation}deg)`, transitionDuration: spinning ? "1.6s" : "0s" }}
        >
          {WHEEL_LABELS.map((label, i) => (
            <div
              key={i}
              className={`flex items-center justify-center text-[10px] font-medium text-center px-1 ${i % 2 === 0 ? "bg-[var(--surface)]" : "bg-[var(--bg)]"}`}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--accent)]" />
      </div>

      <input
        value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Customer phone"
        className="w-full max-w-xs rounded border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-center"
      />

      <button onClick={handleSpin} disabled={spinning || !phone} className="btn-primary rounded px-6 py-2 text-sm disabled:opacity-50">
        {spinning ? "Spinning…" : "Spin"}
      </button>

      {result && (
        <div className="text-center">
          {result.error ? (
            <p className="text-sm text-[var(--danger)]">{result.error}</p>
          ) : (
            <p className="text-lg font-semibold text-[var(--accent)]">{result.label}</p>
          )}
        </div>
      )}
    </div>
  );
}
