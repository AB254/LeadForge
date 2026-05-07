"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAnalyticsOverview,
  getAnalyticsTrends,
  getTopNiches,
  getTopCities,
} from "@/lib/api";
import type { AnalyticsOverview, AnalyticsTrend, ApiResponse } from "@/types";

const ANALYTICS_OVERVIEW_KEY = "analytics-overview";
const ANALYTICS_TRENDS_KEY = "analytics-trends";
const TOP_NICHES_KEY = "top-niches";
const TOP_CITIES_KEY = "top-cities";

export function useAnalyticsOverview() {
  return useQuery<ApiResponse<AnalyticsOverview>>({
    queryKey: [ANALYTICS_OVERVIEW_KEY],
    queryFn: getAnalyticsOverview,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsTrends(period: string) {
  return useQuery<ApiResponse<AnalyticsTrend[]>>({
    queryKey: [ANALYTICS_TRENDS_KEY, period],
    queryFn: () => getAnalyticsTrends(period),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopNiches() {
  return useQuery<ApiResponse<{ niche: string; count: number }[]>>({
    queryKey: [TOP_NICHES_KEY],
    queryFn: getTopNiches,
    staleTime: 10 * 60 * 1000,
  });
}

export function useTopCities() {
  return useQuery<ApiResponse<{ city: string; count: number }[]>>({
    queryKey: [TOP_CITIES_KEY],
    queryFn: getTopCities,
    staleTime: 10 * 60 * 1000,
  });
}
