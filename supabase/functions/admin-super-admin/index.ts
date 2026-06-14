import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getAdminCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getAdminCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Accès refusé' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: isSuperAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'super_admin' });
    const body = await req.json();

    switch (body.action) {
      case 'get_status':   return await getStatus(supabase, corsHeaders);
      case 'promote':      return await promote(supabase, user, isSuperAdmin, body, corsHeaders, req);
      case 'update_review':
        if (!isSuperAdmin) return forbidden(corsHeaders);
        return await updateGovernance(supabase, user, { last_review_at: new Date().toISOString() }, corsHeaders, 'governance_review');
      case 'update_pw_change':
        if (!isSuperAdmin) return forbidden(corsHeaders);
        return await updateGovernance(supabase, user, { last_pw_change_at: new Date().toISOString() }, corsHeaders, 'governance_pw_change');
      default:
        return new Response(JSON.stringify({ error: 'Action non reconnue' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function forbidden(corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: 'Réservé au Super Admin' }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function ok(data: unknown, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ success: true, ...data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getStatus(supabase: any, corsHeaders: Record<string, string>) {
  const { data: role } = await supabase
    .from('user_roles').select('user_id, created_at').eq('role', 'super_admin').maybeSingle();

  if (!role) return ok({ superAdmin: null }, corsHeaders);

  const [{ data: profile }, { data: gov }, { data: authData }] = await Promise.all([
    supabase.from('profiles').select('first_name, last_name, email').eq('user_id', role.user_id).maybeSingle(),
    supabase.from('super_admin_governance').select('*').eq('user_id', role.user_id).maybeSingle(),
    supabase.auth.admin.getUserById(role.user_id),
  ]);

  const mfaEnrolled = (authData?.user?.factors || []).some(
    (f: any) => f.factor_type === 'totp' && f.status === 'verified'
  );
  const now = Date.now();
  const daysSinceReview = gov?.last_review_at
    ? Math.floor((now - new Date(gov.last_review_at).getTime()) / 86400000) : null;
  const daysSincePwChange = gov?.last_pw_change_at
    ? Math.floor((now - new Date(gov.last_pw_change_at).getTime()) / 86400000) : null;

  return ok({
    superAdmin: {
      userId:          role.user_id,
      email:           profile?.email,
      firstName:       profile?.first_name,
      lastName:        profile?.last_name,
      promotedAt:      role.created_at,
      mfaEnrolled,
      lastReviewAt:    gov?.last_review_at    ?? null,
      daysSinceReview,
      lastPwChangeAt:  gov?.last_pw_change_at ?? null,
      daysSincePwChange,
      compliance: {
        r_sa_01: true,
        r_sa_02: mfaEnrolled,
        r_sa_03: true,
        r_sa_04: true,
        r_sa_05: daysSinceReview !== null && daysSinceReview <= 30,
        r_sa_06: daysSincePwChange !== null && daysSincePwChange <= 90,
      },
    },
  }, corsHeaders);
}

async function promote(supabase: any, caller: any, isSuperAdmin: boolean, body: any, corsHeaders: Record<string, string>, req: Request) {
  const { data: existing } = await supabase
    .from('user_roles').select('user_id').eq('role', 'super_admin').maybeSingle();

  if (existing && !isSuperAdmin) {
    return new Response(JSON.stringify({ error: 'Seul le Super Admin peut désigner un successeur.' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let targetId: string = body.targetUserId ?? '';
  if (!targetId && body.targetEmail) {
    const { data: p } = await supabase.from('profiles').select('user_id').eq('email', body.targetEmail).maybeSingle();
    if (!p) return new Response(JSON.stringify({ error: 'Utilisateur introuvable.' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    targetId = p.user_id;
  }
  if (!targetId) return new Response(JSON.stringify({ error: 'targetUserId ou targetEmail requis.' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (targetId === caller.id) return new Response(JSON.stringify({ error: 'Auto-promotion interdite.' }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  // Delete existing super_admin entry before inserting new one (trigger constraint)
  if (existing) {
    await supabase.from('user_roles').delete().eq('role', 'super_admin');
  }

  const { error: insertErr } = await supabase.from('user_roles').insert({ user_id: targetId, role: 'super_admin' });
  if (insertErr) return new Response(JSON.stringify({ error: insertErr.message }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  await supabase.from('super_admin_governance')
    .upsert({ user_id: targetId, last_pw_change_at: new Date().toISOString(), updated_at: new Date().toISOString() });

  await supabase.from('admin_actions_log').insert({
    admin_user_id: caller.id,
    entity_type: 'user_roles',
    entity_id: targetId,
    action_type: 'promote_super_admin',
    new_data: { role: 'super_admin', target_user_id: targetId },
    description: `Super Admin promu par ${caller.email}`,
    ip_address: req.headers.get('x-forwarded-for'),
    user_agent: req.headers.get('user-agent'),
  });

  return ok({}, corsHeaders);
}

async function updateGovernance(supabase: any, user: any, patch: Record<string, string>, corsHeaders: Record<string, string>, actionType: string) {
  await supabase.from('super_admin_governance')
    .upsert({ user_id: user.id, ...patch, updated_at: new Date().toISOString() });
  await supabase.from('admin_actions_log').insert({
    admin_user_id: user.id,
    entity_type: 'super_admin_governance',
    entity_id: user.id,
    action_type: actionType,
    description: `${actionType} par ${user.email}`,
  });
  return ok({}, corsHeaders);
}
