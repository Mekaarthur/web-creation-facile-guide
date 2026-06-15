import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getAdminCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getAdminCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return fail(401, "Non authentifie", corsHeaders);

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user) return fail(401, "Token invalide", corsHeaders);

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id, _role: "admin",
    });
    if (!isAdmin) return fail(403, "Acces reserve aux administrateurs", corsHeaders);

    const { action, ...body } = await req.json();

    switch (action) {
      case "list_agents":          return await listAgents(supabase, corsHeaders);
      case "assign":               return await assignSC(supabase, user, body, corsHeaders, req);
      case "revoke":               return await revokeSC(supabase, user, body, corsHeaders, req);
      case "list_escalations":     return await listEscalations(supabase, corsHeaders);
      case "approve_escalation":   return await approveEscalation(supabase, user, body, corsHeaders);
      case "reject_escalation":    return await rejectEscalation(supabase, user, body, corsHeaders);
      default: return fail(400, `Action inconnue: ${action}`, corsHeaders);
    }
  } catch (e) {
    console.error("admin-support-client error:", e);
    return fail(500, "Erreur interne", corsHeaders);
  }
});

function ok(data: unknown, cors: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function fail(status: number, message: string, cors: Record<string, string>) {
  return new Response(JSON.stringify({ error: message }), {
    headers: { ...cors, "Content-Type": "application/json" }, status,
  });
}

async function log(supabase: any, adminId: string, actionType: string, entityId: string, newData: unknown, req?: Request) {
  await supabase.from("admin_actions_log").insert({
    admin_user_id: adminId,
    action_type:   actionType,
    entity_type:   "user_roles",
    entity_id:     entityId,
    new_data:      newData,
    description:   `${actionType} par ${adminId}`,
    ip_address:    req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    user_agent:    req?.headers.get("user-agent") ?? null,
  });
}

async function listAgents(supabase: any, cors: Record<string, string>) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id, created_at, expires_at, charter_signed_at")
    .eq("role", "support_client")
    .eq("is_active", true);
  if (error) throw error;

  if (!data?.length) return ok({ agents: [] }, cors);

  const ids = data.map((r: any) => r.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, email")
    .in("user_id", ids);

  const byId = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
  const agents = data.map((r: any) => ({
    userId:          r.user_id,
    assignedAt:      r.created_at,
    expiresAt:       r.expires_at,
    charterSignedAt: r.charter_signed_at,
    email:           byId[r.user_id]?.email,
    firstName:       byId[r.user_id]?.first_name,
    lastName:        byId[r.user_id]?.last_name,
  }));
  return ok({ agents }, cors);
}

async function assignSC(supabase: any, caller: any, body: any, cors: Record<string, string>, req: Request) {
  const { userId } = body;
  if (!userId) return fail(400, "userId requis", cors);

  const { data: profile } = await supabase
    .from("profiles").select("user_id, first_name, last_name, email").eq("user_id", userId).maybeSingle();
  if (!profile) return fail(404, "Utilisateur introuvable", cors);

  const { data: existing } = await supabase
    .from("user_roles").select("id").eq("user_id", userId).eq("role", "support_client").eq("is_active", true).maybeSingle();
  if (existing) return fail(409, "Cet utilisateur est deja Support Client", cors);

  // R-GLOBAL-03: SC expire dans 6 mois
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  const { error } = await supabase.from("user_roles").insert({
    user_id:           userId,
    role:              "support_client",
    is_active:         true,
    expires_at:        expiresAt.toISOString(),
    charter_signed_at: body.charterAcknowledged ? new Date().toISOString() : null,
  });
  if (error) throw error;

  await log(supabase, caller.id, "assign_support_client", userId,
    { email: profile.email, expiresAt }, req);
  return ok({ success: true, profile }, cors);
}

async function revokeSC(supabase: any, caller: any, body: any, cors: Record<string, string>, req: Request) {
  const { userId } = body;
  if (!userId) return fail(400, "userId requis", cors);

  const { error } = await supabase
    .from("user_roles")
    .update({ is_active: false, revocation_reason: body.reason ?? "Révoqué par admin" })
    .eq("user_id", userId).eq("role", "support_client").eq("is_active", true);
  if (error) throw error;

  await log(supabase, caller.id, "revoke_support_client", userId, { reason: body.reason }, req);
  return ok({ success: true }, cors);
}

async function listEscalations(supabase: any, cors: Record<string, string>) {
  const { data, error } = await supabase
    .from("refund_escalations")
    .select("id, booking_id, requested_at, reason, requested_amount, status, resolved_at, resolution_notes, requested_by, resolved_by")
    .order("requested_at", { ascending: false });
  if (error) throw error;
  return ok({ escalations: data || [] }, cors);
}

async function approveEscalation(supabase: any, caller: any, body: any, cors: Record<string, string>) {
  const { escalationId, notes } = body;
  if (!escalationId) return fail(400, "escalationId requis", cors);

  const { data: esc } = await supabase
    .from("refund_escalations")
    .select("id, status, booking_id, requested_amount, requested_by")
    .eq("id", escalationId).single();
  if (!esc) return fail(404, "Escalade introuvable", cors);
  if (esc.status !== "pending") return fail(409, "Escalade deja traitee", cors);

  const { error } = await supabase.from("refund_escalations").update({
    status: "approved",
    resolved_by: caller.id,
    resolved_at: new Date().toISOString(),
    resolution_notes: notes || "Approuve par admin",
  }).eq("id", escalationId);
  if (error) throw error;

  await log(supabase, caller.id, "approve_refund_escalation", escalationId, {
    bookingId: esc.booking_id, amount: esc.requested_amount, notes,
  });
  return ok({ success: true, message: "Approuve. Traiter le remboursement Stripe depuis la page Reservations." }, cors);
}

async function rejectEscalation(supabase: any, caller: any, body: any, cors: Record<string, string>) {
  const { escalationId, notes } = body;
  if (!escalationId) return fail(400, "escalationId requis", cors);
  if (!notes?.trim()) return fail(400, "Un motif de refus est obligatoire", cors);

  const { data: esc } = await supabase
    .from("refund_escalations")
    .select("id, status, booking_id")
    .eq("id", escalationId).single();
  if (!esc) return fail(404, "Escalade introuvable", cors);
  if (esc.status !== "pending") return fail(409, "Escalade deja traitee", cors);

  const { error } = await supabase.from("refund_escalations").update({
    status: "rejected",
    resolved_by: caller.id,
    resolved_at: new Date().toISOString(),
    resolution_notes: notes,
  }).eq("id", escalationId);
  if (error) throw error;

  await log(supabase, caller.id, "reject_refund_escalation", escalationId, {
    bookingId: esc.booking_id, notes,
  });
  return ok({ success: true }, cors);
}
