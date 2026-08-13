"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerDetails } from "./customerActions";

export default function EditCustomerButton({
  customerId,
  cafeId,
}: {
  customerId: string;
  cafeId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [referredByPhone, setReferredByPhone] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);
    const result = await updateCustomerDetails(customerId, cafeId, {
      referredByPhone: referredByPhone || undefined,
      dateOfBirth: dob || undefined,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Failed to save");
      return;
    }
    setOpen(false);
    setReferredByPhone("");
    setDob("");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
      >
        Edit
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 surface rounded p-2 text-xs">
      {error && <p className="text-[var(--danger)]">{error}</p>}
      <input
        value={referredByPhone}
        onChange={(e) => setReferredByPhone(e.target.value)}
        placeholder="Referrer's phone"
        className="rounded border border-[var(--border)] bg-transparent px-2 py-1"
      />
      <input
        type="date"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
        className="rounded border border-[var(--border)] bg-transparent px-2 py-1"
      />
      <div className="flex gap-1.5">
        <button onClick={handleSave} disabled={loading} className="btn-primary rounded px-2 py-1 disabled:opacity-50">
          {loading ? "…" : "Save"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-outline rounded px-2 py-1">
          Cancel
        </button>
      </div>
    </div>
  );
}
