/**
 * Hook React Query — Anomalies (centre unifié)
 *
 * Wrapper autour de anomalyService.
 * Refresh auto 30s pour rester à jour côté admin.
 *
 * ⚠️ L'ancien hook `src/hooks/useAnomaliesCenter.tsx` reste en place pour
 * compatibilité ; cette version utilise le service centralisé.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { anomalyService, type Anomaly, type AnomalyCategory, type AnomalySeverity, type AnomalyStatus, type AnomalyInsert } from "@/services/anomalyService";

export const anomalyKeys = {
  all: ["anomalies"] as const,
  list: () => [...anomalyKeys.all, "list"] as const,
  persisted: () => [...anomalyKeys.all, "persisted"] as const,
  live: () => [...anomalyKeys.all, "live"] as const,
  bySeverity: (sev: AnomalySeverity) => [...anomalyKeys.all, "sev", sev] as const,
  byCategory: (cat: AnomalyCategory) => [...anomalyKeys.all, "cat", cat] as const,
};

export const useAnomalies = () => {
  return useQuery({
    queryKey: anomalyKeys.list(),
    queryFn: () => anomalyService.getAll(),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
};

export const useAnomaliesBySeverity = (severity: AnomalySeverity) => {
  return useQuery({
    queryKey: anomalyKeys.bySeverity(severity),
    queryFn: () => anomalyService.getBySeverity(severity),
    staleTime: 30 * 1000,
  });
};

export const useAnomaliesByCategory = (category: AnomalyCategory) => {
  return useQuery({
    queryKey: anomalyKeys.byCategory(category),
    queryFn: () => anomalyService.getByCategory(category),
    staleTime: 30 * 1000,
  });
};

export const useCreateAnomaly = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AnomalyInsert) => anomalyService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: anomalyKeys.all }),
  });
};

export const useSetAnomalyStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: AnomalyStatus; note?: string }) =>
      anomalyService.setStatus(id, status, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: anomalyKeys.all }),
  });
};

export const useAssignAnomaly = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => anomalyService.assign(id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: anomalyKeys.all }),
  });
};

export type { Anomaly, AnomalySeverity, AnomalyCategory, AnomalyStatus };
