import axios, { AxiosError, type AxiosInstance } from "axios";
import type {
  ApiResponse,
  PaginatedResponse,
  Business,
  Lead,
  ScrapingJob,
  WebsiteAnalysis,
  OutreachTemplate,
  OutreachMessage,
  LeadFilters,
  LeadStats,
  AnalyticsOverview,
  AnalyticsTrend,
} from "@/types";

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30_000,
});

// Request interceptor — attach auth token if present
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — normalize errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
      }
    }

    const message =
      error.response?.data?.message ??
      error.message ??
      "An unexpected error occurred";

    return Promise.reject(new Error(message));
  },
);

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function getLeads(
  filters?: LeadFilters,
): Promise<PaginatedResponse<Lead>> {
  const { data } = await api.get("/leads", { params: filters });
  return data;
}

export async function getLead(id: string): Promise<ApiResponse<Lead>> {
  const { data } = await api.get(`/leads/${id}`);
  return data;
}

export async function updateLead(
  id: string,
  payload: Partial<Lead>,
): Promise<ApiResponse<Lead>> {
  const { data } = await api.patch(`/leads/${id}`, payload);
  return data;
}

export async function deleteLead(id: string): Promise<ApiResponse<void>> {
  const { data } = await api.delete(`/leads/${id}`);
  return data;
}

export async function getLeadStats(): Promise<ApiResponse<LeadStats>> {
  const { data } = await api.get("/leads/stats");
  return data;
}

// ---------------------------------------------------------------------------
// Scraping Jobs
// ---------------------------------------------------------------------------

export async function createScrapingJob(
  payload: Partial<ScrapingJob>,
): Promise<ApiResponse<ScrapingJob>> {
  const { data } = await api.post("/scraping-jobs", payload);
  return data;
}

export async function getScrapingJobs(
  filters?: Record<string, unknown>,
): Promise<PaginatedResponse<ScrapingJob>> {
  const { data } = await api.get("/scraping-jobs", { params: filters });
  return data;
}

export async function getScrapingJob(
  id: string,
): Promise<ApiResponse<ScrapingJob>> {
  const { data } = await api.get(`/scraping-jobs/${id}`);
  return data;
}

export async function cancelScrapingJob(
  id: string,
): Promise<ApiResponse<ScrapingJob>> {
  const { data } = await api.post(`/scraping-jobs/${id}/cancel`);
  return data;
}

// ---------------------------------------------------------------------------
// AI Analysis
// ---------------------------------------------------------------------------

export async function analyzeWebsite(
  url: string,
): Promise<ApiResponse<WebsiteAnalysis>> {
  const { data } = await api.post("/ai/analyze-website", { url });
  return data;
}

export async function scoreLead(
  businessId: string,
): Promise<ApiResponse<{ score: number; factors: string[] }>> {
  const { data } = await api.post(`/ai/score-lead`, { businessId });
  return data;
}

export async function generateOutreach(
  leadId: string,
  type: string,
): Promise<ApiResponse<{ content: string }>> {
  const { data } = await api.post("/ai/generate-outreach", { leadId, type });
  return data;
}

export async function batchAnalyze(
  ids: string[],
): Promise<ApiResponse<{ jobId: string }>> {
  const { data } = await api.post("/ai/batch-analyze", { ids });
  return data;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function exportCSV(filters?: LeadFilters): Promise<Blob> {
  const { data } = await api.get("/export/csv", {
    params: filters,
    responseType: "blob",
  });
  return data;
}

export async function exportXLSX(filters?: LeadFilters): Promise<Blob> {
  const { data } = await api.get("/export/xlsx", {
    params: filters,
    responseType: "blob",
  });
  return data;
}

export async function exportJSON(filters?: LeadFilters): Promise<Blob> {
  const { data } = await api.get("/export/json", {
    params: filters,
    responseType: "blob",
  });
  return data;
}

// ---------------------------------------------------------------------------
// Outreach Templates
// ---------------------------------------------------------------------------

export async function getTemplates(): Promise<
  ApiResponse<OutreachTemplate[]>
> {
  const { data } = await api.get("/templates");
  return data;
}

export async function createTemplate(
  payload: Partial<OutreachTemplate>,
): Promise<ApiResponse<OutreachTemplate>> {
  const { data } = await api.post("/templates", payload);
  return data;
}

export async function updateTemplate(
  id: string,
  payload: Partial<OutreachTemplate>,
): Promise<ApiResponse<OutreachTemplate>> {
  const { data } = await api.patch(`/templates/${id}`, payload);
  return data;
}

export async function deleteTemplate(
  id: string,
): Promise<ApiResponse<void>> {
  const { data } = await api.delete(`/templates/${id}`);
  return data;
}

// ---------------------------------------------------------------------------
// Outreach Messages
// ---------------------------------------------------------------------------

export async function generateOutreachMessage(
  leadId: string,
  type: string,
): Promise<ApiResponse<OutreachMessage>> {
  const { data } = await api.post("/messages/generate", { leadId, type });
  return data;
}

export async function getMessages(): Promise<
  ApiResponse<OutreachMessage[]>
> {
  const { data } = await api.get("/messages");
  return data;
}

export async function createMessage(
  payload: Partial<OutreachMessage>,
): Promise<ApiResponse<OutreachMessage>> {
  const { data } = await api.post("/messages", payload);
  return data;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function getAnalyticsOverview(): Promise<
  ApiResponse<AnalyticsOverview>
> {
  const { data } = await api.get("/analytics/overview");
  return data;
}

export async function getAnalyticsTrends(
  period: string,
): Promise<ApiResponse<AnalyticsTrend[]>> {
  const { data } = await api.get("/analytics/trends", { params: { period } });
  return data;
}

export async function getTopNiches(): Promise<
  ApiResponse<{ niche: string; count: number }[]>
> {
  const { data } = await api.get("/analytics/top-niches");
  return data;
}

export async function getTopCities(): Promise<
  ApiResponse<{ city: string; count: number }[]>
> {
  const { data } = await api.get("/analytics/top-cities");
  return data;
}

export default api;
