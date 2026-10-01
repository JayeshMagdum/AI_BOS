"use client";

import React, { useEffect, useState } from "react";
import { Lightbulb, Database, FileText, Activity, AlertCircle } from "lucide-react";
import {
  getAnalyticsStats,
  getAnalyticsOverview,
  StatsSummary,
  AnalyticsOverview,
} from "@/lib/api";
import { DatasetChart } from "@/components/dashboard/dataset-chart";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [statsRes, overviewRes] = await Promise.all([
          getAnalyticsStats(),
          getAnalyticsOverview(),
        ]);
        
        if (!isMounted) return;
        setStats(statsRes);
        setOverview(overviewRes);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
        if (isMounted) setError("Failed to load analytics data. Please try again later.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalDocs = stats?.total_documents ?? 0;
  const storageUsed = stats?.storage_formatted ?? "0 B";
  const queriesCount = stats?.total_queries ?? 0;

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Analyzing document data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-destructive/5 rounded-3xl border border-destructive/20">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground">Error</h3>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  const hasCharts = overview && overview.chart_datasets.length > 0;

  return (
    <div className="space-y-8">
      {/* ── Page Header ───────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Business Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-driven insights and interactive charts derived directly from your uploaded documents.
        </p>
      </div>

      {/* ── System Usage Strip ────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 text-sm bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 pr-4 border-r border-black/10 dark:border-white/10">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{totalDocs}</span>
          <span className="text-muted-foreground">Documents</span>
        </div>
        <div className="flex items-center gap-2 pr-4 border-r border-black/10 dark:border-white/10">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{storageUsed}</span>
          <span className="text-muted-foreground">Storage</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{queriesCount}</span>
          <span className="text-muted-foreground">AI Queries</span>
        </div>
      </div>

      {/* ── AI Insights ───────────────────────────────────── */}
      {overview && overview.insights.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" /> Key Insights
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {overview.insights.map((insight, idx) => (
              <div 
                key={idx} 
                className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/70 dark:bg-black/60 p-4 backdrop-blur-xl shadow-sm"
              >
                <p className="text-sm font-medium leading-snug">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Dynamic Charts ────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Data Visualizations
        </h2>
        
        {!hasCharts ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No Chartable Data Found</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Upload spreadsheets (CSV/XLSX) or documents with identifiable metrics and facts. 
              Charts will automatically appear here once data is extracted.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {overview.chart_datasets.map((dataset, idx) => (
              <DatasetChart 
                key={`${dataset.document_id}-${idx}`} 
                dataset={dataset} 
                priority={idx === 0 || dataset.chart_type === 'line'} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
