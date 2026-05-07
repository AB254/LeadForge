"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Globe,
  Layers,
  Lightbulb,
  PieChart as PieChartIcon,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { Skeleton } from "@/components/ui/skeleton";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const SERVICE_COLORS: Record<string, string> = {
  redesign: "#8b5cf6",
  seo: "#10b981",
  branding: "#f59e0b",
  ads: "#ef4444",
  ecommerce: "#3b82f6",
  automation: "#06b6d4",
};

interface AnalysisResult {
  url: string;
  design: number;
  seo: number;
  performance: number;
  mobile: number;
  overall: number;
  recommendations: string[];
}

function ServiceTooltip({ active, payload }: any) {
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
    <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-[var(--color-text-muted)] capitalize">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AiInsightsPage() {
  const [url, setUrl] = React.useState("");
  const [analyzing, setAnalyzing] = React.useState(false);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [selectedLeads, setSelectedLeads] = React.useState<string[]>([]);
  const [batchRunning, setBatchRunning] = React.useState(false);

  // Simulated service opportunity data
  const serviceData = [
    { name: "Redesign", value: 34, fill: SERVICE_COLORS.redesign },
    { name: "SEO", value: 28, fill: SERVICE_COLORS.seo },
    { name: "Branding", value: 18, fill: SERVICE_COLORS.branding },
    { name: "Ads", value: 12, fill: SERVICE_COLORS.ads },
    { name: "E-commerce", value: 22, fill: SERVICE_COLORS.ecommerce },
    { name: "Automation", value: 15, fill: SERVICE_COLORS.automation },
  ];

  const recommendations = [
    { service: "redesign", text: "Update outdated layouts to modern responsive frameworks", count: 14 },
    { service: "seo", text: "Add structured data and improve meta descriptions", count: 22 },
    { service: "seo", text: "Optimize page load speed below 3 seconds", count: 18 },
    { service: "branding", text: "Create consistent brand identity across web presence", count: 9 },
    { service: "ads", text: "Set up conversion tracking and retargeting pixels", count: 7 },
    { service: "ecommerce", text: "Implement online booking or e-commerce capabilities", count: 16 },
    { service: "automation", text: "Add chatbot or automated lead capture forms", count: 11 },
    { service: "redesign", text: "Improve mobile responsiveness and touch targets", count: 20 },
  ];

  async function handleAnalyze() {
    if (!url.trim()) return;
    setAnalyzing(true);
    setResult(null);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2500));

    setResult({
      url: url.trim(),
      design: Math.floor(Math.random() * 40 + 30),
      seo: Math.floor(Math.random() * 50 + 20),
      performance: Math.floor(Math.random() * 40 + 40),
      mobile: Math.floor(Math.random() * 50 + 30),
      overall: Math.floor(Math.random() * 30 + 40),
      recommendations: [
        "Website lacks SSL certificate - critical security issue",
        "No structured data markup found for local SEO",
        "Page load time exceeds 5 seconds on mobile",
        "Missing call-to-action above the fold",
        "No analytics or conversion tracking detected",
      ],
    });
    setAnalyzing(false);
  }

  async function handleBatchAnalysis() {
    setBatchRunning(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setBatchRunning(false);
    setSelectedLeads([]);
  }

  return (
    <motion.div
      className="space-y-6"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
          <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">AI Insights</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            AI-powered website analysis and recommendations
          </p>
        </div>
      </motion.div>

      {/* Quick Analysis */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-[var(--color-primary)]" />
              <CardTitle>Quick Analysis</CardTitle>
            </div>
            <CardDescription>Enter a website URL to get instant AI-powered analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-3">
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                leftIcon={<Globe className="h-4 w-4" />}
                className="flex-1"
              />
              <Button onClick={handleAnalyze} loading={analyzing} className="shrink-0">
                Analyze
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {analyzing && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Analyzing website...
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              </div>
            )}

            {result && !analyzing && (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4">
                  <p className="text-sm text-[var(--color-text-muted)] mb-4">
                    Analysis for{" "}
                    <span className="font-medium text-[var(--color-text)]">{result.url}</span>
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
                    <ScoreRing score={result.overall} label="Overall" size={90} />
                    <ScoreRing score={result.design} label="Design" size={72} />
                    <ScoreRing score={result.seo} label="SEO" size={72} />
                    <ScoreRing score={result.performance} label="Speed" size={72} />
                    <ScoreRing score={result.mobile} label="Mobile" size={72} />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">
                    AI Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/30 p-3 text-sm text-[var(--color-text-muted)]"
                      >
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning,#f59e0b)]" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Batch Analysis */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-[var(--color-accent)]" />
              <CardTitle>Batch Analysis</CardTitle>
            </div>
            <CardDescription>Select multiple leads and run AI analysis in bulk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center">
              {selectedLeads.length === 0 ? (
                <div className="space-y-3">
                  <Layers className="mx-auto h-10 w-10 text-[var(--color-text-dim)]" />
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Select leads from the Leads page, then return here to run batch analysis
                  </p>
                  <Button variant="secondary" size="sm" asChild>
                    <a href="/leads">Go to Leads</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--color-text)]">
                    <span className="font-semibold">{selectedLeads.length}</span> leads selected
                  </p>
                  <Button onClick={handleBatchAnalysis} loading={batchRunning}>
                    Run Batch Analysis
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Row */}
      <motion.div className="grid grid-cols-1 gap-4 lg:grid-cols-2" variants={stagger}>
        {/* Service Opportunities */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-[var(--color-primary)]" />
                <CardTitle>Service Opportunities</CardTitle>
              </div>
              <CardDescription>Distribution of needed services across analyzed leads</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ServiceTooltip />} />
                  <Legend content={renderLegend} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-[var(--color-warning,#f59e0b)]" />
                <CardTitle>AI Recommendations</CardTitle>
              </div>
              <CardDescription>Top recommendations across all analyzed leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {recommendations
                  .sort((a, b) => b.count - a.count)
                  .map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/30 p-3 transition-colors hover:bg-[var(--color-surface)]/60"
                    >
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: SERVICE_COLORS[rec.service] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[var(--color-text)]">{rec.text}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {rec.service}
                          </Badge>
                          <span className="text-xs text-[var(--color-text-dim)]">
                            {rec.count} leads affected
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
