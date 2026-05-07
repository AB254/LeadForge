"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Star, Eye, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { Badge } from "@/components/ui/badge";
import { LeadPriority, type Lead } from "@/types";

interface BusinessPopupProps {
  lead: Lead;
  onViewDetails?: () => void;
  onAnalyze?: () => void;
  onGenerateOutreach?: () => void;
  onClose?: () => void;
}

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

export function BusinessPopup({
  lead,
  onViewDetails,
  onAnalyze,
  onGenerateOutreach,
  onClose,
}: BusinessPopupProps) {
  return (
    <motion.div
      className="w-72 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl shadow-2xl overflow-hidden"
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="border-b border-[var(--color-border)] p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-[var(--color-text)]">
              {lead.business.name}
            </h3>
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              {lead.business.category ?? "Business"}
            </p>
          </div>
          <Badge variant={priorityVariant(lead.priority)} className="shrink-0">
            {lead.priority}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          {/* Score */}
          <ScoreRing
            score={lead.score ?? 0}
            size={52}
            strokeWidth={4}
          />

          {/* Rating + Reviews */}
          <div className="space-y-1.5">
            {lead.business.rating != null && (
              <div className="flex items-center gap-1.5">
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
                <span className="text-xs font-medium text-[var(--color-text)]">
                  {lead.business.rating}
                </span>
              </div>
            )}
            {lead.business.reviewCount != null && (
              <p className="text-xs text-[var(--color-text-muted)]">
                {lead.business.reviewCount} reviews
              </p>
            )}
            {lead.business.city && (
              <p className="text-xs text-[var(--color-text-dim)]">
                {lead.business.city}
                {lead.business.state && `, ${lead.business.state}`}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 text-xs"
            onClick={onViewDetails}
          >
            <Eye className="mr-1 h-3 w-3" />
            Details
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 text-xs"
            onClick={onAnalyze}
          >
            <Sparkles className="mr-1 h-3 w-3" />
            Analyze
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={onGenerateOutreach}
          >
            <Send className="mr-1 h-3 w-3" />
            Outreach
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
