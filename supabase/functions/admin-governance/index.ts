import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getAdminCorsHeaders } from "../_shared/cors.ts";

// R-GLOBAL-03: Durées d'expiration par rôle
const EXPIRY_MONTHS: Record<string, number | null> = {
  super_admin:          null,  // pas d'expiration
  agent_operationnel:   12,    // 1 an
  comptable_partenaire: 12,    // 1 an
  support_client:       6,     // 6 mois
  moderator:            6,     // 6 mois
};

const ROLE_LABELS: Record<string, string> = {
  agent_operationnel:   'Agent Opérationnel',
  comptable_partenaire: 'Comptable/Partenaire',
  support_client:       'Support Client',
  moderator:            'Modérateur',
};

const STAFF_ROLES = Object.keys(ROLE_LABELS);

serve(async (req) => {
  const corsHeaders = getAdminCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return fail(401, 'Non authentifié', corsHeaders);

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authErr || !user) return fail(401, 'Token invalide', corsHeaders);

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) return fail(403, 'Réservé aux administrateurs', corsHeaders);

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const ua = req.headers.get('user-agent') ?? 'unknown';
    const { action, ...body } = await req.json();

    switch (action) {
      case 'list_all_staff':    return await listAllStaff(supabase, corsHeaders);
      case 'list_expiring':     return await listExpiring(supabase, body, corsHeaders);
      case 'revoke_with_email': return await revokeWithEmail(supabase, user, body, corsHeaders, ip, ua);
      case 'renew':             return await renewRole(supabase, user, body, corsHeaders, ip, ua);
      case 'trigger_incident':  return await triggerIncident(supabase, user, body, corsHeaders, ip, ua);
      case 'list_incidents':    return await listIncidents(supabase, corsHeaders);
      case 'resolve_incident':  return await resolveIncident(supabase, user, body, corsHeaders, ip, ua);
      default: return fail(400, `Action inconnue: ${action}`, corsHeaders);
    }
  } catch (e) {
    console.error('admin-governance error:', e);
    return fail(500, 'Erreur interne', corsHeaders);
  }
});

function ok(data: unknown, cors: Record<string, string>) {
  return new Response(JSON.stringify({ success: true, ...data as object }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function fail(status: number, message: string, cors: Record<string, string>) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

async function log(
  supabase: any, callerId: string, actionType: string,
  entityId: string, data: unknown, ip: string, ua: string
) {
  await supabase.from('admin_actions_log').insert({
    admin_user_id: callerId,
    action_type:   actionType,
    entity_type:   'governance',
    entity_id:     entityId,
    new_data:      data,
    description:   `${actionType} by ${callerId}`,
    ip_address:    ip,
    user_agent:    ua,
  });
}

// Liste tous les collaborateurs actifs (tous rôles staff)
async function listAllStaff(supabase: any, cors: Record<string, string>) {
  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role, created_at, expires_at, charter_signed_at, is_active')
    .in('role', STAFF_ROLES)
    .eq('is_active', true)
    .order('expires_at', { ascending: true, nullsFirst: false });

  if (!roles?.length) return ok({ staff: [] }, cors);

  const userIds = [...new Set(roles.map((r: any) => r.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, email')
    .in('user_id', userIds);

  const byId = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
  const staff = roles.map((r: any) => ({
    userId:          r.user_id,
    role:            r.role,
    roleLabel:       ROLE_LABELS[r.role] ?? r.role,
    assignedAt:      r.created_at,
    expiresAt:       r.expires_at,
    charterSignedAt: r.charter_signed_at,
    email:           byId[r.user_id]?.email,
    firstName:       byId[r.user_id]?.first_name,
    lastName:        byId[r.user_id]?.last_name,
  }));

  return ok({ staff }, cors);
}

// Rôles expirant dans les N prochains jours (défaut 30)
async function listExpiring(supabase: any, body: any, cors: Record<string, string>) {
  const days = body.daysAhead ?? 30;
  const cutoff = new Date(Date.now() + days * 86400000).toISOString();

  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role, expires_at')
    .in('role', STAFF_ROLES)
    .eq('is_active', true)
    .not('expires_at', 'is', null)
    .lte('expires_at', cutoff)
    .order('expires_at', { ascending: true });

  if (!roles?.length) return ok({ expiring: [] }, cors);

  const userIds = [...new Set(roles.map((r: any) => r.user_id))];
  const { data: profiles } = await supabase
    .from('profiles').select('user_id, email, first_name, last_name').in('user_id', userIds);
  const byId = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));

  return ok({
    expiring: roles.map((r: any) => ({
      userId: r.user_id, role: r.role,
      roleLabel: ROLE_LABELS[r.role] ?? r.role,
      expiresAt: r.expires_at, ...byId[r.user_id],
    })),
  }, cors);
}

// R-GLOBAL-04: Révocation immédiate + email de notification
async function revokeWithEmail(
  supabase: any, caller: any, body: any,
  cors: Record<string, string>, ip: string, ua: string
) {
  const { userId, role, reason } = body;
  if (!userId || !role) return fail(400, 'userId et role requis', cors);
  if (!STAFF_ROLES.includes(role)) return fail(400, 'Rôle non reconnu', cors);

  // Pour renouveler CP, seul SA peut le faire
  if (role === 'comptable_partenaire') {
    const { data: isSA } = await supabase.rpc('has_role', { _user_id: caller.id, _role: 'super_admin' });
    if (!isSA) {
      // Admin non-SA peut quand même révoquer CP
    }
  }

  const { data: profile } = await supabase
    .from('profiles').select('email, first_name, last_name').eq('user_id', userId).maybeSingle();

  // Soft delete (R-GLOBAL-04: is_active = false, effet immédiat)
  const { error: revokeErr } = await supabase
    .from('user_roles')
    .update({ is_active: false, revocation_reason: reason ?? 'Révoqué par admin' })
    .eq('user_id', userId)
    .eq('role', role)
    .eq('is_active', true);
  if (revokeErr) return fail(500, revokeErr.message, cors);

  // R-GLOBAL-04: Email de notification à l'utilisateur
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (resendKey && profile?.email) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Bikawo Admin <contact@bikawo.com>',
        to: [profile.email],
        subject: 'Votre accès collaborateur Bikawo a été révoqué',
        text: [
          `Bonjour ${profile.first_name ?? ''},`,
          '',
          `Votre accès en tant que ${ROLE_LABELS[role] ?? role} sur la plateforme Bikawo a été révoqué.`,
          reason ? `Motif : ${reason}` : '',
          '',
          "Si vous pensez qu'il s'agit d'une erreur, contactez votre administrateur.",
          '',
          "L'équipe Bikawo",
        ].filter(l => l !== undefined).join('\n'),
      }),
    }).catch(() => {}); // email non-bloquant
  }

  await log(supabase, caller.id, `revoke_${role}`, userId, { reason, email: profile?.email }, ip, ua);
  return ok({}, cors);
}

// R-GLOBAL-03: Renouvellement d'un accès (SA obligatoire pour CP)
async function renewRole(
  supabase: any, caller: any, body: any,
  cors: Record<string, string>, ip: string, ua: string
) {
  const { userId, role, months } = body;
  if (!userId || !role) return fail(400, 'userId et role requis', cors);

  // R-GLOBAL-03: renouvellement CP par SA uniquement
  if (role === 'comptable_partenaire') {
    const { data: isSA } = await supabase.rpc('has_role', { _user_id: caller.id, _role: 'super_admin' });
    if (!isSA) return fail(403, 'Le renouvellement CP est réservé au Super Admin (R-GLOBAL-03)', cors);
  }

  const renewMonths = months ?? (EXPIRY_MONTHS[role] ?? 12);
  const newExpiry = new Date();
  newExpiry.setMonth(newExpiry.getMonth() + renewMonths);

  const { error } = await supabase
    .from('user_roles')
    .update({ expires_at: newExpiry.toISOString() })
    .eq('user_id', userId)
    .eq('role', role)
    .eq('is_active', true);
  if (error) return fail(500, error.message, cors);

  await log(supabase, caller.id, `renew_${role}`, userId, { months: renewMonths, newExpiry }, ip, ua);
  return ok({ newExpiry: newExpiry.toISOString() }, cors);
}

// R-GLOBAL-06: Incident → révocation immédiate + enregistrement + notification SA
async function triggerIncident(
  supabase: any, caller: any, body: any,
  cors: Record<string, string>, ip: string, ua: string
) {
  const { targetUserId, description, severity = 'high' } = body;
  if (!targetUserId || !description?.trim()) {
    return fail(400, 'targetUserId et description requis', cors);
  }

  // Révoquer tous les rôles staff actifs de la cible
  const { data: activeRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', targetUserId)
    .in('role', STAFF_ROLES)
    .eq('is_active', true);

  if (activeRoles?.length) {
    await supabase.from('user_roles')
      .update({ is_active: false, revocation_reason: `INCIDENT R-GLOBAL-06: ${description}` })
      .eq('user_id', targetUserId)
      .in('role', STAFF_ROLES)
      .eq('is_active', true);
  }

  // Enregistrer l'incident
  const { data: incident } = await supabase
    .from('governance_incidents')
    .insert({ reported_by: caller.id, target_user_id: targetUserId, description, severity })
    .select('id').single();

  // Notification admin SA
  const { data: saRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'super_admin')
    .eq('is_active', true);

  if (saRoles?.length) {
    await supabase.from('notifications').insert(
      saRoles.map((r: any) => ({
        user_id: r.user_id,
        title: `⚠️ INCIDENT SÉCURITÉ (${severity.toUpperCase()})`,
        message: description,
        type: 'security_incident',
        read: false,
      }))
    );
  }

  await log(supabase, caller.id, 'trigger_incident', targetUserId,
    { incidentId: incident?.id, severity, revokedRoles: activeRoles?.map((r: any) => r.role) }, ip, ua);

  return ok({ incidentId: incident?.id }, cors);
}

async function listIncidents(supabase: any, cors: Record<string, string>) {
  const { data, error } = await supabase
    .from('governance_incidents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return fail(500, error.message, cors);
  return ok({ incidents: data ?? [] }, cors);
}

async function resolveIncident(
  supabase: any, caller: any, body: any,
  cors: Record<string, string>, ip: string, ua: string
) {
  const { incidentId, status, resolution } = body;
  if (!incidentId || !status) return fail(400, 'incidentId et status requis', cors);

  const { error } = await supabase
    .from('governance_incidents')
    .update({
      status,
      actions_taken: resolution,
      resolved_by:  caller.id,
      resolved_at:  new Date().toISOString(),
    })
    .eq('id', incidentId);
  if (error) return fail(500, error.message, cors);

  await log(supabase, caller.id, 'resolve_incident', incidentId, { status, resolution }, ip, ua);
  return ok({}, cors);
}
