"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPricingRule } from "./actions";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CreatePricingRuleForm({ cafeId }: { cafeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    ruleName: "", stationTier: "", daysOfWeek: [] as number[],
    startTime: "", endTime: "", priceMultiplier: 1.0,
    minOccupancyPct: "", maxOccupancyPct: "",
  });

  function toggleDay(d: number) {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(d) ? f.daysOfWeek.filter((x) => x !== d) : [...f.daysOfWeek, d],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createPricingRule({
      cafeId, ruleName: form.ruleName, stationTier: form.stationTier || null,
      daysOfWeek: form.daysOfWeek, startTime: form.startTime || null, endTime: form.endTime || null,
      priceMultiplier: form.priceMultiplier,
      minOccupancyPct: form.minOccupancyPct ? Number(form.minOccupancyPct) : null,
      maxOccupancyPct: form.maxOccupancyPct ? Number(form.maxOccupancyPct) : null,
    });
    setLoading(false);
    if (!result.success) { setError(result.error ?? "Failed to create rule"); return; }
    setOpen(false);
    setForm({ ruleName: "", stationTier: "", daysOfWeek: [], startTime: "", endTime: "", priceMultiplier: 1.0, minOccupancyPct: "", maxOccupancyPct: "" });
    router.refresh();
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="btn-primary rounded px-4 py-2 text-sm">+ New Rule</button>;
  }

  return (
    <form onSubmit={handleSubmit} className="surface rounded-lg p-5 max-w-2xl mb-8">
      {error && <p className="text-sm text-[var(--danger)] mb-3">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <label className="block col-span-2">
          <span className="label block mb-1">Rule name</span>
          <input
            required value={form.ruleName} onChange={(e) => setForm({ ...form, ruleName: e.target.value })}
            placeholder="e.g. Weekend Peak"
            className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="label block mb-1">Station tier</span>
          <select value={form.stationTier} onChange={(e) => setForm({ ...form, stationTier: e.target.value })}
            className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm">
            <option value="">All tiers</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="rtx4090">RTX 4090</option>
            <option value="console">Console</option>
          </select>
        </label>
        <label className="block">
          <span className="label block mb-1">Multiplier ({form.priceMultiplier}x)</span>
          <input type="range" min="0.3" max="2" step="0.05" value={form.priceMultiplier}
            onChange={(e) => setForm({ ...form, priceMultiplier: Number(e.target.value) })}
            className="w-full mt-2" />
        </label>
        <label className="block col-span-2">
          <span className="label block mb-1">Days</span>
          <div className="flex gap-1">
            {DAYS.map((d, i) => (
              <button type="button" key={i} onClick={() => toggleDay(i)}
                className={`px-2.5 py-1 rounded text-xs transition ${form.daysOfWeek.includes(i) ? "btn-primary" : "btn-outline"}`}>
                {d}
              </button>
            ))}
          </div>
        </label>
        <label className="block">
          <span className="label block mb-1">Start time</span>
          <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm" />
        </label>
        <label className="block">
          <span className="label block mb-1">End time</span>
          <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm" />
        </label>
        <label className="block">
          <span className="label block mb-1">Min occupancy %</span>
          <input type="number" min="0" max="100" value={form.minOccupancyPct}
            onChange={(e) => setForm({ ...form, minOccupancyPct: e.target.value })}
            className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm" />
        </label>
        <label className="block">
          <span className="label block mb-1">Max occupancy %</span>
          <input type="number" min="0" max="100" value={form.maxOccupancyPct}
            onChange={(e) => setForm({ ...form, maxOccupancyPct: e.target.value })}
            className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm" />
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary rounded px-4 py-1.5 text-sm disabled:opacity-50">
          {loading ? "Creating…" : "Create Rule"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline rounded px-4 py-1.5 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
