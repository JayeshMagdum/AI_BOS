/**
 * doc-type-chart.tsx
 *
 * Horizontal bar chart showing document counts grouped by file type.
 * Compact — designed to sit alongside the activity chart in a 2-col grid.
 */
"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ApiDocTypeBreakdown } from "@/lib/mock-data";

interface DocTypeChartProps {
  data: ApiDocTypeBreakdown[];
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: ApiDocTypeBreakdown }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-card-foreground">{item.payload.type}</p>
      <p className="text-muted-foreground">
        {item.value} document{item.value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function DocTypeChart({ data }: DocTypeChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Documents by Type
        </CardTitle>
        <CardDescription>{total} total documents</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="type"
              type="category"
              tick={{ fontSize: 12, fill: "hsl(var(--foreground))", fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell key={entry.type} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Percentage breakdown */}
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
          {data.map((entry) => (
            <div key={entry.type} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="text-muted-foreground">{entry.type}</span>
              </div>
              <span className="font-medium text-foreground">
                {Math.round((entry.count / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
