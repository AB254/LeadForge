// ---------------------------------------------------------------------------
// LeadForge Shared Constants, Types & Utilities
// ---------------------------------------------------------------------------

// ---- Lead priorities -------------------------------------------------------

export const LEAD_PRIORITIES = {
  critical: { label: "Critical", color: "#ef4444" },
  high: { label: "High", color: "#f97316" },
  medium: { label: "Medium", color: "#eab308" },
  low: { label: "Low", color: "#22c55e" },
  none: { label: "None", color: "#94a3b8" },
} as const;

export type LeadPriority = keyof typeof LEAD_PRIORITIES;

// ---- Lead statuses ---------------------------------------------------------

export const LEAD_STATUSES = {
  new: { label: "New", color: "#3b82f6" },
  scraped: { label: "Scraped", color: "#8b5cf6" },
  analyzing: { label: "Analyzing", color: "#f59e0b" },
  scored: { label: "Scored", color: "#10b981" },
  contacted: { label: "Contacted", color: "#6366f1" },
  responded: { label: "Responded", color: "#14b8a6" },
  qualified: { label: "Qualified", color: "#22c55e" },
  converted: { label: "Converted", color: "#059669" },
  lost: { label: "Lost", color: "#ef4444" },
  archived: { label: "Archived", color: "#94a3b8" },
} as const;

export type LeadStatus = keyof typeof LEAD_STATUSES;

// ---- Outreach types --------------------------------------------------------

export const OUTREACH_TYPES = {
  email: { label: "Email", icon: "Mail" },
  linkedin: { label: "LinkedIn", icon: "Linkedin" },
  phone: { label: "Phone Call", icon: "Phone" },
  whatsapp: { label: "WhatsApp", icon: "MessageCircle" },
  instagram: { label: "Instagram DM", icon: "Instagram" },
  custom: { label: "Custom", icon: "Pen" },
} as const;

export type OutreachType = keyof typeof OUTREACH_TYPES;

// ---- Service needs ---------------------------------------------------------

export const SERVICE_NEEDS = {
  redesign: { label: "Website Redesign" },
  seo: { label: "SEO Optimization" },
  branding: { label: "Branding & Identity" },
  ads: { label: "Paid Advertising" },
  ecommerce: { label: "E-Commerce Setup" },
  automation: { label: "Business Automation" },
} as const;

export type ServiceNeed = keyof typeof SERVICE_NEEDS;

// ---- Default scrape settings -----------------------------------------------

export const DEFAULT_SCRAPE_SETTINGS = {
  maxResults: 100,
  radiusKm: 25,
  minRating: 0,
  maxRating: 5,
  includeWebsite: true,
  includeEmail: true,
  includePhone: true,
  includeSocials: true,
  delayBetweenRequests: 2000,
  maxConcurrentPages: 3,
  retryAttempts: 2,
  timeout: 30000,
} as const;

// ---- Score thresholds ------------------------------------------------------

export const SCORE_THRESHOLDS = {
  excellent: 90,
  good: 70,
  average: 50,
  poor: 30,
  critical: 0,
} as const;

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Returns a hex colour string based on a numeric score (0-100).
 */
export function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.excellent) return "#22c55e"; // green
  if (score >= SCORE_THRESHOLDS.good) return "#3b82f6"; // blue
  if (score >= SCORE_THRESHOLDS.average) return "#eab308"; // yellow
  if (score >= SCORE_THRESHOLDS.poor) return "#f97316"; // orange
  return "#ef4444"; // red
}

/**
 * Returns the human-readable label for a priority key.
 */
export function getPriorityLabel(priority: string): string {
  const entry = LEAD_PRIORITIES[priority as LeadPriority];
  return entry?.label ?? "Unknown";
}

/**
 * Flattens a lead record into a plain object suitable for CSV / spreadsheet export.
 */
export function formatLeadForExport(lead: {
  id: string;
  businessName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  score?: number | null;
  priority?: string | null;
  status?: string | null;
  serviceNeeds?: string[] | null;
}): Record<string, string | number> {
  return {
    id: lead.id,
    business_name: lead.businessName ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    website: lead.website ?? "",
    address: lead.address ?? "",
    rating: lead.rating ?? 0,
    review_count: lead.reviewCount ?? 0,
    score: lead.score ?? 0,
    priority: lead.priority ? getPriorityLabel(lead.priority) : "",
    status: lead.status
      ? (LEAD_STATUSES[lead.status as LeadStatus]?.label ?? lead.status)
      : "",
    service_needs: (lead.serviceNeeds ?? []).join(", "),
  };
}
