"use client";

import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
}

function StatCard({ icon, label, value, trend, className, ...props }: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl p-6 transition-all duration-300",
        "hover:border-[var(--color-border-hover)] hover:shadow-lg hover:shadow-[var(--color-primary)]/5",
        className
      )}
      {...props}
    >
      {/* Subtle glow effect on hover */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--color-primary)]/0 transition-all duration-500 group-hover:bg-[var(--color-primary)]/5 group-hover:blur-2xl" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            {icon}
          </div>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">{label}</p>
          <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
        </div>

        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              trend.direction === "up"
                ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                : "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
}

export { StatCard };
