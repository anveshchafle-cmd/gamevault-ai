"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { spinForCustomer } from "./actions";

const WHEEL_LABELS = ["10 XP", "20 XP", "50 XP", "5% off food", "10% off food", "Shoutout"];
const SEGMENT_COUNT = WHEEL_LABELS.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

function buildConicGradient() {
  const colors = ["#1A1A1A", "#141414"];
  const stops: string[] = [];
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const start = i * SEGMENT_ANGLE;
    const end = start + SEGMENT_ANGLE;
    const isHighlight = i === 2; // "50 XP" segment gets the accent tint
    const color = isHighlight ? "#2A2214" : colors[i % 2];
    stops.push(`${color} ${start}deg ${end}deg`);
  }
  return `conic-gradient(from 0deg, ${stops.join(", ")})`;
}

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

    const fullSpins = 5 + Math.floor(Math.random() * 2);
    const landingOffset = Math.floor(Math.random() * 360);
    const spinAmount = fullSpins * 360 + landingOffset;
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
    }, 3200);
  }

  return (
    <div className="surface rounded-lg p-10 flex flex-col items-center gap-7">
      <div className="relative w-72 h-72">
        {/* Pointer */}
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 w-0 h-0"
          style={{
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "14px solid var(--accent)",
          }}
        />

        {/* Wheel */}
        <div
          className="w-full h-full rounded-full border-2 border-[var(--border)] relative overflow-hidden"
          style={{
            background: buildConicGradient(),
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 3.2s cubic-bezier(0.17, 0.89, 0.32, 1.15)" : "none",
          }}
        >
          {WHEEL_LABELS.map((label, i) => {
            const midAngle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 text-[11px] font-medium text-[var(--text)] w-20 text-center"
                style={{
                  transform: `rotate(${midAngle}deg) translate(0, -100px) rotate(${-midAngle}deg) translate(-50%, -50%)`,
                }}
              >
                {label}
              </div>
            );
          })}

          {/* Segment dividers */}
          {WHEEL_LABELS.map((_, i) => (
            <div
              key={`divider-${i}`}
              className="absolute top-1/2 left-1/2 w-1/2 h-px bg-[var(--border)] origin-left"
              style={{ transform: `rotate(${i * SEGMENT_ANGLE}deg)` }}
            />
          ))}
        </div>

        {/* Center hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[var(--bg)] border-2 border-[var(--accent)] flex items-center justify-center z-10">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
        </div>
      </div>

      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Customer phone"
        className="w-full max-w-xs rounded border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-center"
      />

      <button
        onClick={handleSpin}
        disabled={spinning || !phone}
        className="btn-primary rounded px-8 py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        {spinning ? "Spinning…" : "Spin"}
      </button>

      {result && (
        <div className="text-center animate-in fade-in duration-300">
          {result.error ? (
            <p className="text-sm text-[var(--danger)]">{result.error}</p>
          ) : (
            <p className="text-xl font-semibold text-[var(--accent)]">{result.label}</p>
          )}
        </div>
      )}
    </div>
  );
}
