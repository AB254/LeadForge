"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  Mail,
  Globe,
  MapPin,
  Star,
  ExternalLink,
  Trash2,
  Send,
  Map,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateLead, useDeleteLead } from "@/hooks/use-leads";
import { OutreachModal } from "./outreach-modal";
import { LeadStatus, type Lead } from "@/types";

interface LeadDetailPanelProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onViewOnMap?: (lead: Lead) => void;
}

const STATUS_OPTIONS = Object.values(LeadStatus);

const NEEDS_FLAGS = [
  "Needs Redesign",
  "Needs SEO",
  "Needs Mobile Optimization",
  "Needs SSL",
  "Needs Analytics",
  "Needs Booking System",
  "Needs E-commerce",
] as const;

export function LeadDetailPanel({
  lead,
  open,
  onClose,
  onViewOnMap,
}: LeadDetailPanelProps) {
  const [notes, setNotes] = React.useState("");
  const [outreachOpen, setOutreachOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  // Sync notes when lead changes
  React.useEffect(() => {
    setNotes(lead?.notes ?? "");
    setConfirmDelete(false);
  }, [lead?.id]);

  const handleStatusChange = (status: string) => {
    if (!lead) return;
    updateLead.mutate({ id: lead.id, data: { status: status as LeadStatus } });
  };

  const handleNotesBlur = () => {
    if (!lead || notes === (lead.notes ?? "")) return;
    updateLead.mutate({ id: lead.id, data: { notes } });
  };

  const handleDelete = () => {
    if (!lead) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteLead.mutate(lead.id, {
      onSuccess: () => onClose(),
    });
  };

  // Derive pain points as need flags
  const painPoints = lead?.painPoints ?? [];
  const opportunities = lead?.opportunities ?? [];
  const scoreFactors = lead?.scoreFactors ?? [];

  return (
    <>
      <AnimatePresence>
        {open && lead && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Panel */}
            <motion.aside
              className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[var(--color-border)] bg-[var(--color-glass)]/80 backdrop-blur-xl p-6">
                <div className="space-y-1 pr-8">
                  <h2 className="text-xl font-bold text-[var(--color-text)]">
                    {lead.business.name}
                  </h2>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {lead.business.category}
                    {lead.business.city && ` • ${lead.business.city}`}
                    {lead.business.state && `, ${lead.business.state}`}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-md p-1.5 text-[var(--color-text-dim)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 p-6">
                {/* Contact Info */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
                    Contact Information
                  </h3>
                  <div className="space-y-2">
                    {lead.business.phone && (
                      <a
                        href={`tel:${lead.business.phone}`}
                        className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
                      >
                        <Phone className="h-4 w-4 text-[var(--color-primary)]" />
                        {lead.business.phone}
                      </a>
                    )}
                    {lead.business.email && (
                      <a
                        href={`mailto:${lead.business.email}`}
                        className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
                      >
                        <Mail className="h-4 w-4 text-[var(--color-primary)]" />
                        {lead.business.email}
                      </a>
                    )}
                    {lead.business.website && (
                      <a
                        href={lead.business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
                      >
                        <Globe className="h-4 w-4 text-[var(--color-primary)]" />
                        <span className="truncate">{lead.business.website}</span>
                        <ExternalLink className="ml-auto h-3 w-3 text-[var(--color-text-dim)]" />
                      </a>
                    )}
                    {lead.business.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${lead.business.address}, ${lead.business.city ?? ""}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
                      >
                        <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
                        <span className="truncate">
                          {lead.business.address}
                          {lead.business.city && `, ${lead.business.city}`}
                        </span>
                        <ExternalLink className="ml-auto h-3 w-3 text-[var(--color-text-dim)]" />
                      </a>
                    )}
                    {!lead.business.phone &&
                      !lead.business.email &&
                      !lead.business.website &&
                      !lead.business.address && (
                        <p className="py-2 text-sm text-[var(--color-text-dim)]">
                          No contact information available
                        </p>
                      )}
                  </div>
                </section>

                {/* Score Section */}
                <section className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
                    Lead Score
                  </h3>
                  <div className="flex items-center gap-6">
                    <ScoreRing
                      score={lead.score ?? 0}
                      size={90}
                      strokeWidth={7}
                      label="Overall"
                    />
                    <div className="flex flex-wrap gap-4">
                      {scoreFactors.length > 0 ? (
                        scoreFactors.slice(0, 5).map((factor, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />
                            <span className="text-xs text-[var(--color-text-muted)]">
                              {factor}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[var(--color-text-dim)]">
                          Score factors will appear after analysis
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Rating */}
                {lead.business.rating != null && (
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
                      Google Rating
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(lead.business.rating ?? 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-[var(--color-text-dim)]"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-[var(--color-text)]">
                        {lead.business.rating}
                      </span>
                      {lead.business.reviewCount != null && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          ({lead.business.reviewCount} reviews)
                        </span>
                      )}
                    </div>
                  </section>
                )}

                {/* Pain Points */}
                {painPoints.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
                      AI Pain Points
                    </h3>
                    <ul className="space-y-2">
                      {painPoints.map((point, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"
                        >
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-warning)]" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Opportunities / Recommendations */}
                {opportunities.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
                      AI Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {opportunities.map((opp, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"
                        >
                          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
                          {opp}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Needs Flags */}
                {painPoints.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
                      Needs Flags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {NEEDS_FLAGS.filter((flag) =>
                        painPoints.some((p) =>
                          p.toLowerCase().includes(flag.replace("Needs ", "").toLowerCase())
                        )
                      ).map((flag) => (
                        <Badge key={flag} variant="warm">
                          {flag}
                        </Badge>
                      ))}
                      {NEEDS_FLAGS.filter((flag) =>
                        painPoints.some((p) =>
                          p.toLowerCase().includes(flag.replace("Needs ", "").toLowerCase())
                        )
                      ).length === 0 && (
                        <p className="text-xs text-[var(--color-text-dim)]">
                          No specific needs detected yet
                        </p>
                      )}
                    </div>
                  </section>
                )}

                {/* Status Selector */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
                    Status
                  </h3>
                  <Select
                    value={lead.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </section>

                {/* Notes */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
                    Notes
                  </h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    placeholder="Add notes about this lead..."
                    rows={4}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] resize-none"
                  />
                  <p className="text-xs text-[var(--color-text-dim)]">
                    Auto-saves when you click away
                  </p>
                </section>

                {/* Actions */}
                <section className="space-y-3 border-t border-[var(--color-border)] pt-6">
                  <Button
                    className="w-full"
                    onClick={() => setOutreachOpen(true)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Generate Outreach
                  </Button>

                  {onViewOnMap && (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => onViewOnMap(lead)}
                    >
                      <Map className="mr-2 h-4 w-4" />
                      View on Map
                    </Button>
                  )}

                  <Button
                    variant={confirmDelete ? "danger" : "outline"}
                    className="w-full"
                    onClick={handleDelete}
                    disabled={deleteLead.isPending}
                  >
                    {deleteLead.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    {confirmDelete ? "Click Again to Confirm Delete" : "Delete Lead"}
                  </Button>
                </section>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <OutreachModal
        open={outreachOpen}
        onOpenChange={setOutreachOpen}
        lead={lead}
      />
    </>
  );
}
