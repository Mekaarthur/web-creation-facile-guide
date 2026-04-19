import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'info';
export type AnomalyCategory =
  | 'system'
  | 'mission'
  | 'compliance'
  | 'security'
  | 'business'
  | 'communication';

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

/**
 * Centre d'anomalies — agrège toutes les détections sur une seule vue admin.
 * Refresh auto 30s.
 */
export const useAnomaliesCenter = () => {
  return useQuery({
    queryKey: ['anomalies-center'],
    queryFn: async (): Promise<Anomaly[]> => {
      const now = new Date();
      const nowIso = now.toISOString();
      const cutoff2h = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const cutoff7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const cutoff60d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const in30dIso = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        systemAlertsRes,
        failedEmailsRes,
        expiredCartsRes,
        pendingBookingsRes,
        unassignedMissionsRes,
        openComplaintsRes,
        oldUnreadMessagesRes,
        unmoderatedReviewsRes,
        unpaidInvoicesRes,
        inactiveProvidersRes,
        expiredCounterPropsRes,
        unresolvedIncidentsRes,
        escalatedChatbotRes,
        novaExpiredRes,
        novaExpiringRes,
        urssafErrorsRes,
        rejectedDocsRes,
        pendingDocsOldRes,
        expiredAttestationsRes,
        inactiveBinomesRes,
        oldOpenComplaintsRes,
        unrespondedMissionsRes,
      ] = await Promise.all([
        supabase
          .from('system_alerts')
          .select('id, severity, title, message, created_at, alert_type')
          .eq('resolved', false)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('communications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'erreur')
          .lt('retry_count', 3),
        supabase
          .from('carts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .lt('expires_at', nowIso),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .lt('created_at', cutoff2h),
        supabase
          .from('missions_without_providers_in_zone')
          .select('booking_id', { count: 'exact', head: true }),
        supabase
          .from('complaints')
          .select('id', { count: 'exact', head: true })
          .in('status', ['open', 'in_progress']),
        supabase
          .from('internal_messages')
          .select('id', { count: 'exact', head: true })
          .eq('is_read', false)
          .lt('created_at', cutoff24h),
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('is_approved', false),
        supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .lt('due_date', nowIso),
        supabase
          .from('providers')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .or(`last_mission_date.is.null,last_mission_date.lt.${cutoff30d}`),
        supabase
          .from('counter_proposals')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .lt('expires_at', nowIso),
        supabase
          .from('incidents')
          .select('id', { count: 'exact', head: true })
          .in('status', ['open', 'investigating'])
          .eq('severity', 'high'),
        supabase
          .from('chatbot_conversations')
          .select('id', { count: 'exact', head: true })
          .eq('escalated_to_human', true)
          .is('resolved_at', null),
        // Nova expiré sur prestataires actifs
        supabase
          .from('providers')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .not('nova_expires_at', 'is', null)
          .lt('nova_expires_at', nowIso),
        // Nova expirant dans les 30j
        supabase
          .from('providers')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('nova_expires_at', nowIso)
          .lt('nova_expires_at', in30dIso),
        // URSSAF en erreur
        supabase
          .from('urssaf_declarations')
          .select('id', { count: 'exact', head: true })
          .in('status', ['error', 'rejected', 'failed']),
        // Documents prestataires rejetés non remplacés
        supabase
          .from('provider_documents')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'rejected'),
        // Documents en attente de validation depuis +7j
        supabase
          .from('provider_documents')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .lt('upload_date', cutoff7d),
        // Attestations Nova expirées
        supabase
          .from('provider_attestations')
          .select('id', { count: 'exact', head: true })
          .not('expiry_date', 'is', null)
          .lt('expiry_date', nowIso),
        // Binômes inactifs (aucune mission depuis 60j)
        supabase
          .from('binomes')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .or(`last_mission_date.is.null,last_mission_date.lt.${cutoff60d}`),
        // Réclamations sans réponse depuis +24h
        supabase
          .from('complaints')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'open')
          .lt('created_at', cutoff24h),
        // Missions confirmées sans assignation provider depuis +1h (pas dans le statut pending)
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'confirmed')
          .is('assigned_at', null)
          .lt('created_at', cutoff2h),
      ]);


      const anomalies: Anomaly[] = [];

      // 1. Alertes système (severity native)
      (systemAlertsRes.data || []).forEach((a: any) => {
        const sev: AnomalySeverity =
          a.severity === 'critical'
            ? 'critical'
            : a.severity === 'high'
            ? 'high'
            : a.severity === 'medium'
            ? 'medium'
            : 'info';
        anomalies.push({
          id: `sys-${a.id}`,
          severity: sev,
          category: 'system',
          title: a.title,
          description: a.message,
          detectedAt: a.created_at,
          actionLabel: 'Voir alertes',
          actionHref: '/modern-admin/alerts',
        });
      });

      const push = (
        cond: boolean,
        a: Omit<Anomaly, 'detectedAt'> & { detectedAt?: string }
      ) => {
        if (cond) anomalies.push({ ...a, detectedAt: a.detectedAt || nowIso });
      };

      // 2. Anomalies agrégées
      push((failedEmailsRes.count || 0) > 0, {
        id: 'failed-emails',
        severity: (failedEmailsRes.count || 0) > 5 ? 'high' : 'medium',
        category: 'communication',
        title: 'Emails en échec',
        description: `${failedEmailsRes.count} email(s) n'ont pas pu être délivrés (retry < 3).`,
        count: failedEmailsRes.count || 0,
        actionLabel: 'Voir tests emails',
        actionHref: '/modern-admin/tests-emails',
      });

      push((expiredCartsRes.count || 0) > 0, {
        id: 'abandoned-carts',
        severity: 'medium',
        category: 'business',
        title: 'Paniers abandonnés',
        description: `${expiredCartsRes.count} panier(s) actif(s) ont expiré sans paiement.`,
        count: expiredCartsRes.count || 0,
        actionLabel: 'Analyser',
        actionHref: '/modern-admin/reports',
      });

      push((pendingBookingsRes.count || 0) > 0, {
        id: 'pending-bookings',
        severity: 'high',
        category: 'business',
        title: 'Réservations non payées (>2h)',
        description: `${pendingBookingsRes.count} réservation(s) en attente de paiement depuis plus de 2h.`,
        count: pendingBookingsRes.count || 0,
        actionLabel: 'Voir réservations',
        actionHref: '/modern-admin/reservations',
      });

      push((unassignedMissionsRes.count || 0) > 0, {
        id: 'unassigned-missions',
        severity: 'critical',
        category: 'mission',
        title: 'Missions sans prestataire dans la zone',
        description: `${unassignedMissionsRes.count} mission(s) confirmée(s) sans prestataire couvrant la zone.`,
        count: unassignedMissionsRes.count || 0,
        actionLabel: 'Assigner',
        actionHref: '/modern-admin/missions',
      });

      push((openComplaintsRes.count || 0) > 0, {
        id: 'open-complaints',
        severity: (openComplaintsRes.count || 0) > 10 ? 'critical' : 'high',
        category: 'business',
        title: 'Réclamations ouvertes',
        description: `${openComplaintsRes.count} réclamation(s) en attente de traitement.`,
        count: openComplaintsRes.count || 0,
        actionLabel: 'Traiter',
        actionHref: '/modern-admin/reclamations',
      });

      push((oldUnreadMessagesRes.count || 0) > 0, {
        id: 'old-messages',
        severity: 'medium',
        category: 'communication',
        title: 'Messages non lus (>24h)',
        description: `${oldUnreadMessagesRes.count} message(s) internes non lus depuis plus de 24h.`,
        count: oldUnreadMessagesRes.count || 0,
        actionLabel: 'Lire',
        actionHref: '/modern-admin/messages',
      });

      push((unmoderatedReviewsRes.count || 0) > 0, {
        id: 'unmoderated-reviews',
        severity: 'medium',
        category: 'security',
        title: 'Avis à modérer',
        description: `${unmoderatedReviewsRes.count} avis client en attente de modération.`,
        count: unmoderatedReviewsRes.count || 0,
        actionLabel: 'Modérer',
        actionHref: '/modern-admin/reviews',
      });

      push((unpaidInvoicesRes.count || 0) > 0, {
        id: 'unpaid-invoices',
        severity: 'high',
        category: 'business',
        title: 'Factures impayées en retard',
        description: `${unpaidInvoicesRes.count} facture(s) au-delà de leur date d'échéance.`,
        count: unpaidInvoicesRes.count || 0,
        actionLabel: 'Voir factures',
        actionHref: '/modern-admin/invoices',
      });

      push((inactiveProvidersRes.count || 0) > 0, {
        id: 'inactive-providers',
        severity: 'info',
        category: 'business',
        title: 'Prestataires inactifs (>30j)',
        description: `${inactiveProvidersRes.count} prestataire(s) actif(s) sans mission depuis plus de 30 jours.`,
        count: inactiveProvidersRes.count || 0,
        actionLabel: 'Relancer',
        actionHref: '/modern-admin/providers',
      });

      push((expiredCounterPropsRes.count || 0) > 0, {
        id: 'expired-counter-props',
        severity: 'medium',
        category: 'mission',
        title: 'Contre-propositions expirées',
        description: `${expiredCounterPropsRes.count} contre-proposition(s) sans réponse au-delà du délai.`,
        count: expiredCounterPropsRes.count || 0,
        actionLabel: 'Voir',
        actionHref: '/modern-admin/missions',
      });

      push((unresolvedIncidentsRes.count || 0) > 0, {
        id: 'high-incidents',
        severity: 'critical',
        category: 'security',
        title: 'Incidents critiques non résolus',
        description: `${unresolvedIncidentsRes.count} incident(s) de haute sévérité ouverts.`,
        count: unresolvedIncidentsRes.count || 0,
        actionLabel: 'Résoudre',
        actionHref: '/modern-admin/urgences',
      });

      push((escalatedChatbotRes.count || 0) > 0, {
        id: 'chatbot-escalated',
        severity: 'high',
        category: 'communication',
        title: 'Conversations chatbot escaladées',
        description: `${escalatedChatbotRes.count} conversation(s) en attente d'un agent humain.`,
        count: escalatedChatbotRes.count || 0,
        actionLabel: 'Répondre',
        actionHref: '/modern-admin/messages',
      });

      // Tri : sévérité puis date
      anomalies.sort((a, b) => {
        const w = sevWeight[a.severity] - sevWeight[b.severity];
        if (w !== 0) return w;
        return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
      });

      return anomalies;
    },
    refetchInterval: 30 * 1000, // 30s
    staleTime: 15 * 1000,
  });
};
