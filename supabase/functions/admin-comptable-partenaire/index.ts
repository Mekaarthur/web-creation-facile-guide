import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getAdminCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getAdminCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return err(401, 'Non authentifié', corsHeaders);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) return err(401, 'Token invalide', corsHeaders);

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) return err(403, 'Réservé aux administrateurs', corsHeaders);

    const body = await req.json();

    switch (body.action) {
      case 'list':   return await listCP(supabase, corsHeaders);
      case 'assign': return await assign(supabase, user, body, corsHeaders, req);
      case 'revoke': return await revoke(supabase, user, body, corsHeaders, req);
      default:       return err(400, 'Action non reconnue', corsHeaders);
    }
  } catch (e) {
    return err(500, e.message, corsHeaders);
  }
});

function err(status: number, message: string, h: Record<string, string>) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...h, 'Content-Type': 'application/json' }
  });
}

function ok(data: unknown, h: Record<string, string>) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    headers: { ...h, 'Content-Type': 'application/json' }
  });
}

async function listCP(supabase: any, h: Record<string, string>) {
  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, created_at')
    .eq('role', 'comptable_partenaire')
    .order('created_at', { ascending: false });

  if (!roles?.length) return ok({ comptables: [] }, h);

  const userIds = roles.map((r: any) => r.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, email')
    .in('user_id', userIds);

  const map = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));

  return ok({
    comptables: roles.map((r: any) => ({
      userId:     r.user_id,
      assignedAt: r.created_at,
      email:      map[r.user_id]?.email,
      firstName:  map[r.user_id]?.first_name,
      lastName:   map[r.user_id]?.last_name,
    })),
  }, h);
}

async function assign(supabase: any, caller: any, body: any, h: Record<string, string>, req: Request) {
  let targetId: string = body.targetUserId ?? '';
  if (!targetId && body.targetEmail) {
    const { data: p } = await supabase.from('profiles').select('user_id').eq('email', body.targetEmail).maybeSingle();
    if (!p) return err(404, 'Utilisateur introuvable.', h);
    targetId = p.user_id;
  }
  if (!targetId) return err(400, 'targetUserId ou targetEmail requis.', h);

  const { data: existing } = await supabase
    .from('user_roles').select('role').eq('user_id', targetId).eq('role', 'comptable_partenaire').maybeSingle();
  if (existing) return err(409, 'Cet utilisateur est déjà Comptable/Partenaire.', h);

  const { error: insertErr } = await supabase.from('user_roles').insert({ user_id: targetId, role: 'comptable_partenaire' });
  if (insertErr) return err(500, insertErr.message, h);

  await log(supabase, caller, targetId, 'assign_cp', { role: 'comptable_partenaire' }, req);
  return ok({}, h);
}

async function revoke(supabase: any, caller: any, body: any, h: Record<string, string>, req: Request) {
  const targetId: string = body.targetUserId;
  if (!targetId) return err(400, 'targetUserId requis.', h);

  const { error: deleteErr } = await supabase
    .from('user_roles').delete().eq('user_id', targetId).eq('role', 'comptable_partenaire');
  if (deleteErr) return err(500, deleteErr.message, h);

  await log(supabase, caller, targetId, 'revoke_cp', {}, req);
  return ok({}, h);
}

async function log(supabase: any, caller: any, targetId: string, actionType: string, newData: unknown, req: Request) {
  await supabase.from('admin_actions_log').insert({
    admin_user_id: caller.id,
    entity_type:   'user_roles',
    entity_id:     targetId,
    action_type:   actionType,
    new_data:      newData,
    description:   `${actionType} par ${caller.email}`,
    ip_address:    req.headers.get('x-forwarded-for'),
    user_agent:    req.headers.get('user-agent'),
  });
}
