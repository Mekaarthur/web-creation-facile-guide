/**
 * Service Layer — Anomalies (centre unifié)
 *
 * Deux sources :
 *  1. Anomalies persistées (table `anomalies`) — créées par les jobs cron
 *     ou par les admins manuellement. Statut, assignation, SLA, résolution.
 *  2. Anomalies "live" — agrégées en temps réel à partir des autres tables
 *     (réservations en attente, missions non assignées, etc.). Non persistées.
 *
 * `getAll()` fusionne les deux et trie par sévérité.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AnomalyRow = Database["public"]["Tables"]["anomalies"]["Row"];
export type AnomalyInsert = Database["public"]["Tables"]["anomalies"]["Insert"];
export type AnomalyUpdate = Database["public"]["Tables"]["anomalies"]["Update"];

export type AnomalySeverity = "critical" | "high" | "medium" | "low" | "info";
export type AnomalyCategory =
  | "system"
  | "mission"
  | "compliance"
  | "security"
  | "business"
  | "communication";
export type AnomalyStatus = "open" | "investigating" | "resolved" | "dismissed";

/** Représentation unifiée (live + persistée) consommée par l'UI. */
export interface Anomaly {
  id: string;
  severity: AnomalySeverity;
  category: AnomalyCategory;
  title: string;
  description: string;
  count?: number;
  detectedAt: string;
  status?: AnomalyStatus;
  assignedTo?: string | null;
  slaBreached?: boolean;
  source: "live" | "persisted";
  actionLabel?: string;
  actionHref?: string;
}

const sevWeight: Record<AnomalySeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

class ServiceError extends Error {
  constructor(message: string, public code?: string, public cause?: unknown) {
    super(message);
    this.name = "AnomalyServiceError";
  }
}

const safeCount = async (q: any): Promise<number> => {
  try {
    const { count, error } = await q;
    if (error) return 0;
    return count ?? 0;
  } catch { return 0; }
};

/** Mappe une row persistée vers l'UI Anomaly */
const mapPersisted = (row: AnomalyRow): Anomaly => ({
  id: row.id,
  severity: (row.severity as AnomalySeverity) ?? "medium",
  category: (row.type as AnomalyCategory) ?? "system",
  title: row.title,
  description: row.description ?? "",
  detectedAt: row.created_at,
  status: row.status as AnomalyStatus,
  assignedTo: row.assigned_to,
  slaBreached: row.sla_breached,
  source: "persisted",
});

export const anomalyService = {
  /** Anomalies persistées en base (status open ou investigating). */
  async listPersisted(filters?: { status?: AnomalyStatus[]; severity?: AnomalySeverity }): Promise<Anomaly[]> {
    let query = supabase.from("anomalies").select("*").order("created_at", { ascending: false });
    const statuses = filters?.status ?? ["open", "investigating"];
    query = query.in("status", statuses);
    if (filters?.severity) query = query.eq("severity", filters.severity);

    const { data, error } = await query;
    if (error) throw new ServiceError("Erreur chargement anomalies", error.code, error);
    return (data ?? []).map(mapPersisted);
  },

  /** Anomalies live agrégées depuis les autres tables. */
  async listLive(): Promise<Anomaly[]> {
    const now = new Date();
    const cutoff2h = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const cutoff60d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

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
      safeCount(supabase.from("providers").select("*", { count: "exact", head: true }).lte("nova_expires_at", in30d).gte("nova_expires_at", nowIso)),
      safeCount(supabase.from("providers").select("*", { count: "exact", head: true }).eq("status", "active").lte("last_activity_at", cutoff60d)),
    ]);

    const items: Anomaly[] = [];
    const push = (a: Omit<Anomaly, "source" | "detectedAt"> & { detectedAt?: string }) =>
      items.push({ ...a, source: "live", detectedAt: a.detectedAt ?? nowIso });

    if (failedEmails > 0) push({
      id: "live:failed-emails", severity: failedEmails > 10 ? "high" : "medium", category: "system",
      title: "Emails non délivrés", description: `${failedEmails} email(s) en échec sur 24h`,
      count: failedEmails, actionLabel: "Voir", actionHref: "/modern-admin/notifications",
    });
    if (pendingBookings > 0) push({
      id: "live:pending-bookings", severity: pendingBookings > 5 ? "high" : "medium", category: "business",
      title: "Réservations en attente", description: `${pendingBookings} réservation(s) en attente depuis +2h`,
      count: pendingBookings, actionLabel: "Traiter", actionHref: "/modern-admin/reservations",
    });
    if (unassignedMissions > 0) push({
      id: "live:unassigned-missions", severity: "high", category: "mission",
      title: "Missions sans prestataire", description: `${unassignedMissions} mission(s) confirmée(s) sans assignation`,
      count: unassignedMissions, actionLabel: "Assigner", actionHref: "/modern-admin/matching",
    });
    if (unmoderatedReviews > 0) push({
      id: "live:unmoderated-reviews", severity: "medium", category: "communication",
      title: "Avis à modérer", description: `${unmoderatedReviews} avis en attente de modération`,
      count: unmoderatedReviews, actionLabel: "Modérer", actionHref: "/modern-admin/moderation",
    });
    if (novaExpiringSoon > 0) push({
      id: "live:nova-expiring", severity: novaExpiringSoon > 3 ? "high" : "medium", category: "compliance",
      title: "Nova expirant bientôt", description: `${novaExpiringSoon} prestataire(s) avec attestation Nova expirant sous 30j`,
      count: novaExpiringSoon, actionLabel: "Voir conformité", actionHref: "/modern-admin/quality",
    });
    if (inactiveProviders > 0) push({
      id: "live:inactive-providers", severity: "info", category: "business",
      title: "Prestataires inactifs", description: `${inactiveProviders} prestataire(s) actif(s) sans activité depuis 60j`,
      count: inactiveProviders, actionLabel: "Relancer", actionHref: "/modern-admin/providers",
    });

    return items;
  },

  /** Fusion live + persisté, trié par sévérité. */
  async getAll(): Promise<Anomaly[]> {
    const [persisted, live] = await Promise.all([
      this.listPersisted().catch(() => []),
      this.listLive(),
    ]);
    return [...persisted, ...live].sort((a, b) => sevWeight[a.severity] - sevWeight[b.severity]);
  },

  async getBySeverity(severity: AnomalySeverity): Promise<Anomaly[]> {
    const all = await this.getAll();
    return all.filter(a => a.severity === severity);
  },

  async getByCategory(category: AnomalyCategory): Promise<Anomaly[]> {
    const all = await this.getAll();
    return all.filter(a => a.category === category);
  },

  /** Création manuelle (admin). */
  async create(payload: AnomalyInsert): Promise<AnomalyRow> {
    const { data, error } = await supabase.from("anomalies").insert(payload).select().single();
    if (error) throw new ServiceError("Création impossible", error.code, error);
    return data;
  },

  /** Changement de statut (resolve / dismiss / investigating). */
  async setStatus(id: string, status: AnomalyStatus, resolutionNote?: string): Promise<AnomalyRow> {
    const patch: AnomalyUpdate = {
      status,
      ...(status === "resolved" || status === "dismissed"
        ? { resolved_at: new Date().toISOString(), resolution_note: resolutionNote ?? null }
        : {}),
    };
    const { data, error } = await supabase.from("anomalies").update(patch).eq("id", id).select().single();
    if (error) throw new ServiceError("Mise à jour impossible", error.code, error);
    return data;
  },

  async assign(id: string, userId: string): Promise<AnomalyRow> {
    const { data, error } = await supabase
      .from("anomalies").update({ assigned_to: userId, status: "investigating" })
      .eq("id", id).select().single();
    if (error) throw new ServiceError("Assignation impossible", error.code, error);
    return data;
  },
};

export { ServiceError as AnomalyServiceError };
