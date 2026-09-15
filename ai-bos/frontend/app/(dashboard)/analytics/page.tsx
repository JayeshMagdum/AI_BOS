"use client";

import React from "react";
import { BarChart3, TrendingUp, Users, Sparkles, FileText, ArrowUpRight } from "lucide-react";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { DocTypeChart } from "@/components/dashboard/doc-type-chart";
import { mockActivity, mockDocTypeBreakdown } from "@/lib/mock-data";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics & Intelligence</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          System performance metrics, document knowledge distribution, and AI query trends.
        </p>
      </div>

      {/* ── Stat Metric Cards ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">AI Queries</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">1,248</span>
            <span className="flex items-center text-xs font-medium text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" /> +18.2%
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Past 30 days</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Indexed Documents</span>
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">24</span>
            <span className="flex items-center text-xs font-medium text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" /> +4 this week
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Across PDF, Word & Sheets</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Latency</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">380ms</span>
            <span className="flex items-center text-xs font-medium text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" /> -12% faster
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Vector retrieval + inference</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Accuracy Score</span>
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">99.4%</span>
            <span className="flex items-center text-xs font-medium text-emerald-400">
              High confidence
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Citation grounding rate</p>
        </div>
      </div>

      {/* ── Charts ────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart data={mockActivity} />
        </div>
        <DocTypeChart data={mockDocTypeBreakdown} />
      </div>
    </div>
  );
}
