"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/25",
        hot:
          "bg-[var(--color-hot)]/15 text-[var(--color-hot)] border border-[var(--color-hot)]/25",
        warm:
          "bg-[var(--color-warm)]/15 text-[var(--color-warm)] border border-[var(--color-warm)]/25",
        cold:
          "bg-[var(--color-cold)]/15 text-[var(--color-cold)] border border-[var(--color-cold)]/25",
        success:
          "bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/25",
        outline:
          "border border-[var(--color-border)] text-[var(--color-text-muted)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
