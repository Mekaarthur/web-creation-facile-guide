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
 *   const stats = useDashboardStats({ provider, missions, reviews, earnings });
 *   const apply = useApplyToOpportunity();
 *   const updateStatus = useUpdateMissionStatus();
 *
 * L'ancien hook reste fonctionnel pour ne rien casser.
 */

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { providerService } from "@/services/providerService";
import { bookingService, type BookingStatus } from "@/services/bookingService";
import { providerKeys } from "./useProviders";
import { bookingKeys } from "./useBookings";

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

// ============================================================
// Stats agrégées (hook dérivé, pas de fetch)
// ============================================================

export interface DashboardStats {
  monthlyEarnings: number;
  previousMonthEarnings: number;
  earningsGrowth: number;
  totalEarnings: number;
  activeMissions: number;
  completedMissions: number;
  averageRating: number;
  acceptanceRate: number;
  totalReviews: number;
  responseTime: number;
}

/**
 * Stats agrégées calculées à partir des données déjà en cache.
 * Ne déclenche aucune requête réseau supplémentaire.
 */
export const useDashboardStats = (input: {
  provider?: any | null;
  missions?: any[] | null;
  reviews?: any[] | null;
  earnings?: {
    monthlyEarnings: number;
    previousMonthEarnings: number;
    totalEarnings: number;
    earningsGrowth: number;
  } | null;
}): DashboardStats => {
  const { provider, missions, reviews, earnings } = input;

  return useMemo(() => {
    const m = missions ?? [];
    const r = reviews ?? [];
    const e = earnings ?? { monthlyEarnings: 0, previousMonthEarnings: 0, totalEarnings: 0, earningsGrowth: 0 };

    const completedMissions = m.filter((x: any) => x.status === "completed");
    const activeMissions = m.filter((x: any) => ["pending", "confirmed", "in_progress"].includes(x.status));
    const confirmedMissions = m.filter((x: any) => x.status === "confirmed" || x.status === "completed");

    const averageRating = r.length > 0
      ? r.reduce((sum: number, x: any) => sum + (x.rating || 0), 0) / r.length
      : 0;

    const responseTime = confirmedMissions.length > 0
      ? Math.round((confirmedMissions.length / Math.max(m.length, 1)) * 30)
      : 0;

    return {
      monthlyEarnings: e.monthlyEarnings,
      previousMonthEarnings: e.previousMonthEarnings,
      earningsGrowth: e.earningsGrowth,
      totalEarnings: e.totalEarnings,
      activeMissions: activeMissions.length,
      completedMissions: completedMissions.length,
      averageRating,
      acceptanceRate: provider?.acceptance_rate || 0,
      totalReviews: r.length,
      responseTime,
    };
  }, [provider, missions, reviews, earnings]);
};

// ============================================================
// Mutations
// ============================================================

/**
 * Mutation : postuler à une opportunité.
 * Optimistic update : retire l'opportunité de la liste avant le retour serveur,
 * rollback si erreur. Invalide opportunités + missions après succès.
 */
export const useApplyToOpportunity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      providerId: string;
      opportunityId: string;
      responseType?: "accepted" | "declined" | "interested";
    }) => providerService.applyToOpportunity(params),

    onMutate: async (variables) => {
      const key = providerDashboardKeys.opportunities(variables.providerId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<any[]>(key);
      if (previous) {
        qc.setQueryData<any[]>(key, previous.filter((o) => o.id !== variables.opportunityId));
      }
      return { previous };
    },

    onError: (_err, variables, context) => {
      if (context?.previous) {
        qc.setQueryData(providerDashboardKeys.opportunities(variables.providerId), context.previous);
      }
    },

    onSettled: (_data, _err, variables) => {
      qc.invalidateQueries({ queryKey: providerDashboardKeys.opportunities(variables.providerId) });
      qc.invalidateQueries({ queryKey: providerDashboardKeys.missions(variables.providerId) });
    },
  });
};

/**
 * Mutation : changer le statut d'une mission (booking).
 * Met automatiquement à jour started_at / completed_at selon le nouveau statut.
 * Invalide les missions du dashboard ET le cache booking standard.
 */
export const useUpdateMissionStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      missionId: string;
      providerId: string;
      status: BookingStatus;
      notes?: string;
    }) => {
      const extra: any = {};
      if (params.notes) extra.provider_notes = params.notes;
      if (params.status === "in_progress") extra.started_at = new Date().toISOString();
      if (params.status === "completed") extra.completed_at = new Date().toISOString();
      const result = await bookingService.updateStatus(params.missionId, params.status, extra);

      // Notification email best-effort (in_progress / completed)
      if (params.status === "in_progress" || params.status === "completed") {
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          await supabase.functions.invoke("send-mission-status-update", {
            body: { bookingId: params.missionId, newStatus: params.status },
          });
        } catch (e) {
          console.warn("send-mission-status-update failed (non-bloquant)", e);
        }
      }

      return result;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: providerDashboardKeys.missions(variables.providerId) });
      qc.invalidateQueries({ queryKey: providerDashboardKeys.earnings(variables.providerId) });
      qc.invalidateQueries({ queryKey: bookingKeys.detail(variables.missionId) });
      qc.invalidateQueries({ queryKey: bookingKeys.lists() });
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
