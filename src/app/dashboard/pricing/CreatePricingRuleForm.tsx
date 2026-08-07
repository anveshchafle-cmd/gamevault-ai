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
    ruleName: "",
    stationTier: "",
    daysOfWeek: [] as number[],
    startTime: "",
    endTime: "",
    priceMultiplier: 1.0,
    minOccupancyPct: "",
    maxOccupancyPct: "",
  });

  function toggleDay(d: number) {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(d)
        ? f.daysOfWeek.filter((x) => x !== d)
        : [...f.daysOfWeek, d],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createPricingRule({
      cafeId,
      ruleName: form.ruleName,
      stationTier: form.stationTier || null,
      daysOfWeek: form.daysOfWeek,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      priceMultiplier: form.priceMultiplier,
      minOccupancyPct: form.minOccupancyPct ? Number(form.minOccupancyPct) : null,
      maxOccupancyPct: form.maxOccupancyPct ? Number(form.maxOccupancyPct) : null,
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Failed to create rule");
      return;
    }

    setOpen(false);
    setForm({
      ruleName: "",
      stationTier: "",
      daysOfWeek: [],
      startTime: "",
      endTime: "",
      priceMultiplier: 1.0,
      minOccupancyPct: "",
      maxOccupancyPct: "",
    });
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-emerald-700 hover:bg-emerald-600 px-4 py-2 text-sm font-medium transition"
      >
        + Create Pricing Rule
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 max-w-2xl"
    >
      {error && (
        <div className="mb-3 rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="block col-span-2">
          <span className="text-xs text-neutral-400">Rule name</span>
          <input
            required
            value={form.ruleName}
            onChange={(e) => setForm({ ...form, ruleName: e.target.value })}
            placeholder="e.g. Weekend Peak, Weekday Dead Hour"
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-xs text-neutral-400">Station tier (blank = all)</span>
          <select
            value={form.stationTier}
            onChange={(e) => setForm({ ...form, stationTier: e.target.value })}
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm"
          >
            <option value="">All tiers</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="rtx4090">RTX 4090</option>
            <option value="console">Console</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-neutral-400">
            Price multiplier ({form.priceMultiplier}x)
          </span>
          <input
            type="range"
            min="0.3"
            max="2"
            step="0.05"
            value={form.priceMultiplier}
            onChange={(e) => setForm({ ...form, priceMultiplier: Number(e.target.value) })}
            className="mt-2 w-full"
          />
        </label>

        <label className="block col-span-2">
          <span className="text-xs text-neutral-400">Days (blank = every day)</span>
          <div className="mt-1 flex gap-1">
            {DAYS.map((d, i) => (
              <button
                type="button"
                key={i}
                onClick={() => toggleDay(i)}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  form.daysOfWeek.includes(i)
                    ? "bg-emerald-700"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="text-xs text-neutral-400">Start time (blank = all day)</span>
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-neutral-400">End time</span>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-xs text-neutral-400">Min occupancy % (optional)</span>
          <input
            type="number"
            min="0"
            max="100"
            value={form.minOccupancyPct}
            onChange={(e) => setForm({ ...form, minOccupancyPct: e.target.value })}
            placeholder="e.g. 80 for peak-only"
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-neutral-400">Max occupancy % (optional)</span>
          <input
            type="number"
            min="0"
            max="100"
            value={form.maxOccupancyPct}
            onChange={(e) => setForm({ ...form, maxOccupancyPct: e.target.value })}
            placeholder="e.g. 30 for dead-hour-only"
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm"
          />
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-4 py-1.5 text-sm font-medium transition"
        >
          {loading ? "Creating..." : "Create Rule"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-neutral-700 px-4 py-1.5 text-sm transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
