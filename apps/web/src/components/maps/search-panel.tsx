"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  ChevronDown,
  ChevronRight,
  Loader2,
  Play,
  Square,
  Star,
  PanelLeftClose,
  PanelLeftOpen,
  Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateScrapingJob, useScrapingJobs, useCancelScrapingJob } from "@/hooks/use-scraper";
import { LeadPriority, ScrapingJobStatus, type Lead, type ScrapingJob } from "@/types";

interface SearchPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  selectedLeadId?: string | null;
  drawMode?: boolean;
  onToggleDrawMode?: () => void;
}

const COUNTRIES = [
  { value: "SA", label: "Saudi Arabia" },
  { value: "AE", label: "UAE" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IN", label: "India" },
  { value: "AU", label: "Australia" },
];

function CollapsibleSection({
  title,
  defaultOpen = true,
  count,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b border-[var(--color-border)] last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
      >
        <span className="flex items-center gap-2">
          {title}
          {count != null && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {count}
            </Badge>
          )}
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function priorityColor(p: LeadPriority) {
  switch (p) {
    case LeadPriority.HOT:
      return "bg-red-500";
    case LeadPriority.WARM:
      return "bg-amber-500";
    default:
      return "bg-blue-500";
  }
}

export function SearchPanel({
  collapsed,
  onToggleCollapse,
  leads,
  onSelectLead,
  selectedLeadId,
  drawMode,
  onToggleDrawMode,
}: SearchPanelProps) {
  // Search form state
  const [query, setQuery] = React.useState("");
  const [cityInput, setCityInput] = React.useState("");
  const [country, setCountry] = React.useState("SA");
  const [radius, setRadius] = React.useState(10);

  const createJob = useCreateScrapingJob();
  const { data: jobsRes } = useScrapingJobs({ pageSize: 10 });
  const cancelJob = useCancelScrapingJob();

  const jobs = jobsRes?.data ?? [];
  const activeJobs = jobs.filter(
    (j) => j.status === ScrapingJobStatus.RUNNING || j.status === ScrapingJobStatus.PENDING
  );

  const handleSearch = () => {
    if (!query.trim()) return;
    createJob.mutate({
      source: "google_maps",
      query: query.trim(),
      location: `${cityInput.trim()}, ${country}`,
      radius,
      maxResults: 100,
    });
  };

  const jobProgress = (job: ScrapingJob) => {
    if (!job.totalFound || job.totalFound === 0) return 0;
    return Math.round(((job.totalScraped ?? 0) / job.totalFound) * 100);
  };

  if (collapsed) {
    return (
      <motion.div
        className="flex flex-col items-center border-r border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl py-4 px-2 gap-4"
        initial={{ width: 0 }}
        animate={{ width: 48 }}
      >
        <button
          onClick={onToggleCollapse}
          className="rounded-md p-1.5 text-[var(--color-text-dim)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
        <div className="flex flex-col gap-2">
          <div className="h-6 w-6 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
            <Search className="h-3 w-3 text-[var(--color-primary)]" />
          </div>
          {activeJobs.length > 0 && (
            <div className="h-6 w-6 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-[var(--color-success)]">
                {activeJobs.length}
              </span>
            </div>
          )}
          <div className="h-6 w-6 rounded-full bg-[var(--color-text-dim)]/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-[var(--color-text-dim)]">
              {leads.length}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.aside
      className="flex h-full flex-col border-r border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl"
      initial={{ width: 0 }}
      animate={{ width: 350 }}
      transition={{ duration: 0.25 }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[var(--color-primary)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Map Explorer
          </h2>
        </div>
        <button
          onClick={onToggleCollapse}
          className="rounded-md p-1.5 text-[var(--color-text-dim)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* New Search */}
        <CollapsibleSection title="New Search" defaultOpen>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                Niche / Query
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. restaurants, hotels..."
                className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                City
              </label>
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="e.g. Riyadh, Dubai..."
                className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                Country
              </label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs text-[var(--color-text-muted)]">
                  Radius
                </label>
                <span className="text-xs font-medium text-[var(--color-text)]">
                  {radius} km
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-text-dim)]">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleSearch}
              disabled={!query.trim() || createJob.isPending}
            >
              {createJob.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search on Map
            </Button>

            <div className="relative flex items-center justify-center gap-2">
              <div className="h-px flex-1 bg-[var(--color-border)]" />
              <span className="text-[10px] text-[var(--color-text-dim)]">OR</span>
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            <Button
              variant={drawMode ? "default" : "outline"}
              className="w-full"
              onClick={onToggleDrawMode}
            >
              <Crosshair className="mr-2 h-4 w-4" />
              {drawMode ? "Drawing Mode Active" : "Draw Custom Area"}
            </Button>
          </div>
        </CollapsibleSection>

        {/* Active Jobs */}
        <CollapsibleSection
          title="Active Jobs"
          defaultOpen={activeJobs.length > 0}
          count={activeJobs.length}
        >
          {activeJobs.length === 0 ? (
            <p className="text-xs text-[var(--color-text-dim)]">
              No active jobs. Start a search above.
            </p>
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <div
                  key={job.id}
                  className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-[var(--color-text)]">
                        {job.query}
                      </p>
                      <p className="truncate text-[10px] text-[var(--color-text-dim)]">
                        {job.location}
                      </p>
                    </div>
                    <button
                      onClick={() => cancelJob.mutate(job.id)}
                      className="shrink-0 rounded p-1 text-[var(--color-text-dim)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-danger)]"
                    >
                      <Square className="h-3 w-3" />
                    </button>
                  </div>
                  <Progress value={jobProgress(job)} className="h-1.5" />
                  <div className="flex items-center justify-between text-[10px] text-[var(--color-text-dim)]">
                    <span>
                      {job.totalScraped ?? 0} / {job.totalFound ?? "?"} found
                    </span>
                    <span className="flex items-center gap-1">
                      {job.status === ScrapingJobStatus.RUNNING && (
                        <Play className="h-2.5 w-2.5 text-[var(--color-success)]" />
                      )}
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* Results */}
        <CollapsibleSection title="Results" defaultOpen count={leads.length}>
          {leads.length === 0 ? (
            <p className="text-xs text-[var(--color-text-dim)]">
              No results yet. Run a search to populate the map.
            </p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {leads.map((lead) => (
                <motion.button
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    selectedLeadId === lead.id
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-start gap-3">
                    {/* Score dot */}
                    <div
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${priorityColor(lead.priority)}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[var(--color-text)]">
                        {lead.business.name}
                      </p>
                      <p className="truncate text-[10px] text-[var(--color-text-muted)]">
                        {lead.business.category ?? "Business"}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        {lead.business.rating != null && (
                          <div className="flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                            <span className="text-[10px] text-[var(--color-text-muted)]">
                              {lead.business.rating}
                            </span>
                          </div>
                        )}
                        {lead.score != null && (
                          <Badge
                            variant={
                              lead.score >= 70
                                ? "success"
                                : lead.score >= 40
                                ? "warm"
                                : "cold"
                            }
                            className="text-[10px] px-1.5 py-0"
                          >
                            {lead.score}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </CollapsibleSection>
      </div>
    </motion.aside>
  );
}
