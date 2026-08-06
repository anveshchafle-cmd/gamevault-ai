"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signUpCafeOwner } from "./actions";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    cafeName: "",
    city: "",
    whatsappNumber: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signUpCafeOwner(form);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Account created server-side — now sign in on the client so a
    // session cookie gets set, then land on the dashboard.
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInError) {
      setError("Account created, but auto-login failed. Please log in manually.");
      setLoading(false);
      router.push("/login");
      return;
    }

    router.push("/dashboard/stations");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-950 p-8"
      >
        <h1 className="text-2xl font-bold mb-1">Set up your cafe</h1>
        <p className="text-neutral-400 text-sm mb-6">
          Create your GameVault AI account
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-red-800 bg-red-950/40 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Field
            label="Cafe name"
            value={form.cafeName}
            onChange={(v) => setForm({ ...form, cafeName: v })}
            required
          />
          <Field
            label="City"
            value={form.city}
            onChange={(v) => setForm({ ...form, city: v })}
          />
          <Field
            label="WhatsApp business number (optional for now)"
            value={form.whatsappNumber}
            onChange={(v) => setForm({ ...form, whatsappNumber: v })}
            placeholder="+91XXXXXXXXXX"
          />
          <Field
            label="Your email"
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            required
          />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-md bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-4 py-2 font-medium transition"
        >
          {loading ? "Creating your cafe..." : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <a href="/login" className="text-emerald-400 hover:underline">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-neutral-400">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-emerald-600 focus:outline-none"
      />
    </label>
  );
}
