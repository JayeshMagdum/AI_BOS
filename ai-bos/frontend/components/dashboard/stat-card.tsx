/**
 * stat-card.tsx
 *
 * A KPI metric card displayed in the top row of the dashboard.
 * Shows a label, large value, a colour-coded trend badge, and supporting subtext.
 * The trend colouring uses semantic CSS tokens (--success / --destructive) so it
 * automatically adapts to light/dark mode without any extra logic.
 */
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ApiStat } from "@/lib/mock-data";

interface StatCardProps {
  stat: ApiStat;
}

const trendConfig = {
  up: {
    icon: TrendingUp,
    className: "text-success bg-success/10",
  },
  down: {
    icon: TrendingDown,
    className: "text-destructive bg-destructive/10",
  },
  neutral: {
    icon: Minus,
    className: "text-muted-foreground bg-muted",
  },
};

export function StatCard({ stat }: StatCardProps) {
  const { icon: Icon, className: badgeClass } = trendConfig[stat.trend];

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle>{stat.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            {stat.value}
          </span>
          <span
            className={cn(
              "mb-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              badgeClass
            )}
          >
            <Icon className="h-3 w-3" />
            {stat.change}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{stat.subtext}</p>
      </CardContent>
    </Card>
  );
}
