"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSquad } from "./actions";

const PRESETS: Record<string, { pool: number; fee: number }> = {
  bronze: { pool: 40, fee: 1999 },
  silver: { pool: 80, fee: 3499 },
  gold: { pool: 150, fee: 5999 },
  family: { pool: 60, fee: 2499 },
  college_semester: { pool: 120, fee: 4999 },
  corporate_startup: { pool: 100, fee: 9999 },
};

export default function CreateSquadForm({ cafeId }: { cafeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    squadType: "squad" as "squad" | "family" | "college_gang" | "corporate",
    planTier: "bronze",
    leaderPhone: "",
  });

  const preset = PRESETS[form.planTier] ?? { pool: 40, fee: 1999 };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createSquad({
      cafeId,
      name: form.name,
      squadType: form.squadType,
      planTier: form.planTier,
      sharedHoursPool: preset.pool,
      monthlyFee: preset.fee,
      leaderPhone: form.leaderPhone,
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Something went wrong");
      return;
    }

    setOpen(false);
    setForm({ name: "", squadType: "squad", planTier: "bronze", leaderPhone: "" });
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-emerald-700 hover:bg-emerald-600 px-4 py-2 text-sm font-medium transition"
      >
        + Create Squad Pass
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 max-w-lg"
    >
      {error && (
        <div className="mb-3 rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="block col-span-2">
          <span className="text-xs text-neutral-400">Squad name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm"
            placeholder="e.g. The Night Owls"
          />
        </label>

        <label className="block">
          <span className="text-xs text-neutral-400">Type</span>
          <select
            value={form.squadType}
            onChange={(e) => setForm({ ...form, squadType: e.target.value as any })}
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm"
          >
            <option value="squad">Squad</option>
            <option value="family">Family</option>
            <option value="college_gang">College Gang</option>
            <option value="corporate">Corporate</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-neutral-400">Plan</span>
          <select
            value={form.planTier}
            onChange={(e) => setForm({ ...form, planTier: e.target.value })}
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm"
          >
            <option value="bronze">Bronze (40h, ₹1999)</option>
            <option value="silver">Silver (80h, ₹3499)</option>
            <option value="gold">Gold (150h, ₹5999)</option>
            <option value="family">Family (60h, ₹2499)</option>
            <option value="college_semester">College Semester (120h, ₹4999)</option>
            <option value="corporate_startup">Corporate Startup (100h, ₹9999)</option>
          </select>
        </label>

        <label className="block col-span-2">
          <span className="text-xs text-neutral-400">Squad leader's phone</span>
          <input
            required
            value={form.leaderPhone}
            onChange={(e) => setForm({ ...form, leaderPhone: e.target.value })}
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm"
            placeholder="+91XXXXXXXXXX"
          />
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-4 py-1.5 text-sm font-medium transition"
        >
          {loading ? "Creating..." : "Create"}
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
