import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface ScrapeSettings {
  delay: number;
  maxConcurrency: number;
  proxy: string | null;
}

interface AppState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Lead selection
  selectedLeads: string[];
  selectLead: (id: string) => void;
  deselectLead: (id: string) => void;
  toggleLeadSelection: (id: string) => void;
  selectAllLeads: (ids: string[]) => void;
  clearSelection: () => void;

  // Map
  mapBounds: MapBounds | null;
  setMapBounds: (bounds: MapBounds | null) => void;

  // Scrape settings
  scrapeSettings: ScrapeSettings;
  updateScrapeSettings: (settings: Partial<ScrapeSettings>) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Lead selection
      selectedLeads: [],
      selectLead: (id) =>
        set((state) => ({
          selectedLeads: state.selectedLeads.includes(id)
            ? state.selectedLeads
            : [...state.selectedLeads, id],
        })),
      deselectLead: (id) =>
        set((state) => ({
          selectedLeads: state.selectedLeads.filter((lid) => lid !== id),
        })),
      toggleLeadSelection: (id) =>
        set((state) => ({
          selectedLeads: state.selectedLeads.includes(id)
            ? state.selectedLeads.filter((lid) => lid !== id)
            : [...state.selectedLeads, id],
        })),
      selectAllLeads: (ids) => set({ selectedLeads: ids }),
      clearSelection: () => set({ selectedLeads: [] }),

      // Map
      mapBounds: null,
      setMapBounds: (bounds) => set({ mapBounds: bounds }),

      // Scrape settings
      scrapeSettings: {
        delay: 2000,
        maxConcurrency: 3,
        proxy: null,
      },
      updateScrapeSettings: (settings) =>
        set((state) => ({
          scrapeSettings: { ...state.scrapeSettings, ...settings },
        })),
    }),
    { name: "leadforge-app-store" },
  ),
);
