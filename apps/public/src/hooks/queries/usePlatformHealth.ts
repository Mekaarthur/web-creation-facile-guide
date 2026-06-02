/**
 * usePlatformHealth — Score de santé plateforme (Chantier 7)
 *
 * Agrège plusieurs signaux opérationnels pour produire un état synthétique :
 *   - Anomalies actives par sévérité (via anomalyService)
 *   - Missions en attente de prestataire depuis > 30 min
 *   - Paiements en échec / transactions bloquées
 *   - Communications email en erreur (status = 'failed')
 *   - Réservations 'pending' anciennes (> 24h)
 *
 * Score : 100 = parfait, 0 = critique. Décrément par signal pondéré sévérité.
 * Refresh 60s.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { anomalyService, type Anomaly } from "@/services/anomalyService";

export type HealthLevel = "healthy" | "degraded" | "warning" | "critical";

export interface HealthSignal {
  key: string;
  label: string;
  count: number;
  severity: "critical" | "high" | "medium" | "low";
  hint?: string;
}

export interface PlatformHealth {
  score: number; // 0..100
  level: HealthLevel;
  signals: HealthSignal[];
  anomalies: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    slaBreached: number;
  };
  computedAt: string;
}

const SEVERITY_WEIGHT: Record<HealthSignal["severity"], number> = {
  critical: 25,
  high: 12,
  medium: 5,
  low: 2,
};

const levelFromScore = (score: number): HealthLevel => {
  if (score >= 90) return "healthy";
  if (score >= 70) return "degraded";
  if (score >= 40) return "warning";
  return "critical";
};

export const usePlatformHealth = () => {
  return useQuery<PlatformHealth>({
    queryKey: ["platform-health"],
    refetchInterval: 60_000,
    staleTime: 50_000,
    queryFn: async () => {
      const now = new Date();
      const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

      // ── Anomalies persistées ────────────────────────────────
      let persisted: Anomaly[] = [];
      try {
        persisted = await anomalyService.listPersisted({
          status: ["open", "investigating"],
        });
      } catch {
        persisted = [];
      }

      const anomaliesAgg = {
        total: persisted.length,
        critical: persisted.filter((a) => a.severity === "critical").length,
        high: persisted.filter((a) => a.severity === "high").length,
        medium: persisted.filter((a) => a.severity === "medium").length,
        slaBreached: persisted.filter((a) => a.slaBreached).length,
      };

      // ── Missions sans prestataire (>30 min) ─────────────────
      const { count: stalledMissions } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .lte("created_at", thirtyMinAgo);

      // ── Réservations pending > 24h (à purger) ───────────────
      const { count: oldPendingBookings } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .lte("created_at", oneDayAgo);

      // ── Paiements en échec (1h) ─────────────────────────────
      const { count: failedPayments } = await supabase
        .from("financial_transactions")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "failed")
        .gte("updated_at", oneHourAgo);

      // ── Communications email en échec (24h) ─────────────────
      const { count: failedComms } = await supabase
        .from("communications")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed")
        .gte("created_at", oneDayAgo);

      // ── Signaux ─────────────────────────────────────────────
      const signals: HealthSignal[] = [];

      if (anomaliesAgg.critical > 0) {
        signals.push({
          key: "anomalies-critical",
          label: "Anomalies critiques",
          count: anomaliesAgg.critical,
          severity: "critical",
          hint: "Intervention immédiate requise",
        });
      }
      if (anomaliesAgg.slaBreached > 0) {
        signals.push({
          key: "sla-breached",
          label: "SLA dépassés",
          count: anomaliesAgg.slaBreached,
          severity: "high",
          hint: "Délais de résolution non respectés",
        });
      }
      if (anomaliesAgg.high > 0) {
        signals.push({
          key: "anomalies-high",
          label: "Anomalies élevées",
          count: anomaliesAgg.high,
          severity: "high",
        });
      }
      if ((stalledMissions ?? 0) > 0) {
        signals.push({
          key: "stalled-missions",
          label: "Missions sans prestataire (>30 min)",
          count: stalledMissions ?? 0,
          severity: "high",
          hint: "Risque de perte client",
        });
      }
      if ((failedPayments ?? 0) > 0) {
        signals.push({
          key: "failed-payments",
          label: "Paiements échoués (1h)",
          count: failedPayments ?? 0,
          severity: "critical",
          hint: "Vérifier l'intégration Stripe",
        });
      }
      if ((failedComms ?? 0) > 0) {
        signals.push({
          key: "failed-comms",
          label: "Emails non délivrés (24h)",
          count: failedComms ?? 0,
          severity: "medium",
          hint: "Voir Resend dashboard",
        });
      }
      if ((oldPendingBookings ?? 0) > 0) {
        signals.push({
          key: "old-pending",
          label: "Paniers abandonnés (>24h)",
          count: oldPendingBookings ?? 0,
          severity: "low",
          hint: "Purge automatique programmée",
        });
      }
      if (anomaliesAgg.medium > 0) {
        signals.push({
          key: "anomalies-medium",
          label: "Anomalies moyennes",
          count: anomaliesAgg.medium,
          severity: "medium",
        });
      }

      // ── Calcul score ────────────────────────────────────────
      let score = 100;
      for (const s of signals) {
        const decrement = SEVERITY_WEIGHT[s.severity] * Math.min(s.count, 5);
        score -= decrement;
      }
      score = Math.max(0, Math.min(100, Math.round(score)));

      return {
        score,
        level: levelFromScore(score),
        signals,
        anomalies: anomaliesAgg,
        computedAt: now.toISOString(),
      };
    },
  });
};
