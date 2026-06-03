/**
 * Hook React Query — Providers
 * Wrapper autour de providerService.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { providerService, type ProviderFilters, type ProviderStatus, type Provider, type ProviderUpdate } from "@/services/providerService";

export const providerKeys = {
  all: ["providers"] as const,
  lists: () => [...providerKeys.all, "list"] as const,
  list: (filters: ProviderFilters) => [...providerKeys.lists(), filters] as const,
  details: () => [...providerKeys.all, "detail"] as const,
  detail: (id: string) => [...providerKeys.details(), id] as const,
  byUser: (userId: string) => [...providerKeys.all, "byUser", userId] as const,
};

export const useProviders = (
  filters: ProviderFilters = {},
  options?: Omit<UseQueryOptions<Provider[]>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: providerKeys.list(filters),
    queryFn: () => providerService.list(filters),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useProvider = (id: string | undefined) => {
  return useQuery({
    queryKey: providerKeys.detail(id ?? ""),
    queryFn: () => providerService.getById(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
};

export const useProviderByUser = (userId: string | undefined) => {
  return useQuery({
    queryKey: providerKeys.byUser(userId ?? ""),
    queryFn: () => providerService.getByUserId(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
};

export const useUpdateProvider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ProviderUpdate }) => providerService.update(id, patch),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: providerKeys.detail(data.id) });
      qc.invalidateQueries({ queryKey: providerKeys.lists() });
    },
  });
};

export const useSetProviderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProviderStatus }) => providerService.setStatus(id, status),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: providerKeys.detail(data.id) });
      qc.invalidateQueries({ queryKey: providerKeys.lists() });
    },
  });
};

export const useSetProviderVerified = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      providerService.setVerified(id, isVerified),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: providerKeys.detail(data.id) });
      qc.invalidateQueries({ queryKey: providerKeys.lists() });
    },
  });
};

export type { Provider, ProviderFilters, ProviderStatus };
