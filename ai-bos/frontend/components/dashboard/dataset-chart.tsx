"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts";
import { ChartDataset } from "@/lib/api";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";

const COLORS = [
  "hsl(211, 100%, 50%)", // System Blue
  "hsl(135, 59%, 49%)",  // System Green
  "hsl(35, 100%, 50%)",  // System Orange
  "hsl(0, 100%, 50%)",   // System Red
  "hsl(262, 80%, 65%)",  // Purple
  "hsl(172, 66%, 50%)",  // Teal
];

export function DatasetChart({ dataset, priority = false }: { dataset: ChartDataset, priority?: boolean }) {
  const [overrideType, setOverrideType] = useState<string | null>(null);

  if (!dataset.data || dataset.data.length === 0) return null;

  const currentType = overrideType || dataset.chart_type;
  
  // Format scatter data
  const scatterData = dataset.chart_type === "scatter" 
    ? dataset.data.map(d => ({ x: parseFloat(d.name) || 0, y: d.value }))
    : [];

  return (
    <div className={`flex flex-col h-full rounded-3xl border border-white/20 dark:border-white/10 bg-white/70 dark:bg-black/60 p-5 backdrop-blur-2xl shadow-ios dark:shadow-ios-dark transition-all duration-300 hover:shadow-xl ${priority ? 'lg:col-span-2 min-h-[400px]' : ''}`}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground tracking-tight">{dataset.title}</h3>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={dataset.document_name}>
            Source: {dataset.document_name}
          </p>
        </div>
        
        {/* Chart type toggle for categorical data */}
        {(dataset.chart_type === "pie" || dataset.chart_type === "bar") && (
          <div className="flex bg-black/5 dark:bg-white/5 rounded-full p-1">
            <button 
              onClick={() => setOverrideType("bar")}
              className={`p-1.5 rounded-full transition-colors ${currentType === "bar" ? "bg-white dark:bg-black shadow-sm" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
            >
              <BarChart3 className="h-3.5 w-3.5 text-foreground" />
            </button>
            <button 
              onClick={() => setOverrideType("pie")}
              className={`p-1.5 rounded-full transition-colors ${currentType === "pie" ? "bg-white dark:bg-black shadow-sm" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
            >
              <PieChartIcon className="h-3.5 w-3.5 text-foreground" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {currentType === "pie" ? (
            <PieChart>
              <Pie
                data={dataset.data}
                cx="50%"
                cy="50%"
                innerRadius={priority ? 80 : 60}
                outerRadius={priority ? 120 : 100}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
              >
                {dataset.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--background) / 0.8)",
                  backdropFilter: "blur(12px)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          ) : currentType === "line" ? (
            <LineChart data={dataset.data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                width={40}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--background) / 0.8)",
                  backdropFilter: "blur(12px)",
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3} 
                dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          ) : currentType === "scatter" ? (
            <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="X"
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                dy={10}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Y"
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                width={40}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--background) / 0.8)",
                  backdropFilter: "blur(12px)",
                }}
              />
              <Scatter name="Data" data={scatterData} fill="hsl(var(--primary))" />
            </ScatterChart>
          ) : (
            <BarChart data={dataset.data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                width={40}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--background) / 0.8)",
                  backdropFilter: "blur(12px)",
                }}
              />
              <Bar 
                dataKey="value" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={60}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
