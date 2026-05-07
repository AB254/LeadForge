"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface PriorityChartProps {
  hot: number;
  warm: number;
  cold: number;
  isLoading?: boolean;
}

const COLORS = {
  hot: "#ef4444",
  warm: "#f59e0b",
  cold: "#3b82f6",
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl p-3 shadow-xl">
      <p className="text-sm font-semibold" style={{ color: payload[0].payload.fill }}>
        {payload[0].name}: {payload[0].value}
      </p>
    </div>
  );
}

function renderLegend(props: any) {
  const { payload } = props;
  return (
    <div className="flex items-center justify-center gap-4 mt-2">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-[var(--color-text-muted)]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function PriorityChart({ hot, warm, cold, isLoading }: PriorityChartProps) {
  const total = hot + warm + cold;
  const data = [
    { name: "Hot", value: hot, fill: COLORS.hot },
    { name: "Warm", value: warm, fill: COLORS.warm },
    { name: "Cold", value: cold, fill: COLORS.cold },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Lead Priority Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[280px] flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
          </div>
        ) : total === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-sm text-[var(--color-text-muted)]">
            No leads yet
          </div>
        ) : (
          <div className="relative">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderLegend} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-2xl font-bold text-[var(--color-text)]">{total}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Total</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { PriorityChart };
