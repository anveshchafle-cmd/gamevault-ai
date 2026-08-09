"use client";

import { useState } from "react";

export default function CopyReferralLinkButton({ referralCode }: { referralCode: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!referralCode) return <span className="text-xs text-neutral-600">—</span>;

  async function handleCopy() {
    const link = `${window.location.origin}/refer/${referralCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-neutral-500 hover:text-emerald-400 transition"
    >
      {copied ? "✓ Copied!" : "Copy link"}
    </button>
  );
}
