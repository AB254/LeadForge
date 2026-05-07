"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getScrapingJobs,
  createScrapingJob,
  cancelScrapingJob,
} from "@/lib/api";
import type { ScrapingJob, PaginatedResponse, ApiResponse } from "@/types";

const SCRAPING_JOBS_KEY = "scraping-jobs";

export function useScrapingJobs(filters?: Record<string, unknown>) {
  return useQuery<PaginatedResponse<ScrapingJob>>({
    queryKey: [SCRAPING_JOBS_KEY, filters],
    queryFn: () => getScrapingJobs(filters),
    refetchInterval: 5000, // Poll running jobs
  });
}

export function useCreateScrapingJob() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<ScrapingJob>, Error, Partial<ScrapingJob>>({
    mutationFn: (data) => createScrapingJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SCRAPING_JOBS_KEY] });
    },
  });
}

export function useCancelScrapingJob() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<ScrapingJob>, Error, string>({
    mutationFn: (id) => cancelScrapingJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SCRAPING_JOBS_KEY] });
    },
  });
}
