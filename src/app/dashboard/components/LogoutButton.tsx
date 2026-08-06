"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-md border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 disabled:opacity-50 px-3 py-1.5 text-sm text-neutral-300 transition"
    >
      {loading ? "Logging out..." : "Log out"}
    </button>
  );
}
