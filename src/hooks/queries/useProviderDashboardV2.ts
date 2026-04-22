/**
 * Hook React Query — Provider Dashboard V2
 *
 * Remplace progressivement `src/hooks/useProviderDashboard.tsx` (599 lignes monolithiques + cache custom).
 * Découpé en sous-hooks par tab pour permettre des invalidations ciblées et un chargement à la demande.
 *
 * Usage typique :
 *   const { data: provider } = useDashboardProfile();
 *   const { data: missions } = useDashboardMissions(provider?.id);
 *   const { data: opportunities } = useDashboardOpportunities(provider?.id);
 *   const { data: earnings } = useDashboardEarnings(provider?.id);
 *   const apply = useApplyToOpportunity();
 *
 * L'ancien hook reste fonctionnel pour ne rien casser.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { providerService } from "@/services/providerService";
import { providerKeys } from "./useProviders";

// Clés dédiées au dashboard (séparées des clés admin/list)
export const providerDashboardKeys = {
  all: ["provider-dashboard"] as const,
  profile: (userId: string) => [...providerDashboardKeys.all, "profile", userId] as const,
  missions: (providerId: string) => [...providerDashboardKeys.all, "missions", providerId] as const,
  opportunities: (providerId: string) => [...providerDashboardKeys.all, "opportunities", providerId] as const,
  reviews: (providerId: string) => [...providerDashboardKeys.all, "reviews", providerId] as const,
  earnings: (providerId: string) => [...providerDashboardKeys.all, "earnings", providerId] as const,
};

/**
 * Profil prestataire complet pour le dashboard (provider + services + profile).
 * staleTime 5 min : les infos de profil changent rarement.
 */
export const useDashboardProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: providerDashboardKeys.profile(user?.id ?? ""),
    queryFn: () => providerService.getDashboardProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Missions du prestataire (30 derniers jours).
 * staleTime 30s : changements fréquents (nouvelles missions, statuts).
 */
export const useDashboardMissions = (providerId: string | undefined) => {
  return useQuery({
    queryKey: providerDashboardKeys.missions(providerId ?? ""),
    queryFn: () => providerService.getMissions(providerId!),
    enabled: !!providerId,
    staleTime: 30 * 1000,
  });
};

/**
 * Opportunités disponibles (bookings ouverts + missions matching).
 * staleTime 15s : très volatile, refresh fréquent souhaité.
 */
export const useDashboardOpportunities = (providerId: string | undefined) => {
  return useQuery({
    queryKey: providerDashboardKeys.opportunities(providerId ?? ""),
    queryFn: () => providerService.getOpportunities(providerId!),
    enabled: !!providerId,
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Avis approuvés du prestataire.
 * staleTime 5 min : les avis changent peu fréquemment.
 */
export const useDashboardReviews = (providerId: string | undefined) => {
  return useQuery({
    queryKey: providerDashboardKeys.reviews(providerId ?? ""),
    queryFn: () => providerService.getReviews(providerId!),
    enabled: !!providerId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Données financières (revenus mois courant, mois précédent, total, croissance).
 * staleTime 2 min : recalcul fréquent inutile.
 */
export const useDashboardEarnings = (providerId: string | undefined) => {
  return useQuery({
    queryKey: providerDashboardKeys.earnings(providerId ?? ""),
    queryFn: () => providerService.getEarnings(providerId!),
    enabled: !!providerId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Mutation : postuler à une opportunité.
 * Invalide les opportunités et missions après succès.
 */
export const useApplyToOpportunity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      providerId: string;
      opportunityId: string;
      responseType?: "accepted" | "declined" | "interested";
    }) => providerService.applyToOpportunity(params),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: providerDashboardKeys.opportunities(variables.providerId) });
      qc.invalidateQueries({ queryKey: providerDashboardKeys.missions(variables.providerId) });
    },
  });
};

/**
 * Helper : invalider toutes les requêtes du dashboard (après une action globale).
 */
export const useInvalidateProviderDashboard = () => {
  const qc = useQueryClient();
  return (providerId?: string) => {
    qc.invalidateQueries({ queryKey: providerDashboardKeys.all });
    if (providerId) {
      qc.invalidateQueries({ queryKey: providerKeys.detail(providerId) });
    }
  };
};
