"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookCoachingSession } from "./actions";

export default function BookSessionForm({
  coachId,
  cafeId,
  hourlyRate,
}: {
  coachId: string;
  cafeId: string;
  hourlyRate: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBook() {
    setLoading(true);
    setError(null);
    const result = await bookCoachingSession({
      cafeId,
      coachId,
      studentPhone: phone,
      durationHours: Number(hours),
      totalPrice: hourlyRate * Number(hours),
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Failed");
      return;
    }
    setOpen(false);
    setPhone("");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded bg-blue-800 hover:bg-blue-700 px-3 py-1.5 text-xs transition"
      >
        Book Session
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Student's phone"
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs"
      />
      <input
        type="number"
        min="0.5"
        step="0.5"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        placeholder="Hours"
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs"
      />
      <p className="text-[10px] text-neutral-500">
        Total: ₹{(hourlyRate * Number(hours || 0)).toFixed(0)} · Cafe gets 20% = ₹
        {(hourlyRate * Number(hours || 0) * 0.2).toFixed(0)}
      </p>
      <div className="flex gap-1">
        <button
          onClick={handleBook}
          disabled={loading || !phone}
          className="flex-1 rounded bg-blue-800 hover:bg-blue-700 disabled:opacity-50 px-2 py-1 text-xs transition"
        >
          {loading ? "Booking..." : "Confirm"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded border border-neutral-700 px-2 py-1 text-xs transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
