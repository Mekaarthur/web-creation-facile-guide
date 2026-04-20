import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COOLDOWN_HOURS = 6;

type Sev = 'critical' | 'high' | 'medium' | 'info';
interface Anom {
  key: string;
  severity: Sev;
  category: string;
  title: string;
  description: string;
  count: number;
  actionHref?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();
    const nowIso = now.toISOString();
    const cutoff2h = new Date(now.getTime() - 2 * 3600_000).toISOString();
    const cutoff24h = new Date(now.getTime() - 24 * 3600_000).toISOString();
    const cutoff7d = new Date(now.getTime() - 7 * 24 * 3600_000).toISOString();

    // ============ DÉTECTIONS (uniquement critical & high) ============
    const checks = await Promise.all([
      supabase.from('missions_without_providers_in_zone').select('booking_id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true })
        .eq('status', 'confirmed').is('assigned_at', null).lt('created_at', cutoff2h),
      supabase.from('bookings').select('id', { count: 'exact', head: true })
        .eq('status', 'pending').lt('created_at', cutoff2h),
      supabase.from('complaints').select('id', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']),
      supabase.from('complaints').select('id', { count: 'exact', head: true })
        .eq('status', 'open').lt('created_at', cutoff24h),
      supabase.from('incidents').select('id', { count: 'exact', head: true })
        .in('status', ['open', 'investigating']).eq('severity', 'high'),
      supabase.from('providers').select('id', { count: 'exact', head: true })
        .eq('status', 'active').not('nova_expires_at', 'is', null).lt('nova_expires_at', nowIso),
      supabase.from('urssaf_declarations').select('id', { count: 'exact', head: true })
        .in('status', ['error', 'rejected', 'failed']),
      supabase.from('provider_documents').select('id', { count: 'exact', head: true })
        .eq('status', 'pending').lt('upload_date', cutoff7d),
      supabase.from('provider_attestations').select('id', { count: 'exact', head: true })
        .not('expiry_date', 'is', null).lt('expiry_date', nowIso),
      supabase.from('communications').select('id', { count: 'exact', head: true })
        .eq('status', 'erreur').lt('retry_count', 3),
      supabase.from('invoices').select('id', { count: 'exact', head: true })
        .eq('status', 'pending').lt('due_date', nowIso),
      supabase.from('chatbot_conversations').select('id', { count: 'exact', head: true })
        .eq('escalated_to_human', true).is('resolved_at', null),
      supabase.from('system_alerts').select('id, severity, title, message', { count: 'exact' })
        .eq('resolved', false).in('severity', ['critical', 'high']).limit(20),
    ]);

    const [
      unassignedZone, unassignedConfirmed, unpaidBookings, openComplaints,
      oldComplaints, criticalIncidents, novaExpired, urssafErrors,
      pendingDocsOld, expiredAttestations, failedEmails, unpaidInvoices,
      chatbotEscalated, systemAlerts,
    ] = checks;

    const candidates: Anom[] = [];

    const add = (
      key: string, severity: Sev, category: string, title: string,
      tpl: (n: number) => string, count: number, actionHref?: string
    ) => {
      if (count > 0) candidates.push({
        key, severity, category, title,
        description: tpl(count), count, actionHref,
      });
    };

    add('unassigned-zone', 'critical', 'mission', 'Missions sans prestataire dans la zone',
      (n) => `${n} mission(s) confirmée(s) sans prestataire couvrant la zone.`,
      unassignedZone.count || 0, '/modern-admin/missions');
    add('unassigned-confirmed', 'critical', 'mission', 'Missions confirmées non assignées (>2h)',
      (n) => `${n} mission(s) confirmée(s) sans prestataire assigné depuis +2h.`,
      unassignedConfirmed.count || 0, '/modern-admin/missions');
    add('nova-expired', 'critical', 'compliance', 'Agréments Nova expirés',
      (n) => `${n} prestataire(s) actif(s) avec Nova expiré — bloquer immédiatement.`,
      novaExpired.count || 0, '/modern-admin/providers');
    add('critical-incidents', 'critical', 'security', 'Incidents critiques non résolus',
      (n) => `${n} incident(s) de haute sévérité ouverts.`,
      criticalIncidents.count || 0, '/modern-admin/urgences');
    add('old-complaints', 'critical', 'business', 'Réclamations sans réponse >24h',
      (n) => `${n} réclamation(s) ouverte(s) sans traitement depuis +24h.`,
      oldComplaints.count || 0, '/modern-admin/reclamations');

    add('unpaid-bookings', 'high', 'business', 'Réservations non payées (>2h)',
      (n) => `${n} réservation(s) en attente de paiement depuis +2h.`,
      unpaidBookings.count || 0, '/modern-admin/reservations');
    add('open-complaints', 'high', 'business', 'Réclamations ouvertes',
      (n) => `${n} réclamation(s) en attente de traitement.`,
      openComplaints.count || 0, '/modern-admin/reclamations');
    add('urssaf-errors', 'high', 'compliance', 'Déclarations URSSAF en erreur',
      (n) => `${n} déclaration(s) URSSAF rejetée(s) ou en échec.`,
      urssafErrors.count || 0, '/modern-admin/urssaf-declarations');
    add('pending-docs-old', 'high', 'compliance', 'Documents en attente >7j',
      (n) => `${n} document(s) à valider depuis plus de 7 jours.`,
      pendingDocsOld.count || 0, '/modern-admin/applications');
    add('expired-attestations', 'high', 'compliance', 'Attestations officielles expirées',
      (n) => `${n} attestation(s) prestataire au-delà de leur expiration.`,
      expiredAttestations.count || 0, '/modern-admin/providers');
    add('failed-emails', 'high', 'communication', 'Emails en échec',
      (n) => `${n} email(s) non délivrés (retry < 3).`,
      failedEmails.count || 0, '/modern-admin/tests-emails');
    add('unpaid-invoices', 'high', 'business', 'Factures impayées en retard',
      (n) => `${n} facture(s) au-delà de leur date d'échéance.`,
      unpaidInvoices.count || 0, '/modern-admin/invoices');
    add('chatbot-escalated', 'high', 'communication', 'Conversations chatbot escaladées',
      (n) => `${n} conversation(s) en attente d'un agent humain.`,
      chatbotEscalated.count || 0, '/modern-admin/messages');

    (systemAlerts.data || []).forEach((a: any) => {
      candidates.push({
        key: `sys-alert-${a.id}`,
        severity: a.severity === 'critical' ? 'critical' : 'high',
        category: 'system',
        title: a.title,
        description: a.message,
        count: 1,
        actionHref: '/modern-admin/alerts',
      });
    });

    // ============ FILTRER selon cooldown ============
    const cooldownIso = new Date(now.getTime() - COOLDOWN_HOURS * 3600_000).toISOString();
    const keys = candidates.map((c) => c.key);

    const { data: alreadySent } = await supabase
      .from('anomaly_alerts_sent')
      .select('anomaly_key, last_sent_at')
      .in('anomaly_key', keys)
      .gte('last_sent_at', cooldownIso);

    const blocked = new Set((alreadySent || []).map((r: any) => r.anomaly_key));
    const toAlert = candidates.filter((c) => !blocked.has(c.key));

    if (toAlert.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, candidates: candidates.length, blocked: blocked.size }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============ Récupérer admins ============
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    const adminIds = (adminRoles || []).map((r: any) => r.user_id);
    if (adminIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Aucun admin trouvé' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('email')
      .in('user_id', adminIds);

    const adminEmails = Array.from(new Set(
      (profiles || []).map((p: any) => p.email).filter(Boolean)
    ));

    if (adminEmails.length === 0) {
      adminEmails.push('contact@bikawo.com');
    }

    // ============ Construire l'email ============
    const critical = toAlert.filter((a) => a.severity === 'critical');
    const high = toAlert.filter((a) => a.severity === 'high');

    const baseUrl = 'https://bikawo.com';
    const renderRow = (a: Anom) => {
      const color = a.severity === 'critical' ? '#dc2626' : '#ea580c';
      const label = a.severity === 'critical' ? 'CRITIQUE' : 'ÉLEVÉ';
      const link = a.actionHref ? `${baseUrl}${a.actionHref}` : baseUrl;
      return `
        <tr>
          <td style="padding:14px;border-bottom:1px solid #e5e7eb;vertical-align:top;">
            <span style="display:inline-block;background:${color};color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:0.5px;">${label}</span>
          </td>
          <td style="padding:14px;border-bottom:1px solid #e5e7eb;">
            <div style="font-weight:600;color:#0f172a;font-size:14px;margin-bottom:4px;">${a.title}</div>
            <div style="color:#475569;font-size:13px;line-height:1.5;">${a.description}</div>
            <a href="${link}" style="display:inline-block;margin-top:8px;color:#2563eb;font-size:12px;text-decoration:none;font-weight:500;">→ Accéder à la page</a>
          </td>
        </tr>`;
    };

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#fff;">
    <div style="background:linear-gradient(135deg,#dc2626,#ea580c);color:#fff;padding:24px;">
      <div style="font-size:13px;opacity:0.9;letter-spacing:1px;">BIKAWO · CENTRE D'ANOMALIES</div>
      <div style="font-size:22px;font-weight:700;margin-top:6px;">⚠️ ${toAlert.length} nouvelle(s) anomalie(s) détectée(s)</div>
      <div style="font-size:13px;opacity:0.9;margin-top:6px;">${critical.length} critique(s) · ${high.length} élevée(s)</div>
    </div>

    <div style="padding:24px;">
      <p style="color:#334155;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Le système de surveillance automatique a détecté de nouvelles anomalies nécessitant votre attention.
      </p>

      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        ${toAlert.map(renderRow).join('')}
      </table>

      <div style="margin-top:24px;text-align:center;">
        <a href="${baseUrl}/modern-admin/anomalies"
           style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
          Ouvrir le Centre d'anomalies
        </a>
      </div>

      <p style="color:#94a3b8;font-size:12px;margin-top:24px;line-height:1.5;text-align:center;">
        Cooldown anti-spam : chaque type d'anomalie est notifié au maximum une fois toutes les ${COOLDOWN_HOURS}h.<br/>
        Email automatique — Bikawo Surveillance
      </p>
    </div>
  </div>
</body></html>`;

    // ============ Envoi via Resend ============
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'RESEND_API_KEY manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subject = critical.length > 0
      ? `🚨 [Bikawo] ${critical.length} anomalie(s) CRITIQUE(S) détectée(s)`
      : `⚠️ [Bikawo] ${high.length} anomalie(s) élevée(s) détectée(s)`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Bikawo Alertes <contact@bikawo.com>',
        to: adminEmails,
        subject,
        html,
      }),
    });

    const emailData = await emailRes.json();
    if (!emailRes.ok) {
      console.error('Resend error:', emailData);
      return new Response(
        JSON.stringify({ success: false, error: emailData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============ Enregistrer envois ============
    const upserts = toAlert.map((a) => ({
      anomaly_key: a.key,
      severity: a.severity,
      category: a.category,
      count_at_send: a.count,
      last_sent_at: nowIso,
      send_count: 1,
    }));

    await supabase.from('anomaly_alerts_sent').upsert(upserts, {
      onConflict: 'anomaly_key',
      ignoreDuplicates: false,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sent: toAlert.length,
        critical: critical.length,
        high: high.length,
        recipients: adminEmails.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('send-anomaly-alerts error:', e);
    return new Response(
      JSON.stringify({ success: false, error: e?.message || 'Erreur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
