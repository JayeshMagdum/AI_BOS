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
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
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
  const stats            = mockStats;
  const activity         = mockActivity;
  const docBreakdown     = mockDocTypeBreakdown;
  const recentUploads    = mockRecentUploads;
  const recentChats      = mockRecentChats;

  return (
    <div className="space-y-6">
      <DashboardHeader />

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
