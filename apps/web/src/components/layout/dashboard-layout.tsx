"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
  onNewScrapingJob?: () => void;
  onExportLeads?: () => void;
  className?: string;
}

function DashboardLayout({
  children,
  onSearch,
  onNewScrapingJob,
  onExportLeads,
  className,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onSearch={onSearch}
          onNewScrapingJob={onNewScrapingJob}
          onExportLeads={onExportLeads}
        />

        {/* Content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto p-6",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export { DashboardLayout };
