"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { claimReferral } from "../actions";

export default function ReferralClaimPage() {
  const params = useParams();
  const code = params.code as string;

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string; referrerName?: string | null } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await claimReferral(code, phone, name);
    setLoading(false);
    setResult(res);
  }

  if (result?.success) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-3">🎉</div>
          <h1 className="text-xl font-bold mb-2">You're in!</h1>
          <p className="text-neutral-400 text-sm">
            Come by GameVault and mention your phone number to redeem your welcome offer. Thanks for being referred by {result.referrerName ?? "a friend"}!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-950 p-6"
      >
        <h1 className="text-xl font-bold mb-1">You've been invited!</h1>
        <p className="text-neutral-400 text-sm mb-6">
          Enter your details to claim your welcome offer at GameVault.
        </p>

        {result?.error && (
          <p className="text-sm text-red-400 mb-3">{result.error}</p>
        )}

        <div className="space-y-3">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
          />
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2.5 text-sm font-medium transition"
        >
          {loading ? "Claiming..." : "Claim Offer"}
        </button>
      </form>
    </div>
  );
}
