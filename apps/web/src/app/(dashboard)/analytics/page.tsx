"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Briefcase,
  TrendingUp,
  Target,
} from "lucide-react";
import {
  AreaChart,
  Area,
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
import {
  useAnalyticsOverview,
  useAnalyticsTrends,
  useTopNiches,
  useTopCities,
} from "@/hooks/use-analytics";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl p-3 shadow-xl">
      <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 rounded" />
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [trendPeriod, setTrendPeriod] = React.useState("daily");
  const { data: overviewRes, isLoading: overviewLoading } = useAnalyticsOverview();
  const { data: trendsRes, isLoading: trendsLoading } = useAnalyticsTrends(trendPeriod);
  const { data: nichesRes, isLoading: nichesLoading } = useTopNiches();
  const { data: citiesRes, isLoading: citiesLoading } = useTopCities();

  const overview = overviewRes?.data;
  const trends = trendsRes?.data ?? [];
  const niches = nichesRes?.data ?? [];
  const cities = citiesRes?.data ?? [];

  // Build score distribution buckets from trends data
  const scoreBuckets = React.useMemo(() => {
    const buckets = [
      { range: "0-20", count: 0 },
      { range: "21-40", count: 0 },
      { range: "41-60", count: 0 },
      { range: "61-80", count: 0 },
      { range: "81-100", count: 0 },
    ];
    trends.forEach((t) => {
      const s = t.score;
      if (s <= 20) buckets[0].count++;
      else if (s <= 40) buckets[1].count++;
      else if (s <= 60) buckets[2].count++;
      else if (s <= 80) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  }, [trends]);

  const periods = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
  ];

  return (
    <motion.div
      className="space-y-6"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Analytics</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Performance metrics and insights
        </p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        variants={stagger}
      >
        {overviewLoading ? (
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
                label="Total Leads Generated"
                value={overview?.totalLeads ?? 0}
                trend={
                  overview?.leadsGrowthPercent
                    ? {
                        value: Math.abs(Math.round(overview.leadsGrowthPercent)),
                        direction: overview.leadsGrowthPercent >= 0 ? "up" : "down",
                      }
                    : undefined
                }
              />
            </motion.div>
            <motion.div variants={fadeUp}>
              <StatCard
                icon={<Briefcase className="h-5 w-5" />}
                label="Total Jobs Run"
                value={overview?.totalScrapingJobs ?? 0}
              />
            </motion.div>
            <motion.div variants={fadeUp}>
              <StatCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Avg Lead Score"
                value={overview?.averageLeadScore ? Math.round(overview.averageLeadScore) : 0}
              />
            </motion.div>
            <motion.div variants={fadeUp}>
              <StatCard
                icon={<Target className="h-5 w-5" />}
                label="Conversion Rate"
                value={`${overview?.conversionRate ? Math.round(overview.conversionRate * 100) : 0}%`}
              />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Lead Trends */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Lead Trends</CardTitle>
            <div className="flex gap-1 rounded-lg border border-[var(--color-border)] p-0.5">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setTrendPeriod(p.value)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all duration-200 ${
                    trendPeriod === p.value
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
              </div>
            ) : trends.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-[var(--color-text-muted)]">
                No trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="trendConverted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "var(--color-text-dim)" }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-text-dim)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    name="Leads"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#trendLeads)"
                  />
                  <Area
                    type="monotone"
                    dataKey="converted"
                    name="Converted"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#trendConverted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tables Row */}
      <motion.div className="grid grid-cols-1 gap-4 lg:grid-cols-2" variants={stagger}>
        {/* Top Niches Table */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Top Niches</CardTitle>
            </CardHeader>
            <CardContent>
              {nichesLoading ? (
                <TableSkeleton />
              ) : niches.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-sm text-[var(--color-text-muted)]">
                  No niche data
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="pb-3 text-left font-medium text-[var(--color-text-muted)]">Niche</th>
                        <th className="pb-3 text-right font-medium text-[var(--color-text-muted)]">Leads</th>
                        <th className="pb-3 text-right font-medium text-[var(--color-text-muted)]">Avg Score</th>
                        <th className="pb-3 text-right font-medium text-[var(--color-text-muted)]">Hot</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {niches.slice(0, 10).map((n: any) => (
                        <tr key={n.niche} className="transition-colors hover:bg-[var(--color-surface)]/50">
                          <td className="py-2.5 font-medium text-[var(--color-text)]">{n.niche}</td>
                          <td className="py-2.5 text-right text-[var(--color-text-muted)]">{n.count}</td>
                          <td className="py-2.5 text-right text-[var(--color-text-muted)]">{n.avgScore ?? "-"}</td>
                          <td className="py-2.5 text-right text-[var(--color-hot,#ef4444)]">{n.hotCount ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Cities Table */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Top Cities</CardTitle>
            </CardHeader>
            <CardContent>
              {citiesLoading ? (
                <TableSkeleton />
              ) : cities.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-sm text-[var(--color-text-muted)]">
                  No city data
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="pb-3 text-left font-medium text-[var(--color-text-muted)]">City</th>
                        <th className="pb-3 text-right font-medium text-[var(--color-text-muted)]">Leads</th>
                        <th className="pb-3 text-right font-medium text-[var(--color-text-muted)]">Avg Score</th>
                        <th className="pb-3 text-right font-medium text-[var(--color-text-muted)]">Hot</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {cities.slice(0, 10).map((c: any) => (
                        <tr key={c.city} className="transition-colors hover:bg-[var(--color-surface)]/50">
                          <td className="py-2.5 font-medium text-[var(--color-text)]">{c.city}</td>
                          <td className="py-2.5 text-right text-[var(--color-text-muted)]">{c.count}</td>
                          <td className="py-2.5 text-right text-[var(--color-text-muted)]">{c.avgScore ?? "-"}</td>
                          <td className="py-2.5 text-right text-[var(--color-hot,#ef4444)]">{c.hotCount ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Score Distribution */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-[260px] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={scoreBuckets} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 11, fill: "var(--color-text-dim)" }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-text-dim)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="count"
                    name="Leads"
                    fill="var(--color-accent)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={56}
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
