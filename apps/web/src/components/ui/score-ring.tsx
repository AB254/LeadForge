"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ScoreRingProps extends React.HTMLAttributes<HTMLDivElement> {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

function ScoreRing({
  score,
  size = 80,
  strokeWidth = 6,
  label,
  className,
  ...props
}: ScoreRingProps) {
  const clampedScore = Math.min(Math.max(score, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;

  const getColor = (s: number): string => {
    if (s < 40) return "var(--color-danger)";
    if (s < 70) return "var(--color-warning)";
    return "var(--color-success)";
  };

  const color = getColor(clampedScore);

  return (
    <div className={cn("inline-flex flex-col items-center gap-1", className)} {...props}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-surface)"
            strokeWidth={strokeWidth}
          />
          {/* Animated score ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
          />
        </svg>
        {/* Center number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-lg font-bold text-[var(--color-text)]"
            style={{ fontSize: size * 0.22 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {clampedScore}
          </motion.span>
        </div>
      </div>
      {label && (
        <span className="text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
      )}
    </div>
  );
}

export { ScoreRing };
