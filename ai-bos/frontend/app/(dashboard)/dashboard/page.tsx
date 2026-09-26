"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { DocTypeChart } from "@/components/dashboard/doc-type-chart";
import { RecentUploads } from "@/components/dashboard/recent-uploads";
import { RecentChats, GenericChatDisplay } from "@/components/dashboard/recent-chats";

import {
  getAnalyticsStats,
  getActivityTrend,
  getFileTypeDistribution,
  getRecentUploads,
  getConversations,
  FileTypeItem,
  DailyActivityPoint,
  RecentUploadItem,
} from "@/lib/api";
import {
  mockStats,
  mockActivity,
  mockDocTypeBreakdown,
  mockRecentUploads,
  mockRecentChats,
  ApiStat,
  ApiActivityPoint,
  ApiDocTypeBreakdown,
  ApiUpload,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const [stats, setStats] = useState<ApiStat[]>(mockStats);
  const [activity, setActivity] = useState<ApiActivityPoint[]>(mockActivity);
  const [docBreakdown, setDocBreakdown] = useState<ApiDocTypeBreakdown[]>(mockDocTypeBreakdown);
  const [recentUploads, setRecentUploads] = useState<ApiUpload[]>(mockRecentUploads);
  const [recentChats, setRecentChats] = useState<GenericChatDisplay[]>(mockRecentChats);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [statsRes, activityRes, fileTypesRes, uploadsRes, convsRes] =
          await Promise.allSettled([
            getAnalyticsStats(),
            getActivityTrend(14),
            getFileTypeDistribution(),
            getRecentUploads(5),
            getConversations(),
          ]);

        if (!isMounted) return;

        if (statsRes.status === "fulfilled") {
          const s = statsRes.value;
          setStats([
            {
              id: "total-documents",
              label: "Total Documents",
              value: s.total_documents.toLocaleString(),
              change: `${s.processed_documents} indexed`,
              trend: "up",
              subtext: `${s.processing_documents} processing / ${s.failed_documents} failed`,
            },
            {
              id: "storage-used",
              label: "Storage Consumed",
              value: s.storage_formatted,
              change: s.total_storage_bytes > 0 ? "Active" : "Ready",
              trend: "neutral",
              subtext: "Encrypted disk storage",
            },
            {
              id: "ai-queries",
              label: "AI Queries Run",
              value: s.total_queries.toLocaleString(),
              change: "+18%",
              trend: "up",
              subtext: "RAG citation engine",
            },
            {
              id: "system-accuracy",
              label: "Grounding Rate",
              value: `${s.system_accuracy_score}%`,
              change: "Verified",
              trend: "up",
              subtext: "Citation verification score",
            },
          ]);
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

        if (uploadsRes.status === "fulfilled" && uploadsRes.value.length > 0) {
          setRecentUploads(
            uploadsRes.value.map((u) => ({
              id: u.id,
              name: u.name,
              type: u.type as any,
              size: u.size,
              status: u.status as any,
              uploadedAt: u.uploaded_at,
              uploadedBy: "You",
            }))
          );
        }

        if (convsRes.status === "fulfilled") {
          if (convsRes.value.length > 0) {
            setRecentChats(
              convsRes.value.slice(0, 5).map((c) => ({
                id: c.id,
                title: c.title,
                lastMessage: c.last_message,
                sources: c.sources_count,
                createdAt: c.created_at,
              }))
            );
          } else {
            setRecentChats([]);
          }
        }
      } catch (err) {
        console.error("Failed to load live dashboard data:", err);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

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
        <RecentChats chats={recentChats} />
      </div>
    </div>
  );
}
