"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, LockKeyhole, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (password.length < 8) { setError("Use at least 8 characters for your new password."); return }
    if (password !== confirm) { setError("The passwords do not match."); return }
    setLoading(true)
    const { error: updateError } = await createClient().auth.updateUser({ password })
    if (updateError) setError(updateError.message)
    else { setDone(true); window.setTimeout(() => { router.replace("/overview"); router.refresh() }, 1200) }
    setLoading(false)
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#f7f9fb] px-5 py-12"><div className="w-full max-w-[420px]"><div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-slate-950 text-teal-300"><Sparkles className="h-5 w-5" /></div><p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Secure your workspace</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Choose a new password</h1><p className="mt-3 text-sm leading-6 text-slate-500">Your new password will protect access to your team&apos;s private workspace.</p>{done ? <div className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-5"><CheckCircle2 className="h-5 w-5 text-teal-600" /><p className="mt-3 text-sm font-semibold text-teal-900">Password updated</p><p className="mt-1 text-sm text-teal-800/80">Taking you back to the workspace...</p></div> : <form onSubmit={handleSubmit} className="mt-8 space-y-5"><div><label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">New password</label><div className="relative"><LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="h-12 w-full rounded-xl border border-slate-200 bg-white px-11 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" /></div></div><div><label htmlFor="confirm" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">Confirm password</label><input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" /></div>{error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<button disabled={loading} className="h-12 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{loading ? "Updating..." : "Update password"}</button></form>}</div></main>
}
