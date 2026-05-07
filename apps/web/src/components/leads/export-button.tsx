"use client";

import * as React from "react";
import { Download, FileSpreadsheet, FileJson, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportCSV, exportXLSX, exportJSON } from "@/lib/api";
import type { LeadFilters } from "@/types";

interface ExportButtonProps {
  filters?: LeadFilters;
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [loading, setLoading] = React.useState<string | null>(null);

  const download = async (format: "csv" | "xlsx" | "json") => {
    setLoading(format);
    try {
      let blob: Blob;
      let filename: string;
      const ts = new Date().toISOString().slice(0, 10);

      switch (format) {
        case "csv":
          blob = await exportCSV(filters);
          filename = `leads-${ts}.csv`;
          break;
        case "xlsx":
          blob = await exportXLSX(filters);
          filename = `leads-${ts}.xlsx`;
          break;
        case "json":
          blob = await exportJSON(filters);
          filename = `leads-${ts}.json`;
          break;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Export ${format} failed`, err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={!!loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => download("csv")}>
          <FileText className="mr-2 h-4 w-4" />
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => download("xlsx")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export XLSX
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => download("json")}>
          <FileJson className="mr-2 h-4 w-4" />
          Export JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
