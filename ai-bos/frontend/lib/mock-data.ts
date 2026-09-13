/**
 * mock-data.ts
 *
 * Single source of truth for all mock dashboard data.
 * Structured exactly as future /api/v1/dashboard/* endpoints will return,
 * so wiring in the real backend later is a one-line swap per data section.
 *
 * Conventions:
 *   - All timestamps are ISO 8601 strings (what JSON serialisation gives us)
 *   - Monetary values are pre-formatted strings (server's responsibility)
 *   - chart fill colours live here so the server can own them later
 */

// ─── KPI Stats ───────────────────────────────────────────────────────────────

export type ApiStatTrend = "up" | "down" | "neutral";

export interface ApiStat {
  id: string;
  label: string;
  value: string;    // pre-formatted, e.g. "$12,430"
  change: string;   // e.g. "+8.2%"
  trend: ApiStatTrend;
  subtext: string;  // e.g. "vs. last month"
}

export const mockStats: ApiStat[] = [
  {
    id: "total-documents",
    label: "Total Documents",
    value: "248",
    change: "+18",
    trend: "up",
    subtext: "uploaded this month",
  },
  {
    id: "ai-queries",
    label: "AI Queries",
    value: "1,842",
    change: "+24.6%",
    trend: "up",
    subtext: "vs. last month",
  },
  {
    id: "monthly-revenue",
    label: "Monthly Revenue",
    value: "$12,430",
    change: "+8.2%",
    trend: "up",
    subtext: "vs. last month",
  },
  {
    id: "active-users",
    label: "Active Users",
    value: "94",
    change: "-3",
    trend: "down",
    subtext: "vs. last month",
  },
];

// ─── Activity Chart ───────────────────────────────────────────────────────────

export interface ApiActivityPoint {
  day: string;
  queries: number;
  uploads: number;
}

/** Last 14 days of activity */
export const mockActivity: ApiActivityPoint[] = [
  { day: "Aug 30", queries: 42,  uploads: 5  },
  { day: "Aug 31", queries: 58,  uploads: 8  },
  { day: "Sep 1",  queries: 35,  uploads: 3  },
  { day: "Sep 2",  queries: 72,  uploads: 11 },
  { day: "Sep 3",  queries: 91,  uploads: 14 },
  { day: "Sep 4",  queries: 67,  uploads: 9  },
  { day: "Sep 5",  queries: 48,  uploads: 6  },
  { day: "Sep 6",  queries: 110, uploads: 18 },
  { day: "Sep 7",  queries: 134, uploads: 22 },
  { day: "Sep 8",  queries: 88,  uploads: 12 },
  { day: "Sep 9",  queries: 145, uploads: 19 },
  { day: "Sep 10", queries: 162, uploads: 25 },
  { day: "Sep 11", queries: 138, uploads: 17 },
  { day: "Sep 12", queries: 176, uploads: 28 },
];

// ─── Recent Uploads ───────────────────────────────────────────────────────────

export type ApiFileStatus = "processed" | "processing" | "failed";
export type ApiFileType = "pdf" | "docx" | "csv" | "xlsx";

export interface ApiUpload {
  id: string;
  name: string;
  type: ApiFileType;
  size: string;
  status: ApiFileStatus;
  uploadedAt: string;
  uploadedBy: string;
}

export const mockRecentUploads: ApiUpload[] = [
  {
    id: "ul-001",
    name: "Q3_Financial_Report.pdf",
    type: "pdf",
    size: "3.2 MB",
    status: "processed",
    uploadedAt: "2026-09-12T13:24:00Z",
    uploadedBy: "You",
  },
  {
    id: "ul-002",
    name: "Customer_Database_Sep2026.xlsx",
    type: "xlsx",
    size: "1.8 MB",
    status: "processed",
    uploadedAt: "2026-09-12T10:05:00Z",
    uploadedBy: "You",
  },
  {
    id: "ul-003",
    name: "Sales_Pipeline_Summary.docx",
    type: "docx",
    size: "540 KB",
    status: "processing",
    uploadedAt: "2026-09-12T09:47:00Z",
    uploadedBy: "You",
  },
  {
    id: "ul-004",
    name: "Marketing_Spend_Aug.csv",
    type: "csv",
    size: "128 KB",
    status: "processed",
    uploadedAt: "2026-09-11T17:30:00Z",
    uploadedBy: "You",
  },
  {
    id: "ul-005",
    name: "Product_Roadmap_2026.pdf",
    type: "pdf",
    size: "5.7 MB",
    status: "processed",
    uploadedAt: "2026-09-11T14:12:00Z",
    uploadedBy: "You",
  },
];

// ─── Recent AI Chats ──────────────────────────────────────────────────────────

export interface ApiChat {
  id: string;
  title: string;
  lastMessage: string;
  sources: number;
  createdAt: string;
}

export const mockRecentChats: ApiChat[] = [
  {
    id: "ch-001",
    title: "Q3 Revenue Breakdown",
    lastMessage: "What were the top 3 revenue sources in Q3?",
    sources: 4,
    createdAt: "2026-09-12T14:01:00Z",
  },
  {
    id: "ch-002",
    title: "Customer Churn Analysis",
    lastMessage: "Show me the churn rate trend for the past 6 months.",
    sources: 2,
    createdAt: "2026-09-12T11:30:00Z",
  },
  {
    id: "ch-003",
    title: "Marketing ROI by Channel",
    lastMessage: "Which marketing channel had the highest ROI in August?",
    sources: 3,
    createdAt: "2026-09-11T16:45:00Z",
  },
  {
    id: "ch-004",
    title: "Inventory Status Check",
    lastMessage: "List all products with stock below 50 units.",
    sources: 1,
    createdAt: "2026-09-10T09:20:00Z",
  },
];

// ─── Document Type Breakdown ──────────────────────────────────────────────────

export interface ApiDocTypeBreakdown {
  type: string;
  count: number;
  fill: string;
}

export const mockDocTypeBreakdown: ApiDocTypeBreakdown[] = [
  { type: "PDF",  count: 112, fill: "hsl(222, 89%, 65%)"  },
  { type: "XLSX", count: 68,  fill: "hsl(262, 80%, 65%)"  },
  { type: "DOCX", count: 45,  fill: "hsl(172, 66%, 50%)"  },
  { type: "CSV",  count: 23,  fill: "hsl(32,  95%, 58%)"  },
];
