"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getLeads,
  getLead,
  getLeadStats,
  updateLead,
  deleteLead,
} from "@/lib/api";
import type {
  Lead,
  LeadFilters,
  LeadStats,
  PaginatedResponse,
  ApiResponse,
} from "@/types";

const LEADS_KEY = "leads";
const LEAD_KEY = "lead";
const LEAD_STATS_KEY = "lead-stats";

export function useLeads(
  filters?: LeadFilters,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Lead>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<PaginatedResponse<Lead>>({
    queryKey: [LEADS_KEY, filters],
    queryFn: () => getLeads(filters),
    ...options,
  });
}

export function useLead(
  id: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<Lead>>, "queryKey" | "queryFn">,
) {
  return useQuery<ApiResponse<Lead>>({
    queryKey: [LEAD_KEY, id],
    queryFn: () => getLead(id!),
    enabled: !!id,
    ...options,
  });
}

export function useLeadStats(
  options?: Omit<
    UseQueryOptions<ApiResponse<LeadStats>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<ApiResponse<LeadStats>>({
    queryKey: [LEAD_STATS_KEY],
    queryFn: getLeadStats,
    ...options,
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) =>
      updateLead(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [LEADS_KEY] });
      queryClient.invalidateQueries({ queryKey: [LEAD_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [LEAD_STATS_KEY] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEADS_KEY] });
      queryClient.invalidateQueries({ queryKey: [LEAD_STATS_KEY] });
    },
  });
}
