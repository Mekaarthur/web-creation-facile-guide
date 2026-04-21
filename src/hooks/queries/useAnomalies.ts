/**
 * Hook React Query — Anomalies (centre unifié)
 *
 * Wrapper autour de anomalyService.
 * Refresh auto 30s pour rester à jour côté admin.
 *
 * ⚠️ L'ancien hook `src/hooks/useAnomaliesCenter.tsx` reste en place pour
 * compatibilité ; cette version utilise le service centralisé.
 */

import { useQuery } from "@tanstack/react-query";
import { anomalyService, type Anomaly, type AnomalyCategory, type AnomalySeverity } from "@/services/anomalyService";

export const anomalyKeys = {
  all: ["anomalies"] as const,
  list: () => [...anomalyKeys.all, "list"] as const,
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

export type { Anomaly, AnomalySeverity, AnomalyCategory };
