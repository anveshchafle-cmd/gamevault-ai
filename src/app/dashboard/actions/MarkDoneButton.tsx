"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markActionExecuted } from "./executeActions";

export default function MarkDoneButton({
  actionId,
  wasExecuted,
  actualOutcomeValue,
}: {
  actionId: string;
  wasExecuted: boolean;
  actualOutcomeValue: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await markActionExecuted(actionId);
    setLoading(false);
    router.refresh();
  }

  if (wasExecuted) {
    return (
      <div className="text-right">
        <span className="text-xs text-emerald-400">✓ Done</span>
        {actualOutcomeValue != null && (
          <p className="text-[10px] text-neutral-500">
            Actual: ₹{actualOutcomeValue.toFixed(0)}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs rounded border border-neutral-700 hover:border-emerald-600 hover:text-emerald-400 px-2 py-1 transition disabled:opacity-50"
    >
      {loading ? "..." : "Mark Done"}
    </button>
  );
}
