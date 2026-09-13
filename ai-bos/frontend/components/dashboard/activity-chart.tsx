/**
 * activity-chart.tsx
 *
 * Recharts ResponsiveContainer + AreaChart showing AI queries and document
 * uploads over the last 14 days.
 *
 * "use client" is required because Recharts touches the DOM and cannot
 * be server-rendered. Everything that renders a Recharts component must
 * carry this directive.
 */
"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ApiActivityPoint } from "@/lib/mock-data";

interface ActivityChartProps {
  data: ApiActivityPoint[];
}

// Custom tooltip so it inherits our card styles and theme tokens.
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="mb-1.5 font-medium text-card-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium text-card-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Activity — Last 14 Days
        </CardTitle>
        <CardDescription>AI queries and document uploads per day</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradQueries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(222,89%,65%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(222,89%,65%)" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="gradUploads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(172,66%,50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(172,66%,50%)" stopOpacity={0}   />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltip />} />

            <Area
              type="monotone"
              dataKey="queries"
              name="Queries"
              stroke="hsl(222,89%,65%)"
              strokeWidth={2}
              fill="url(#gradQueries)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="uploads"
              name="Uploads"
              stroke="hsl(172,66%,50%)"
              strokeWidth={2}
              fill="url(#gradUploads)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[hsl(222,89%,65%)]" />
            AI Queries
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[hsl(172,66%,50%)]" />
            Uploads
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
