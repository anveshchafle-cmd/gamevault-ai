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
      <button onClick={() => setOpen(true)} className="btn-primary rounded px-4 py-2 text-sm">
        + New Squad
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="surface rounded-lg p-5 max-w-lg mb-8">
      {error && <p className="text-sm text-[var(--danger)] mb-3">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <label className="block col-span-2">
          <span className="label block mb-1">Squad name</span>
          <input
            required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. The Night Owls"
            className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="label block mb-1">Type</span>
          <select
            value={form.squadType} onChange={(e) => setForm({ ...form, squadType: e.target.value as any })}
            className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm"
          >
            <option value="squad">Squad</option>
            <option value="family">Family</option>
            <option value="college_gang">College Gang</option>
            <option value="corporate">Corporate</option>
          </select>
        </label>
        <label className="block">
          <span className="label block mb-1">Plan</span>
          <select
            value={form.planTier} onChange={(e) => setForm({ ...form, planTier: e.target.value })}
            className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm"
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
          <span className="label block mb-1">Squad leader's phone</span>
          <input
            required value={form.leaderPhone} onChange={(e) => setForm({ ...form, leaderPhone: e.target.value })}
            placeholder="+91XXXXXXXXXX"
            className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm"
          />
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary rounded px-4 py-1.5 text-sm disabled:opacity-50">
          {loading ? "Creating…" : "Create"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline rounded px-4 py-1.5 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
