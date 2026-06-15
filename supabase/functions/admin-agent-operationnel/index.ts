import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getAdminCorsHeaders } from '../_shared/cors.ts';

const AO_HOUR_START = 7;
const AO_HOUR_END = 22;

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
      case 'list':   return await listAO(supabase, corsHeaders);
      case 'assign': return await assign(supabase, user, body, corsHeaders, req);
      case 'revoke': return await revoke(supabase, user, body, corsHeaders, req);
      default:
        return err(400, 'Action non reconnue', corsHeaders);
    }
  } catch (e) {
    return err(500, e.message, corsHeaders);
  }
});

function err(status: number, message: string, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function ok(data: unknown, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function isWithinOperatingHours(): boolean {
  const hour = new Date().getUTCHours() + 1; // UTC+1 (Paris)
  return hour >= AO_HOUR_START && hour < AO_HOUR_END;
}

async function listAO(supabase: any, corsHeaders: Record<string, string>) {
  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, created_at')
    .eq('role', 'agent_operationnel')
    .order('created_at', { ascending: false });

  if (!roles?.length) return ok({ agents: [] }, corsHeaders);

  const userIds = roles.map((r: any) => r.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, email')
    .in('user_id', userIds);

  const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));

  const agents = roles.map((r: any) => ({
    userId:     r.user_id,
    assignedAt: r.created_at,
    email:      profileMap[r.user_id]?.email,
    firstName:  profileMap[r.user_id]?.first_name,
    lastName:   profileMap[r.user_id]?.last_name,
  }));

  return ok({ agents }, corsHeaders);
}

async function assign(supabase: any, caller: any, body: any, corsHeaders: Record<string, string>, req: Request) {
  let targetId: string = body.targetUserId ?? '';

  if (!targetId && body.targetEmail) {
    const { data: p } = await supabase
      .from('profiles').select('user_id').eq('email', body.targetEmail).maybeSingle();
    if (!p) return err(404, 'Utilisateur introuvable.', corsHeaders);
    targetId = p.user_id;
  }
  if (!targetId) return err(400, 'targetUserId ou targetEmail requis.', corsHeaders);

  const { data: existing } = await supabase
    .from('user_roles').select('role').eq('user_id', targetId).eq('role', 'agent_operationnel').maybeSingle();
  if (existing) return err(409, 'Cet utilisateur est déjà Agent Opérationnel.', corsHeaders);

  const { error: insertErr } = await supabase
    .from('user_roles').insert({ user_id: targetId, role: 'agent_operationnel' });
  if (insertErr) return err(500, insertErr.message, corsHeaders);

  await logAction(supabase, caller, targetId, 'assign_ao', { role: 'agent_operationnel' }, req);
  return ok({}, corsHeaders);
}

async function revoke(supabase: any, caller: any, body: any, corsHeaders: Record<string, string>, req: Request) {
  const targetId: string = body.targetUserId;
  if (!targetId) return err(400, 'targetUserId requis.', corsHeaders);

  const { error: deleteErr } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', targetId)
    .eq('role', 'agent_operationnel');
  if (deleteErr) return err(500, deleteErr.message, corsHeaders);

  await logAction(supabase, caller, targetId, 'revoke_ao', {}, req);
  return ok({}, corsHeaders);
}

async function logAction(supabase: any, caller: any, targetId: string, actionType: string, newData: unknown, req: Request) {
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
