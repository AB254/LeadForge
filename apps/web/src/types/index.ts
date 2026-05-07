// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum LeadPriority {
  HOT = "HOT",
  WARM = "WARM",
  COLD = "COLD",
}

export enum LeadStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  QUALIFIED = "QUALIFIED",
  PROPOSAL = "PROPOSAL",
  NEGOTIATION = "NEGOTIATION",
  WON = "WON",
  LOST = "LOST",
  ARCHIVED = "ARCHIVED",
}

export enum ScrapingJobStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum OutreachType {
  EMAIL = "EMAIL",
  LINKEDIN = "LINKEDIN",
  PHONE = "PHONE",
  SMS = "SMS",
}

export enum OutreachMessageStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  OPENED = "OPENED",
  REPLIED = "REPLIED",
  BOUNCED = "BOUNCED",
}

// ---------------------------------------------------------------------------
// Core Models
// ---------------------------------------------------------------------------

export interface Business {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
  niche: string | null;
  description: string | null;
  rating: number | null;
  reviewCount: number | null;
  priceRange: string | null;
  hoursOfOperation: Record<string, string> | null;
  socialMedia: Record<string, string> | null;
  metadata: Record<string, unknown> | null;
  organizationId: string;
  scrapingJobId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  businessId: string;
  business: Business;
  organizationId: string;
  priority: LeadPriority;
  status: LeadStatus;
  score: number | null;
  scoreFactors: string[] | null;
  painPoints: string[] | null;
  opportunities: string[] | null;
  notes: string | null;
  assignedTo: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ScrapingJob {
  id: string;
  organizationId: string;
  status: ScrapingJobStatus;
  source: string;
  query: string;
  location: string | null;
  radius: number | null;
  maxResults: number | null;
  totalFound: number | null;
  totalScraped: number | null;
  totalErrors: number | null;
  config: Record<string, unknown> | null;
  errorLog: string[] | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteAnalysis {
  id: string;
  businessId: string;
  url: string;
  hasModernDesign: boolean | null;
  hasMobileResponsive: boolean | null;
  hasSSL: boolean | null;
  hasSEO: boolean | null;
  hasAnalytics: boolean | null;
  hasChatWidget: boolean | null;
  hasBookingSystem: boolean | null;
  hasEcommerce: boolean | null;
  loadTimeMs: number | null;
  technologies: string[];
  painPoints: string[];
  opportunities: string[];
  overallScore: number | null;
  rawAnalysis: Record<string, unknown> | null;
  analyzedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachTemplate {
  id: string;
  organizationId: string;
  name: string;
  type: OutreachType;
  subject: string | null;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachMessage {
  id: string;
  leadId: string;
  lead?: Lead;
  templateId: string | null;
  template?: OutreachTemplate;
  organizationId: string;
  type: OutreachType;
  subject: string | null;
  body: string;
  status: OutreachMessageStatus;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSearch {
  id: string;
  organizationId: string;
  name: string;
  filters: LeadFilters;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Filter & Analytics Types
// ---------------------------------------------------------------------------

export interface LeadFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  priority?: LeadPriority | LeadPriority[];
  status?: LeadStatus | LeadStatus[];
  niche?: string | string[];
  city?: string | string[];
  state?: string | string[];
  country?: string;
  minScore?: number;
  maxScore?: number;
  tags?: string[];
  assignedTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  createdAfter?: string;
  createdBefore?: string;
}

export interface LeadStats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  averageScore: number;
  contactedToday: number;
  newThisWeek: number;
  conversionRate: number;
  byStatus: Record<LeadStatus, number>;
  byNiche: { niche: string; count: number }[];
  byCity: { city: string; count: number }[];
}

export interface AnalyticsOverview {
  totalLeads: number;
  totalBusinesses: number;
  totalScrapingJobs: number;
  totalOutreachSent: number;
  leadsThisWeek: number;
  leadsLastWeek: number;
  leadsGrowthPercent: number;
  averageLeadScore: number;
  topNiche: string;
  topCity: string;
  conversionRate: number;
  responseRate: number;
}

export interface AnalyticsTrend {
  date: string;
  leads: number;
  contacted: number;
  converted: number;
  score: number;
}
