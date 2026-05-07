"use client";

import * as React from "react";
import { Clock, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ScrapingJob, ScrapingJobStatus } from "@/types";

interface RecentActivityProps {
  jobs: ScrapingJob[];
  isLoading?: boolean;
  onViewJob?: (job: ScrapingJob) => void;
}

function getStatusConfig(status: ScrapingJobStatus) {
  switch (status) {
    case "COMPLETED":
      return {
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        variant: "success" as const,
        label: "Completed",
      };
    case "RUNNING":
      return {
        icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
        variant: "default" as const,
        label: "Running",
      };
    case "FAILED":
      return {
        icon: <XCircle className="h-3.5 w-3.5" />,
        variant: "hot" as const,
        label: "Failed",
      };
    case "CANCELLED":
      return {
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        variant: "warm" as const,
        label: "Cancelled",
      };
    case "PENDING":
    default:
      return {
        icon: <Clock className="h-3.5 w-3.5" />,
        variant: "outline" as const,
        label: "Pending",
      };
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function RecentActivity({ jobs, isLoading, onViewJob }: RecentActivityProps) {
  const recentJobs = jobs?.slice(0, 5) ?? [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-[var(--color-surface)]"
            />
          ))
        ) : recentJobs.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-[var(--color-text-muted)]">
            No scraping jobs yet
          </div>
        ) : (
          recentJobs.map((job) => {
            const config = getStatusConfig(job.status);
            const progress =
              job.status === "RUNNING" && job.maxResults
                ? Math.round(((job.totalScraped ?? 0) / job.maxResults) * 100)
                : null;

            return (
              <button
                key={job.id}
                onClick={() => onViewJob?.(job)}
                className="flex w-full flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-3 text-left transition-all duration-200 hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-text)]">
                      {job.query}
                    </p>
                    {job.location && (
                      <p className="truncate text-xs text-[var(--color-text-muted)]">
                        {job.location}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={config.variant} className="flex items-center gap-1">
                      {config.icon}
                      {config.label}
                    </Badge>
                  </div>
                </div>
                {progress !== null && (
                  <Progress value={progress} showValue />
                )}
                {job.completedAt && (
                  <p className="text-xs text-[var(--color-text-dim)]">
                    {timeAgo(job.completedAt)}
                    {job.totalScraped != null && ` · ${job.totalScraped} scraped`}
                  </p>
                )}
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export { RecentActivity };
