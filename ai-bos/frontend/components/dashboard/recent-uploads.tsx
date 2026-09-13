/**
 * recent-uploads.tsx
 *
 * A list of the most recent document uploads.
 * Each row shows: file-type icon, name, size, relative timestamp, and status badge.
 *
 * Status badge colours use the semantic CSS tokens added to globals.css,
 * not hardcoded colours, so dark-mode just works.
 *
 * "formatRelativeTime" is a tiny local helper — later we can replace it with
 * date-fns or dayjs when the project grows.
 */
import Link from "next/link";
import { FileText, FileSpreadsheet, FileBarChart2, File } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ApiUpload, ApiFileType, ApiFileStatus } from "@/lib/mock-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1)  return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24)  return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

const fileTypeConfig: Record<ApiFileType, { icon: React.ElementType; colour: string }> = {
  pdf:  { icon: FileText,        colour: "text-red-500"    },
  xlsx: { icon: FileSpreadsheet, colour: "text-green-600"  },
  docx: { icon: FileBarChart2,   colour: "text-blue-500"   },
  csv:  { icon: File,            colour: "text-amber-500"  },
};

const statusConfig: Record<ApiFileStatus, { label: string; className: string }> = {
  processed:  { label: "Processed",  className: "bg-success/10 text-success" },
  processing: { label: "Processing", className: "bg-warning/10 text-warning animate-pulse" },
  failed:     { label: "Failed",     className: "bg-destructive/10 text-destructive" },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface RecentUploadsProps {
  uploads: ApiUpload[];
}

export function RecentUploads({ uploads }: RecentUploadsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            Recent Uploads
          </CardTitle>
          <CardDescription className="mt-0.5">
            Your latest {uploads.length} documents
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/documents">View all</Link>
        </Button>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <ul className="divide-y divide-border">
          {uploads.map((upload) => {
            const { icon: Icon, colour } = fileTypeConfig[upload.type];
            const { label, className: badgeClass } = statusConfig[upload.status];

            return (
              <li
                key={upload.id}
                className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/50"
              >
                {/* File type icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className={cn("h-4 w-4", colour)} />
                </div>

                {/* Name + size */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {upload.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {upload.size} &middot; {formatRelativeTime(upload.uploadedAt)}
                  </p>
                </div>

                {/* Status badge */}
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    badgeClass
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
