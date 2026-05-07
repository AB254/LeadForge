"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types";
import { LeadPriority } from "@/types";

interface BusinessPinProps {
  lead: Lead;
  selected?: boolean;
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
}

function getPinColor(lead: Lead): string {
  if (lead.priority === LeadPriority.HOT) return "var(--color-hot, #ef4444)";
  if (lead.priority === LeadPriority.WARM) return "var(--color-warm, #f59e0b)";
  return "var(--color-cold, #3b82f6)";
}

function getPinSize(lead: Lead): number {
  if (lead.priority === LeadPriority.HOT) return 16;
  if (lead.priority === LeadPriority.WARM) return 13;
  return 11;
}

export function BusinessPin({ lead, selected, onClick, onHover }: BusinessPinProps) {
  const color = getPinColor(lead);
  const size = getPinSize(lead);

  return (
    <motion.div
      className="relative cursor-pointer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {/* Pulse ring for hot leads */}
      {lead.priority === LeadPriority.HOT && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: size * 2.5,
            height: size * 2.5,
            left: -(size * 2.5 - size) / 2,
            top: -(size * 2.5 - size) / 2,
            background: `${color}20`,
            border: `1px solid ${color}40`,
          }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Pin dot */}
      <div
        className={cn(
          "rounded-full transition-transform",
          selected && "ring-2 ring-white ring-offset-2 ring-offset-[var(--color-background)]"
        )}
        style={{
          width: size,
          height: size,
          background: color,
          boxShadow: `0 0 8px ${color}80, 0 0 20px ${color}30`,
        }}
      />

      {/* Tooltip on hover — handled by parent popup */}
    </motion.div>
  );
}

// Cluster marker for grouped pins
interface ClusterPinProps {
  count: number;
  onClick?: () => void;
}

export function ClusterPin({ count, onClick }: ClusterPinProps) {
  const size = Math.min(48, 28 + Math.log2(count) * 6);

  return (
    <motion.div
      className="flex cursor-pointer items-center justify-center rounded-full border border-[var(--color-primary)]/50 bg-[var(--color-primary)]/20 backdrop-blur-sm"
      style={{ width: size, height: size }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.15 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <span className="text-xs font-bold text-[var(--color-primary)]">
        {count}
      </span>
    </motion.div>
  );
}
