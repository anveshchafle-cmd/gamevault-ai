"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addCoach } from "./actions";

export default function AddCoachForm({ cafeId }: { cafeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ displayName: "", gameSpecialty: "", hourlyRate: "500", bio: "", coachPhone: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await addCoach({
      cafeId, displayName: form.displayName, gameSpecialty: form.gameSpecialty,
      hourlyRate: Number(form.hourlyRate), bio: form.bio, coachPhone: form.coachPhone,
    });
    setLoading(false);
    if (!result.success) { setError(result.error ?? "Failed"); return; }
    setOpen(false);
    setForm({ displayName: "", gameSpecialty: "", hourlyRate: "500", bio: "", coachPhone: "" });
    router.refresh();
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="btn-primary rounded px-4 py-2 text-sm">+ Add Coach</button>;
  }

  return (
    <form onSubmit={handleSubmit} className="surface rounded-lg p-5 max-w-md mb-6">
      {error && <p className="text-xs text-[var(--danger)] mb-2">{error}</p>}
      <div className="space-y-2">
        <input required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          placeholder="Coach name" className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm" />
        <input required value={form.gameSpecialty} onChange={(e) => setForm({ ...form, gameSpecialty: e.target.value })}
          placeholder="Game specialty" className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm" />
        <input required type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
          placeholder="Hourly rate" className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm" />
        <input required value={form.coachPhone} onChange={(e) => setForm({ ...form, coachPhone: e.target.value })}
          placeholder="Coach's phone" className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm" />
        <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Short bio" className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm" />
      </div>
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary rounded px-4 py-1.5 text-sm disabled:opacity-50">
          {loading ? "Adding…" : "Add"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline rounded px-4 py-1.5 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
