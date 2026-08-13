"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addSquadMember, removeSquadMember } from "./memberActions";

type Member = { id: string; name: string | null; phone: string };

export default function SquadMembers({
  squadId,
  cafeId,
  members,
}: {
  squadId: string;
  cafeId: string;
  members: Member[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await addSquadMember(squadId, cafeId, phone);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Failed to add member");
      return;
    }
    setPhone("");
    router.refresh();
  }

  async function handleRemove(customerId: string) {
    await removeSquadMember(customerId);
    router.refresh();
  }

  return (
    <div className="pt-4 border-t border-[var(--border)]">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
      >
        {members.length} member{members.length !== 1 ? "s" : ""}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs">
              <span>{m.name ?? m.phone}</span>
              <button onClick={() => handleRemove(m.id)} className="text-[var(--text-dim)] hover:text-[var(--danger)] transition-colors">
                remove
              </button>
            </div>
          ))}

          <form onSubmit={handleAdd} className="flex gap-1.5 pt-1.5">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91XXXXXXXXXX"
              className="flex-1 rounded border border-[var(--border)] bg-transparent px-2 py-1 text-xs"
            />
            <button type="submit" disabled={loading} className="btn-primary rounded px-2 py-1 text-xs disabled:opacity-50">
              Add
            </button>
          </form>
          {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
        </div>
      )}
    </div>
  );
}
