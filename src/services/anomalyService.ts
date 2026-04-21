/**
 * Service Layer — Anomalies (centre unifié)
 *
 * Agrège toutes les détections d'anomalies (système, mission, conformité,
 * sécurité, business, communication) en une vue unique pour l'admin.
 *
 * La logique de détection vit dans plusieurs tables existantes ; ce service
 * les agrège côté lecture. Une future migration pourra introduire une table
 * `anomalies` unifiée — ce service devra alors être adapté en lecture seule
 * sur cette table.
 */

import { supabase } from "@/integrations/supabase/client";

export type AnomalySeverity = "critical" | "high" | "medium" | "info";
export type AnomalyCategory =
  | "system"
  | "mission"
  | "compliance"
  | "security"
  | "business"
  | "communication";

export interface Anomaly {
  id: string;
  severity: AnomalySeverity;
  category: AnomalyCategory;
  title: string;
  description: string;
  count?: number;
  detectedAt: string;
  actionLabel?: string;
  actionHref?: string;
}

const sevWeight: Record<AnomalySeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  info: 3,
};

class ServiceError extends Error {
  constructor(message: string, public code?: string, public cause?: unknown) {
    super(message);
    this.name = "AnomalyServiceError";
  }
}

export const anomalyService = {
  /**
   * Récupère et agrège toutes les anomalies actives.
   * Tri par sévérité décroissante (critical en premier).
   */
  async getAll(): Promise<Anomaly[]> {
    const now = new Date();
    const cutoff2h = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const cutoff7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const cutoff60d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const safeCount = async (q: any): Promise<number> => {
      try {
        const { count, error } = await q;
        if (error) return 0;
        return count ?? 0;
      } catch { return 0; }
    };

    // Requêtes en parallèle (count seulement, head:true pour perf)
    const [
      failedEmails,
      pendingBookings,
      unassignedMissions,
      unmoderatedReviews,
      novaExpiringSoon,
      inactiveProviders,
    ] = await Promise.all([
      safeCount(supabase.from("notifications").select("*", { count: "exact", head: true }).eq("type", "email_failed").gte("created_at", cutoff24h)),
      safeCount(supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending").lte("created_at", cutoff2h)),
      safeCount(supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "confirmed").is("provider_id", null)),
      safeCount(supabase.from("reviews").select("*", { count: "exact", head: true }).eq("is_approved", false)),
      safeCount(supabase.from("providers").select("*", { count: "exact", head: true }).lte("nova_expires_at", in30d).gte("nova_expires_at", now.toISOString())),
      safeCount(supabase.from("providers").select("*", { count: "exact", head: true }).eq("status", "active").lte("last_activity_at", cutoff60d)),
    ]);

    const items: Anomaly[] = [];
    const nowIso = now.toISOString();

    if (failedEmails > 0) items.push({
      id: "failed-emails", severity: failedEmails > 10 ? "high" : "medium", category: "system",
      title: "Emails non délivrés", description: `${failedEmails} email(s) en échec sur 24h`,
      count: failedEmails, detectedAt: nowIso,
      actionLabel: "Voir les emails", actionHref: "/modern-admin/notifications",
    });

    if (pendingBookings > 0) items.push({
      id: "pending-bookings", severity: pendingBookings > 5 ? "high" : "medium", category: "business",
      title: "Réservations en attente", description: `${pendingBookings} réservation(s) en attente depuis +2h`,
      count: pendingBookings, detectedAt: nowIso,
      actionLabel: "Traiter", actionHref: "/modern-admin/reservations",
    });

    if (unassignedMissions > 0) items.push({
      id: "unassigned-missions", severity: "high", category: "mission",
      title: "Missions sans prestataire", description: `${unassignedMissions} mission(s) confirmée(s) sans assignation`,
      count: unassignedMissions, detectedAt: nowIso,
      actionLabel: "Assigner", actionHref: "/modern-admin/matching",
    });

    if (unmoderatedReviews > 0) items.push({
      id: "unmoderated-reviews", severity: "medium", category: "communication",
      title: "Avis à modérer", description: `${unmoderatedReviews} avis en attente de modération`,
      count: unmoderatedReviews, detectedAt: nowIso,
      actionLabel: "Modérer", actionHref: "/modern-admin/moderation",
    });

    if (novaExpiringSoon > 0) items.push({
      id: "nova-expiring", severity: novaExpiringSoon > 3 ? "high" : "medium", category: "compliance",
      title: "Nova expirant bientôt", description: `${novaExpiringSoon} prestataire(s) avec attestation Nova expirant sous 30j`,
      count: novaExpiringSoon, detectedAt: nowIso,
      actionLabel: "Voir conformité", actionHref: "/modern-admin/quality",
    });

    if (inactiveProviders > 0) items.push({
      id: "inactive-providers", severity: "info", category: "business",
      title: "Prestataires inactifs", description: `${inactiveProviders} prestataire(s) actif(s) sans activité depuis 60j`,
      count: inactiveProviders, detectedAt: nowIso,
      actionLabel: "Relancer", actionHref: "/modern-admin/providers",
    });

    return items.sort((a, b) => sevWeight[a.severity] - sevWeight[b.severity]);
  },

  /** Filtrage par sévérité (raccourci). */
  async getBySeverity(severity: AnomalySeverity): Promise<Anomaly[]> {
    const all = await this.getAll();
    return all.filter(a => a.severity === severity);
  },

  /** Filtrage par catégorie (raccourci). */
  async getByCategory(category: AnomalyCategory): Promise<Anomaly[]> {
    const all = await this.getAll();
    return all.filter(a => a.category === category);
  },
};

export { ServiceError as AnomalyServiceError };
