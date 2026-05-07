"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Plus, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/search-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/map": "Map Explorer",
  "/dashboard/leads": "Leads",
  "/dashboard/analytics": "Analytics",
  "/dashboard/insights": "AI Insights",
  "/dashboard/settings": "Settings",
};

export interface HeaderProps {
  onSearch?: (query: string) => void;
  onNewScrapingJob?: () => void;
  onExportLeads?: () => void;
  className?: string;
}

function Header({ onSearch, onNewScrapingJob, onExportLeads, className }: HeaderProps) {
  const pathname = usePathname();

  const breadcrumbs = React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href: string }[] = [];
    let path = "";
    for (const seg of segments) {
      path += `/${seg}`;
      const label = breadcrumbMap[path] || seg.charAt(0).toUpperCase() + seg.slice(1);
      crumbs.push({ label, href: path });
    }
    return crumbs;
  }, [pathname]);

  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between gap-4 border-b border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl px-6",
        className
      )}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.href}>
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-dim)]" />}
            <span
              className={cn(
                i === breadcrumbs.length - 1
                  ? "font-medium text-[var(--color-text)]"
                  : "text-[var(--color-text-muted)]"
              )}
            >
              {crumb.label}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Right section */}
      <div className="flex items-center gap-3">
        <SearchInput
          placeholder="Search leads, companies..."
          onChange={onSearch}
          className="w-64"
        />

        {/* Notification bell */}
        <button className="relative rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--color-danger)]" />
        </button>

        {/* Quick actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-primary)]/25 transition-all hover:shadow-[var(--color-primary)]/40 hover:brightness-110">
              <Plus className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onNewScrapingJob}>
              <Plus className="mr-2 h-4 w-4" />
              New Scraping Job
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportLeads}>
              <Download className="mr-2 h-4 w-4" />
              Export Leads
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export { Header };
