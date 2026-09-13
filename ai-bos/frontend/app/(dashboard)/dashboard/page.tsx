/**
 * app/(dashboard)/dashboard/page.tsx
 *
 * Step 3 — Dashboard UI (mock data)
 *
 * This is a Server Component. All mock data is imported at the top of the file.
 * When the backend is ready, replace the mock-data imports with real fetch()
 * calls inside this component (or inside a dedicated data-fetching layer).
 *
 * Layout at ≥ lg breakpoint:
 *   Row 1: 4 KPI stat cards
 *   Row 2: Activity chart (2/3 width) | Doc-type chart (1/3 width)
 *   Row 3: Recent uploads (1/2) | Recent chats (1/2)
 *
 * Smaller screens stack everything vertically (default flex behaviour).
 */
import { Upload, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { DocTypeChart } from "@/components/dashboard/doc-type-chart";
import { RecentUploads } from "@/components/dashboard/recent-uploads";
import { RecentChats } from "@/components/dashboard/recent-chats";

import {
  mockStats,
  mockActivity,
  mockDocTypeBreakdown,
  mockRecentUploads,
  mockRecentChats,
} from "@/lib/mock-data";

export const metadata = {
  title: "Dashboard — AI BOS",
  description: "Overview of your AI Business Operating System activity.",
};

export default function DashboardPage() {
  // In Step 8+, these will be replaced with:
  //   const stats   = await fetchDashboardStats();
  //   const activity = await fetchActivity({ days: 14 });
  //   etc.
  const stats            = mockStats;
  const activity         = mockActivity;
  const docBreakdown     = mockDocTypeBreakdown;
  const recentUploads    = mockRecentUploads;
  const recentChats      = mockRecentChats;

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Welcome back — here&apos;s what&apos;s happening with your data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/documents">
              <Upload className="h-4 w-4" />
              Upload
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/chat">
              <Sparkles className="h-4 w-4" />
              Ask AI
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Row 1: KPI stat cards ──────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      {/* ── Row 2: Charts ──────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart data={activity} />
        </div>
        <DocTypeChart data={docBreakdown} />
      </div>

      {/* ── Row 3: Lists ───────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentUploads uploads={recentUploads} />
        <RecentChats   chats={recentChats}   />
      </div>
    </div>
  );
}
