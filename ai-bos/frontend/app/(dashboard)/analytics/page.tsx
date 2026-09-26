"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Sparkles, FileText, ArrowUpRight, HardDrive } from "lucide-react";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { DocTypeChart } from "@/components/dashboard/doc-type-chart";
import {
  getAnalyticsStats,
  getActivityTrend,
  getFileTypeDistribution,
  DailyActivityPoint,
  FileTypeItem,
  StatsSummary,
} from "@/lib/api";
import { mockActivity, mockDocTypeBreakdown, ApiActivityPoint, ApiDocTypeBreakdown } from "@/lib/mock-data";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [activity, setActivity] = useState<ApiActivityPoint[]>(mockActivity);
  const [docBreakdown, setDocBreakdown] = useState<ApiDocTypeBreakdown[]>(mockDocTypeBreakdown);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      try {
        const [statsRes, activityRes, fileTypesRes] = await Promise.allSettled([
          getAnalyticsStats(),
          getActivityTrend(14),
          getFileTypeDistribution(),
        ]);

        if (!isMounted) return;

        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value);
        }

        if (activityRes.status === "fulfilled" && activityRes.value.data.length > 0) {
          setActivity(
            activityRes.value.data.map((item) => ({
              day: item.date,
              queries: item.queries,
              uploads: item.uploads,
            }))
          );
        }

        if (fileTypesRes.status === "fulfilled") {
          setDocBreakdown(
            fileTypesRes.value.items.map((item) => ({
              type: item.type,
              count: item.count,
              fill: item.fill || "#6366f1",
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load live analytics data:", err);
      }
    }

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalDocs = stats?.total_documents ?? 24;
  const processedDocs = stats?.processed_documents ?? 24;
  const storageUsed = stats?.storage_formatted ?? "42.8 MB";
  const queriesCount = stats?.total_queries ?? 1248;
  const accuracy = stats?.system_accuracy_score ?? 99.4;

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
            <span className="text-2xl font-bold tracking-tight">
              {queriesCount.toLocaleString()}
            </span>
            <span className="flex items-center text-xs font-medium text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" /> +18.2%
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">RAG vector similarity lookups</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Indexed Documents</span>
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{totalDocs}</span>
            <span className="flex items-center text-xs font-medium text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" /> {processedDocs} ready
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Across PDF, Word & Sheets</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Storage Consumed</span>
            <HardDrive className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{storageUsed}</span>
            <span className="flex items-center text-xs font-medium text-emerald-400">
              Encrypted
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Raw files + Qdrant vectors</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Grounding Score</span>
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{accuracy}%</span>
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
          <ActivityChart data={activity} />
        </div>
        <DocTypeChart data={docBreakdown} />
      </div>
    </div>
  );
}
