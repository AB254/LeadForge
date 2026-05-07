"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Globe,
  Phone,
  Star,
  MoreHorizontal,
  Eye,
  Pencil,
  Sparkles,
  Send,
  Trash2,
  XCircle,
  ListChecks,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { ScoreRing } from "@/components/ui/score-ring";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useLeads, useLeadStats, useDeleteLead } from "@/hooks/use-leads";
import { useAppStore } from "@/stores/app.store";
import { batchAnalyze } from "@/lib/api";
import { ExportButton } from "@/components/leads/export-button";
import { LeadDetailPanel } from "@/components/leads/lead-detail-panel";
import { OutreachModal } from "@/components/leads/outreach-modal";
import {
  LeadPriority,
  LeadStatus,
  type Lead,
  type LeadFilters,
} from "@/types";

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// ---------------------------------------------------------------------------
// Priority / status color helpers
// ---------------------------------------------------------------------------
function priorityVariant(p: LeadPriority) {
  switch (p) {
    case LeadPriority.HOT:
      return "hot" as const;
    case LeadPriority.WARM:
      return "warm" as const;
    case LeadPriority.COLD:
      return "cold" as const;
    default:
      return "outline" as const;
  }
}

function statusBadge(s: LeadStatus) {
  switch (s) {
    case LeadStatus.WON:
      return "success" as const;
    case LeadStatus.LOST:
    case LeadStatus.ARCHIVED:
      return "outline" as const;
    default:
      return "default" as const;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LeadsPage() {
  // Filters
  const [search, setSearch] = React.useState("");
  const [priority, setPriority] = React.useState<string>("ALL");
  const [status, setStatus] = React.useState<string>("ALL");
  const [hasWebsite, setHasWebsite] = React.useState<string>("ALL");
  const [minScore, setMinScore] = React.useState("");
  const [maxScore, setMaxScore] = React.useState("");
  const [city, setCity] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  // Detail panel
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);

  // Outreach modal (from row action)
  const [outreachLead, setOutreachLead] = React.useState<Lead | null>(null);
  const [outreachOpen, setOutreachOpen] = React.useState(false);

  // Selection
  const { selectedLeads, toggleLeadSelection, selectAllLeads, clearSelection } =
    useAppStore();

  const deleteLead = useDeleteLead();

  // Build filters
  const filters: LeadFilters = React.useMemo(() => {
    const f: LeadFilters = { page, pageSize };
    if (search) f.search = search;
    if (priority !== "ALL") f.priority = priority as LeadPriority;
    if (status !== "ALL") f.status = status as LeadStatus;
    if (minScore) f.minScore = Number(minScore);
    if (maxScore) f.maxScore = Number(maxScore);
    if (city) f.city = city;
    if (category) f.niche = category;
    return f;
  }, [search, priority, status, minScore, maxScore, city, category, page]);

  const { data: leadsRes, isLoading } = useLeads(filters);
  const { data: statsRes } = useLeadStats();

  const leads = leadsRes?.data ?? [];
  const totalLeads = leadsRes?.total ?? 0;
  const totalPages = leadsRes?.totalPages ?? 1;
  const stats = statsRes?.data;

  // Filter leads by website presence client-side (simple filter)
  const filteredLeads = React.useMemo(() => {
    if (hasWebsite === "ALL") return leads;
    if (hasWebsite === "YES") return leads.filter((l) => l.business.website);
    return leads.filter((l) => !l.business.website);
  }, [leads, hasWebsite]);

  const clearFilters = () => {
    setSearch("");
    setPriority("ALL");
    setStatus("ALL");
    setHasWebsite("ALL");
    setMinScore("");
    setMaxScore("");
    setCity("");
    setCategory("");
    setPage(1);
  };

  const hasActiveFilters =
    search ||
    priority !== "ALL" ||
    status !== "ALL" ||
    hasWebsite !== "ALL" ||
    minScore ||
    maxScore ||
    city ||
    category;

  // Bulk actions
  const handleBulkDelete = () => {
    selectedLeads.forEach((id) => deleteLead.mutate(id));
    clearSelection();
  };

  const handleBulkAnalyze = async () => {
    if (selectedLeads.length === 0) return;
    await batchAnalyze(selectedLeads);
    clearSelection();
  };

  // Table columns
  const columns: Column<Record<string, unknown>>[] = React.useMemo(
    () => [
      {
        key: "business",
        header: "Business",
        sortable: true,
        render: (_val, row) => {
          const lead = row as unknown as Lead;
          return (
            <div className="min-w-[180px]">
              <p className="font-semibold text-[var(--color-text)]">
                {lead.business.name}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {lead.business.category ?? "Uncategorized"}
              </p>
            </div>
          );
        },
      },
      {
        key: "city",
        header: "City",
        sortable: true,
        render: (_val, row) => {
          const lead = row as unknown as Lead;
          return (
            <span className="text-sm text-[var(--color-text-muted)]">
              {lead.business.city ?? "-"}
            </span>
          );
        },
      },
      {
        key: "score",
        header: "Score",
        sortable: true,
        width: "90px",
        render: (_val, row) => {
          const lead = row as unknown as Lead;
          return lead.score != null ? (
            <ScoreRing score={lead.score} size={38} strokeWidth={3} />
          ) : (
            <span className="text-xs text-[var(--color-text-dim)]">-</span>
          );
        },
      },
      {
        key: "priority",
        header: "Priority",
        sortable: true,
        width: "100px",
        render: (_val, row) => {
          const lead = row as unknown as Lead;
          return (
            <Badge variant={priorityVariant(lead.priority)}>
              {lead.priority}
            </Badge>
          );
        },
      },
      {
        key: "website",
        header: "Website",
        width: "80px",
        render: (_val, row) => {
          const lead = row as unknown as Lead;
          return lead.business.website ? (
            <a
              href={lead.business.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-primary)] hover:brightness-125"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="h-4 w-4" />
            </a>
          ) : (
            <span className="text-xs text-[var(--color-text-dim)]">None</span>
          );
        },
      },
      {
        key: "phone",
        header: "Phone",
        width: "80px",
        render: (_val, row) => {
          const lead = row as unknown as Lead;
          return lead.business.phone ? (
            <a
              href={`tel:${lead.business.phone}`}
              className="text-[var(--color-primary)] hover:brightness-125"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-4 w-4" />
            </a>
          ) : (
            <span className="text-xs text-[var(--color-text-dim)]">-</span>
          );
        },
      },
      {
        key: "rating",
        header: "Rating",
        sortable: true,
        width: "120px",
        render: (_val, row) => {
          const lead = row as unknown as Lead;
          if (lead.business.rating == null) {
            return <span className="text-xs text-[var(--color-text-dim)]">-</span>;
          }
          return (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.round(lead.business.rating ?? 0)
                        ? "fill-amber-400 text-amber-400"
                        : "text-[var(--color-text-dim)]"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">
                {lead.business.rating}
              </span>
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        width: "110px",
        render: (_val, row) => {
          const lead = row as unknown as Lead;
          return (
            <Badge variant={statusBadge(lead.status)}>
              {lead.status.charAt(0) + lead.status.slice(1).toLowerCase()}
            </Badge>
          );
        },
      },
      {
        key: "actions",
        header: "",
        width: "50px",
        render: (_val, row) => {
          const lead = row as unknown as Lead;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-md p-1.5 text-[var(--color-text-dim)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLead(lead);
                    setPanelOpen(true);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" /> View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLead(lead);
                    setPanelOpen(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    // Would trigger analysis
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" /> Analyze
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setOutreachLead(lead);
                    setOutreachOpen(true);
                  }}
                >
                  <Send className="mr-2 h-4 w-4" /> Generate Outreach
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLead.mutate(lead.id);
                  }}
                  className="text-[var(--color-danger)] focus:text-[var(--color-danger)]"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  // Flatten leads for DataTable (it expects Record<string, unknown>)
  const tableData = filteredLeads as unknown as Record<string, unknown>[];

  // Selection state mapped to DataTable's Set<number>
  const selectedSet = React.useMemo(() => {
    const set = new Set<number>();
    filteredLeads.forEach((l, i) => {
      if (selectedLeads.includes(l.id)) set.add(i);
    });
    return set;
  }, [filteredLeads, selectedLeads]);

  const handleSelectionChange = (next: Set<number>) => {
    const ids = filteredLeads
      .filter((_, i) => next.has(i))
      .map((l) => l.id);
    selectAllLeads(ids);
  };

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setPanelOpen(true);
  };

  return (
    <motion.div
      className="space-y-6"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="flex items-center gap-3" variants={fadeUp}>
        <Users className="h-6 w-6 text-[var(--color-primary)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Leads</h1>
        <Badge variant="default" className="text-xs">
          {isLoading ? "..." : totalLeads}
        </Badge>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        className="space-y-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl p-4"
        variants={fadeUp}
      >
        {/* Row 1: Search + Primary Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search business name..."
            className="w-64"
          />

          <Select value={priority} onValueChange={(v) => { setPriority(v); setPage(1); }}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priority</SelectItem>
              <SelectItem value={LeadPriority.HOT}>Hot</SelectItem>
              <SelectItem value={LeadPriority.WARM}>Warm</SelectItem>
              <SelectItem value={LeadPriority.COLD}>Cold</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value={LeadStatus.NEW}>New</SelectItem>
              <SelectItem value={LeadStatus.CONTACTED}>Contacted</SelectItem>
              <SelectItem value={LeadStatus.QUALIFIED}>Qualified</SelectItem>
              <SelectItem value={LeadStatus.PROPOSAL}>Proposal</SelectItem>
              <SelectItem value={LeadStatus.NEGOTIATION}>Negotiation</SelectItem>
              <SelectItem value={LeadStatus.WON}>Won</SelectItem>
              <SelectItem value={LeadStatus.LOST}>Lost</SelectItem>
              <SelectItem value={LeadStatus.ARCHIVED}>Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={hasWebsite} onValueChange={(v) => { setHasWebsite(v); setPage(1); }}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Has Website" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="YES">Has Website</SelectItem>
              <SelectItem value="NO">No Website</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Row 2: Extra Filters + Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-dim)]">Score:</span>
            <input
              type="number"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => { setMinScore(e.target.value); setPage(1); }}
              placeholder="Min"
              className="h-9 w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
            />
            <span className="text-xs text-[var(--color-text-dim)]">-</span>
            <input
              type="number"
              min={0}
              max={100}
              value={maxScore}
              onChange={(e) => { setMaxScore(e.target.value); setPage(1); }}
              placeholder="Max"
              className="h-9 w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
            />
          </div>

          <input
            type="text"
            value={city}
            onChange={(e) => { setCity(e.target.value); setPage(1); }}
            placeholder="City"
            className="h-9 w-32 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
          />

          <input
            type="text"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            placeholder="Category"
            className="h-9 w-32 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
          />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            {selectedLeads.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <ListChecks className="mr-1.5 h-4 w-4" />
                    Bulk ({selectedLeads.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleBulkAnalyze}>
                    <Sparkles className="mr-2 h-4 w-4" /> Batch Analyze
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleBulkDelete}
                    className="text-[var(--color-danger)] focus:text-[var(--color-danger)]"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <ExportButton filters={filters} />
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp}>
        {isLoading ? (
          <DataTable
            columns={columns}
            data={[]}
            loading
            loadingRows={8}
            selectable
            pageSize={pageSize}
          />
        ) : filteredLeads.length === 0 ? (
          <DataTable
            columns={columns}
            data={[]}
            selectable
            emptyMessage="No leads match your filters"
            emptyIcon={<Filter className="h-10 w-10" />}
            pageSize={pageSize}
          />
        ) : (
          <div>
            {/* Clickable wrapper for rows */}
            <div
              onClick={(e) => {
                // Find the clicked row
                const target = e.target as HTMLElement;
                const tr = target.closest("tbody tr");
                if (!tr) return;
                // Skip if clicking checkbox, link, or dropdown
                if (
                  target.closest("input[type=checkbox]") ||
                  target.closest("a") ||
                  target.closest("[role=menu]") ||
                  target.closest("[data-radix-collection-item]") ||
                  target.closest("button")
                )
                  return;
                const rows = tr.parentElement?.querySelectorAll("tr");
                if (!rows) return;
                const idx = Array.from(rows).indexOf(tr as HTMLTableRowElement);
                if (idx >= 0 && idx < filteredLeads.length) {
                  handleRowClick(filteredLeads[idx]);
                }
              }}
              className="cursor-pointer"
            >
              <DataTable
                columns={columns}
                data={tableData}
                selectable
                selectedRows={selectedSet}
                onSelectionChange={handleSelectionChange}
                pageSize={pageSize}
              />
            </div>

            {/* Custom pagination for server-side paging */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-[var(--color-text-dim)]">
                  Page {page} of {totalPages} ({totalLeads} total leads)
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="min-w-[36px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 7 && (
                    <span className="px-2 text-xs text-[var(--color-text-dim)]">...</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Detail Panel */}
      <LeadDetailPanel
        lead={selectedLead}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />

      {/* Outreach Modal from row actions */}
      <OutreachModal
        open={outreachOpen}
        onOpenChange={setOutreachOpen}
        lead={outreachLead}
      />
    </motion.div>
  );
}
