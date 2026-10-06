"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Polls } from "@/components/polls";

export default function PollsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div>
        <Link
          href="/overview"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to overview
        </Link>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Decision making
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Quick polls
            </h1>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Get the team&apos;s opinion fast. Anyone can vote on a poll — the leader creates new ones. Votes update in real-time.
        </p>
      </div>
      <Polls />
    </div>
  );
}
