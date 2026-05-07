"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  Layers,
  Loader2,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLeads } from "@/hooks/use-leads";
import { SearchPanel } from "@/components/maps/search-panel";
import { BusinessPin, ClusterPin } from "@/components/maps/business-pin";
import { BusinessPopup } from "@/components/maps/business-popup";
import { LeadDetailPanel } from "@/components/leads/lead-detail-panel";
import { OutreachModal } from "@/components/leads/outreach-modal";
import { LeadPriority, type Lead } from "@/types";

// ---------------------------------------------------------------------------
// Map placeholder component (renders when react-map-gl is not available)
// In production, replace with actual Mapbox GL integration.
// ---------------------------------------------------------------------------

interface MapPin2D {
  lead: Lead;
  x: number;
  y: number;
}

function projectToCanvas(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  width: number,
  height: number,
  padding = 60
): { x: number; y: number } {
  const latRange = bounds.maxLat - bounds.minLat || 1;
  const lngRange = bounds.maxLng - bounds.minLng || 1;
  const x = padding + ((lng - bounds.minLng) / lngRange) * (width - padding * 2);
  const y = padding + ((bounds.maxLat - lat) / latRange) * (height - padding * 2);
  return { x, y };
}

function clusterPins(pins: MapPin2D[], radius: number): { pins: MapPin2D[]; clusters: { x: number; y: number; count: number; leads: Lead[] }[] } {
  const used = new Set<number>();
  const clusters: { x: number; y: number; count: number; leads: Lead[] }[] = [];
  const singles: MapPin2D[] = [];

  for (let i = 0; i < pins.length; i++) {
    if (used.has(i)) continue;
    const group: MapPin2D[] = [pins[i]];
    used.add(i);
    for (let j = i + 1; j < pins.length; j++) {
      if (used.has(j)) continue;
      const dx = pins[i].x - pins[j].x;
      const dy = pins[i].y - pins[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < radius) {
        group.push(pins[j]);
        used.add(j);
      }
    }
    if (group.length >= 3) {
      const cx = group.reduce((s, p) => s + p.x, 0) / group.length;
      const cy = group.reduce((s, p) => s + p.y, 0) / group.length;
      clusters.push({ x: cx, y: cy, count: group.length, leads: group.map((g) => g.lead) });
    } else {
      singles.push(...group);
    }
  }
  return { pins: singles, clusters };
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function MapsPage() {
  const [panelCollapsed, setPanelCollapsed] = React.useState(false);
  const [drawMode, setDrawMode] = React.useState(false);
  const [heatmapOn, setHeatmapOn] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [popupLead, setPopupLead] = React.useState<Lead | null>(null);
  const [popupPos, setPopupPos] = React.useState({ x: 0, y: 0 });
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [outreachLead, setOutreachLead] = React.useState<Lead | null>(null);
  const [outreachOpen, setOutreachOpen] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const mapRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Load leads with coordinates
  const { data: leadsRes, isLoading } = useLeads({ pageSize: 500 });
  const allLeads = leadsRes?.data ?? [];

  // Filter only leads with geo data
  const geoLeads = React.useMemo(
    () => allLeads.filter((l) => l.business.latitude != null && l.business.longitude != null),
    [allLeads]
  );

  // Map dimensions
  const [mapSize, setMapSize] = React.useState({ width: 800, height: 600 });

  React.useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setMapSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    if (mapRef.current) observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute bounds
  const bounds = React.useMemo(() => {
    if (geoLeads.length === 0) {
      return { minLat: 20, maxLat: 30, minLng: 40, maxLng: 50 };
    }
    const lats = geoLeads.map((l) => l.business.latitude!);
    const lngs = geoLeads.map((l) => l.business.longitude!);
    const pad = 0.02;
    return {
      minLat: Math.min(...lats) - pad,
      maxLat: Math.max(...lats) + pad,
      minLng: Math.min(...lngs) - pad,
      maxLng: Math.max(...lngs) + pad,
    };
  }, [geoLeads]);

  // Project pins
  const projectedPins: MapPin2D[] = React.useMemo(() => {
    return geoLeads.map((lead) => {
      const { x, y } = projectToCanvas(
        lead.business.latitude!,
        lead.business.longitude!,
        bounds,
        mapSize.width,
        mapSize.height
      );
      return { lead, x, y };
    });
  }, [geoLeads, bounds, mapSize]);

  // Cluster at lower zoom
  const clusterRadius = zoom < 1.5 ? 40 : 20;
  const { pins: singlePins, clusters } = React.useMemo(
    () => clusterPins(projectedPins, clusterRadius),
    [projectedPins, clusterRadius]
  );

  const handlePinClick = (lead: Lead, x: number, y: number) => {
    setPopupLead(lead);
    setPopupPos({ x, y });
    setSelectedLead(lead);
  };

  const handleSelectFromPanel = (lead: Lead) => {
    setSelectedLead(lead);
    setPopupLead(null);
    // Scroll map to center (in real impl would fly to coords)
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  React.useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className="flex h-[calc(100vh-80px)] overflow-hidden rounded-xl border border-[var(--color-glass-border)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Left search panel */}
      <SearchPanel
        collapsed={panelCollapsed}
        onToggleCollapse={() => setPanelCollapsed((c) => !c)}
        leads={allLeads}
        onSelectLead={handleSelectFromPanel}
        selectedLeadId={selectedLead?.id}
        drawMode={drawMode}
        onToggleDrawMode={() => setDrawMode((d) => !d)}
      />

      {/* Map area */}
      <div className="relative flex-1 bg-[#0a0f1a]" ref={mapRef}>
        {/* Dark map background with grid */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Grid pattern */}
          <svg className="absolute inset-0 h-full w-full opacity-10">
            <defs>
              <pattern
                id="grid"
                width={40 * zoom}
                height={40 * zoom}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${40 * zoom} 0 L 0 0 0 ${40 * zoom}`}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Heatmap overlay */}
          <AnimatePresence>
            {heatmapOn && geoLeads.length > 0 && (
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
              >
                {projectedPins.map((pin, i) => {
                  const intensity =
                    pin.lead.priority === LeadPriority.HOT
                      ? 100
                      : pin.lead.priority === LeadPriority.WARM
                      ? 60
                      : 30;
                  return (
                    <div
                      key={`heat-${i}`}
                      className="absolute rounded-full"
                      style={{
                        left: pin.x - 40,
                        top: pin.y - 40,
                        width: 80,
                        height: 80,
                        background: `radial-gradient(circle, ${
                          pin.lead.priority === LeadPriority.HOT
                            ? "rgba(239,68,68,0.4)"
                            : pin.lead.priority === LeadPriority.WARM
                            ? "rgba(245,158,11,0.3)"
                            : "rgba(59,130,246,0.2)"
                        } 0%, transparent 70%)`,
                        filter: "blur(10px)",
                      }}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clusters */}
          {clusters.map((cluster, i) => (
            <div
              key={`cluster-${i}`}
              className="absolute"
              style={{
                left: cluster.x - 20,
                top: cluster.y - 20,
                transform: `scale(${zoom})`,
                transformOrigin: "center",
              }}
            >
              <ClusterPin
                count={cluster.count}
                onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
              />
            </div>
          ))}

          {/* Individual pins */}
          <AnimatePresence>
            {singlePins.map((pin) => (
              <div
                key={pin.lead.id}
                className="absolute"
                style={{
                  left: pin.x - 7,
                  top: pin.y - 7,
                  transform: `scale(${zoom})`,
                  transformOrigin: "center",
                }}
              >
                <BusinessPin
                  lead={pin.lead}
                  selected={selectedLead?.id === pin.lead.id}
                  onClick={() => handlePinClick(pin.lead, pin.x, pin.y)}
                />
              </div>
            ))}
          </AnimatePresence>

          {/* Popup */}
          <AnimatePresence>
            {popupLead && (
              <div
                className="absolute z-30"
                style={{
                  left: Math.min(popupPos.x, mapSize.width - 300),
                  top: Math.max(popupPos.y - 220, 10),
                }}
              >
                <BusinessPopup
                  lead={popupLead}
                  onViewDetails={() => {
                    setDetailOpen(true);
                    setPopupLead(null);
                  }}
                  onAnalyze={() => {
                    setPopupLead(null);
                  }}
                  onGenerateOutreach={() => {
                    setOutreachLead(popupLead);
                    setOutreachOpen(true);
                    setPopupLead(null);
                  }}
                  onClose={() => setPopupLead(null)}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Draw mode overlay */}
          <AnimatePresence>
            {drawMode && (
              <motion.div
                className="absolute inset-0 cursor-crosshair border-2 border-dashed border-[var(--color-primary)]/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-lg border border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl px-4 py-2">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Click and drag to draw a search area. Press ESC to cancel.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!isLoading && geoLeads.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="rounded-full bg-[var(--color-primary)]/10 p-6">
                  <MapPin className="h-10 w-10 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">
                  No businesses on the map
                </h3>
                <p className="max-w-sm text-center text-sm text-[var(--color-text-muted)]">
                  Start a search in the left panel to discover businesses and plot them on the map.
                </p>
              </motion.div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                <p className="text-sm text-[var(--color-text-muted)]">Loading map data...</p>
              </div>
            </div>
          )}
        </div>

        {/* Map controls */}
        <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
          <motion.div
            className="flex flex-col rounded-lg border border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="p-2.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="h-px bg-[var(--color-border)]" />
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-2.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
          </motion.div>

          <motion.div
            className="flex flex-col rounded-lg border border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={() => setZoom(1)}
              className="p-2.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              title="Reset view"
            >
              <Compass className="h-4 w-4" />
            </button>
            <div className="h-px bg-[var(--color-border)]" />
            <button
              onClick={handleToggleFullscreen}
              className="p-2.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </motion.div>

          <motion.div
            className="flex flex-col rounded-lg border border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => setHeatmapOn((h) => !h)}
              className={`p-2.5 transition-colors ${
                heatmapOn
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              }`}
              title="Toggle heatmap"
            >
              <Layers className="h-4 w-4" />
            </button>
          </motion.div>
        </div>

        {/* Bottom status bar */}
        <motion.div
          className="absolute bottom-4 left-4 z-20 flex items-center gap-3 rounded-lg border border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl px-4 py-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-[10px] text-[var(--color-text-muted)]">Hot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-[10px] text-[var(--color-text-muted)]">Warm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-[10px] text-[var(--color-text-muted)]">Cold</span>
          </div>
          <div className="h-3 w-px bg-[var(--color-border)]" />
          <span className="text-[10px] text-[var(--color-text-dim)]">
            {geoLeads.length} pins
          </span>
          <div className="h-3 w-px bg-[var(--color-border)]" />
          <span className="text-[10px] text-[var(--color-text-dim)]">
            Zoom: {Math.round(zoom * 100)}%
          </span>
        </motion.div>

        {/* Mapbox token notice */}
        <motion.div
          className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 px-3 py-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <AlertCircle className="h-3 w-3 text-[var(--color-warning)]" />
          <span className="text-[10px] text-[var(--color-warning)]">
            Add NEXT_PUBLIC_MAPBOX_TOKEN for full Mapbox GL map
          </span>
        </motion.div>
      </div>

      {/* Detail Panel */}
      <LeadDetailPanel
        lead={selectedLead}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* Outreach Modal */}
      <OutreachModal
        open={outreachOpen}
        onOpenChange={setOutreachOpen}
        lead={outreachLead}
      />
    </motion.div>
  );
}
