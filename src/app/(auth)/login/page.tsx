"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (signInError) {
      setError(signInError.message === "Invalid login credentials" ? "The email or password is incorrect. Check your invite details and try again." : signInError.message)
      setLoading(false)
      return
    }
    router.replace("/overview")
    router.refresh()
  }

  return <main className="flex min-h-screen bg-[#f7f9fb] text-slate-900"><section className="relative hidden w-[46%] overflow-hidden bg-slate-950 p-12 lg:flex lg:flex-col lg:justify-between"><div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-teal-400/15 blur-3xl" /><div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-violet-400/10 blur-3xl" /><div className="relative"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-white/10 text-teal-300"><Sparkles className="h-5 w-5" /></div><div><p className="text-sm font-semibold text-white">EUMIND</p><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Creative Entrepreneur</p></div></div><div className="mt-28 max-w-md"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">The Green Loop · 2026–27</p><h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-[-0.06em] text-white">Make the idea real, together.</h1><p className="mt-6 text-base leading-7 text-slate-400">One calm workspace for your team&apos;s tasks, blueprints, evidence, feedback and final story.</p></div></div><div className="relative flex items-center gap-3 text-xs text-slate-500"><LockKeyhole className="h-4 w-4 text-teal-300" /> Private team workspace · invited members only</div></section><section className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10"><div className="w-full max-w-[420px]"><div className="mb-10 lg:hidden"><div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-slate-950 text-teal-300"><Sparkles className="h-5 w-5" /></div><p className="mt-4 text-sm font-semibold">EUMIND · The Green Loop</p></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Welcome back</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Sign in to your workspace</h2><p className="mt-3 text-sm leading-6 text-slate-500">Use the email and password from your team lead invitation.</p></div><form onSubmit={handleLogin} className="mt-8 space-y-5"><div><label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">Email address</label><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" /></div><div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Password</label><Link href="/forgot-password" className="text-xs font-semibold text-teal-700 hover:text-teal-900">Forgot password?</Link></div><div className="relative"><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>{error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">{error}</div>}<button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Signing you in..." : "Sign in to workspace"}{!loading && <ArrowRight className="h-4 w-4" />}</button></form><p className="mt-8 text-center text-xs leading-5 text-slate-400">Only invited EUMIND team members can access this workspace.<br />Ask your team lead if you need an account.</p></div></section></main>
}
