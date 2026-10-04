"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const origin = window.location.origin;
    const { error: resetError } =
      await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/auth/callback?next=/update-password`,
      });
    if (resetError) setError(resetError.message);
    else setSent(true);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f9fb] px-5 py-12">
      <div className="w-full max-w-[420px]">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
        <div className="mt-10 flex h-11 w-11 items-center justify-center rounded-[13px] bg-slate-950 text-teal-300">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">
          Account recovery
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          Reset your password
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          We&apos;ll send a secure link to the email connected to your EUMIND
          workspace.
        </p>
        {sent ? (
          <div className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-5">
            <Mail className="h-5 w-5 text-teal-600" />
            <p className="mt-3 text-sm font-semibold text-teal-900">
              Check your inbox
            </p>
            <p className="mt-1 text-sm leading-6 text-teal-800/80">
              If an account exists for{" "}
              <span className="font-semibold">{email}</span>, a reset link is
              on its way.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="user@domain.com"
                required
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              />
            </div>
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}
            <button
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Sending link..." : "Send reset link"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
