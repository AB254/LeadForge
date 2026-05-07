"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Flame,
  Briefcase,
  TrendingUp,
  MapPin,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadStats } from "@/hooks/use-leads";
import { useScrapingJobs } from "@/hooks/use-scraper";
import { useAnalyticsTrends, useTopNiches, useTopCities } from "@/hooks/use-analytics";
import { LeadsChart } from "@/components/dashboard/leads-chart";
import { PriorityChart } from "@/components/dashboard/priority-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl p-3 shadow-xl">
      <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className="text-sm font-semibold text-[var(--color-primary)]">
        {payload[0].value} leads
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { data: statsRes, isLoading: statsLoading } = useLeadStats();
  const { data: jobsRes, isLoading: jobsLoading } = useScrapingJobs({ pageSize: 5 });
  const { data: trendsRes, isLoading: trendsLoading } = useAnalyticsTrends("30d");
  const { data: nichesRes, isLoading: nichesLoading } = useTopNiches();
  const { data: citiesRes, isLoading: citiesLoading } = useTopCities();

  const stats = statsRes?.data;
  const jobs = jobsRes?.data ?? [];
  const trends = trendsRes?.data ?? [];
  const niches = nichesRes?.data ?? [];
  const cities = citiesRes?.data ?? [];

  const activeJobs = jobs.filter(
    (j) => j.status === "RUNNING" || j.status === "PENDING"
  ).length;

  return (
    <motion.div
      className="space-y-6"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Dashboard</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Lead generation overview
        </p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        variants={stagger}
      >
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Skeleton className="h-[130px] rounded-xl" />
            </motion.div>
          ))
        ) : (
          <>
            <motion.div variants={fadeUp}>
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label="Total Leads"
                value={stats?.totalLeads ?? 0}
                trend={
                  stats?.newThisWeek
                    ? { value: Math.round((stats.newThisWeek / Math.max(stats.totalLeads, 1)) * 100), direction: "up" }
                    : undefined
                }
              />
            </motion.div>
            <motion.div variants={fadeUp}>
              <StatCard
                icon={<Flame className="h-5 w-5" />}
                label="Hot Leads"
                value={stats?.hotLeads ?? 0}
                trend={
                  stats?.hotLeads
                    ? { value: Math.round((stats.hotLeads / Math.max(stats.totalLeads, 1)) * 100), direction: "up" }
                    : undefined
                }
              />
            </motion.div>
            <motion.div variants={fadeUp}>
              <StatCard
                icon={<Briefcase className="h-5 w-5" />}
                label="Active Jobs"
                value={activeJobs}
              />
            </motion.div>
            <motion.div variants={fadeUp}>
              <StatCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Avg Score"
                value={stats?.averageScore ? Math.round(stats.averageScore) : 0}
              />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Charts Row */}
      <motion.div className="grid grid-cols-1 gap-4 lg:grid-cols-2" variants={stagger}>
        <motion.div variants={fadeUp}>
          <LeadsChart data={trends} isLoading={trendsLoading} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <PriorityChart
            hot={stats?.hotLeads ?? 0}
            warm={stats?.warmLeads ?? 0}
            cold={stats?.coldLeads ?? 0}
            isLoading={statsLoading}
          />
        </motion.div>
      </motion.div>

      {/* Niches + Activity Row */}
      <motion.div className="grid grid-cols-1 gap-4 lg:grid-cols-2" variants={stagger}>
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Top Niches</CardTitle>
            </CardHeader>
            <CardContent>
              {nichesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 rounded" />
                  ))}
                </div>
              ) : niches.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-sm text-[var(--color-text-muted)]">
                  No niche data yet
                </div>
              ) : (
                <div className="space-y-3">
                  {niches.slice(0, 6).map((n, i) => {
                    const maxCount = niches[0]?.count ?? 1;
                    const pct = Math.round((n.count / maxCount) * 100);
                    return (
                      <div key={n.niche} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-[var(--color-text)]">
                            {n.niche}
                          </span>
                          <span className="text-[var(--color-text-muted)]">
                            {n.count}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface)]">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp}>
          <RecentActivity jobs={jobs} isLoading={jobsLoading} />
        </motion.div>
      </motion.div>

      {/* Top Cities Row */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <MapPin className="h-5 w-5 text-[var(--color-primary)]" />
            <CardTitle>Top Cities</CardTitle>
          </CardHeader>
          <CardContent>
            {citiesLoading ? (
              <div className="h-[260px] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
              </div>
            ) : cities.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-[var(--color-text-muted)]">
                No city data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={cities.slice(0, 10)}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="city"
                    tick={{ fontSize: 11, fill: "var(--color-text-dim)" }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-text-dim)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="var(--color-primary)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
