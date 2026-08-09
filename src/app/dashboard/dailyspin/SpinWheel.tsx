"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { spinForCustomer } from "./actions";

const WHEEL_LABELS = [
  "10 XP",
  "20 XP",
  "50 XP",
  "5% off food",
  "10% off food",
  "Shoutout",
];

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

    const spinAmount = 1800 + Math.floor(Math.random() * 360);
    setRotation((r) => r + spinAmount);

    const res = await spinForCustomer(cafeId, phone);

    setTimeout(() => {
      setSpinning(false);
      if (!res.success) {
        setResult({ label: "", error: res.error });
      } else {
        const rewardLabel =
          "reward" in res && res.reward ? res.reward.label : "Reward";
        setResult({ label: rewardLabel });
      }
      router.refresh();
    }, 2500);
  }

  return (
    <div className="flex flex-col items-center gap-6 rounded-lg border border-neutral-800 bg-neutral-950 p-8">
      <div className="relative w-64 h-64">
        <div
          className="w-full h-full rounded-full border-4 border-emerald-600 grid grid-cols-2 grid-rows-3 overflow-hidden transition-transform ease-out"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: spinning ? "2.5s" : "0s",
          }}
        >
          {WHEEL_LABELS.map((label, i) => (
            <div
              key={i}
              className={`flex items-center justify-center text-[10px] font-semibold text-center px-1 ${
                i % 2 === 0 ? "bg-emerald-900/60" : "bg-neutral-800"
              }`}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-400" />
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-[16px] border-l-transparent border-r-transparent border-t-emerald-400" />
      </div>

      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Customer phone"
        className="w-full max-w-xs rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-center"
      />

      <button
        onClick={handleSpin}
        disabled={spinning || !phone}
        className="rounded-md bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-6 py-2 text-sm font-medium transition"
      >
        {spinning ? "Spinning..." : "Spin!"}
      </button>

      {result && (
        <div className="text-center">
          {result.error ? (
            <p className="text-sm text-red-400">{result.error}</p>
          ) : (
            <p className="text-lg font-semibold text-emerald-400">🎉 {result.label}</p>
          )}
        </div>
      )}
    </div>
  );
}
