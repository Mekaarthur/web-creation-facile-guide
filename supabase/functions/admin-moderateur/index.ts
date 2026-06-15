import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getAdminCorsHeaders } from "../_shared/cors.ts";

const MIN_NOTE_LENGTH = 10; // R-MO-03

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

    const { action, ...body } = await req.json();

    // Actions de gestion (réservées aux admins)
    const adminOnlyActions = ["list_agents", "assign", "revoke", "list_escalations", "review_escalation"];
    if (adminOnlyActions.includes(action)) {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return fail(403, "Acces reserve aux administrateurs", corsHeaders);
    } else {
      // Actions de modération (réservées aux modérateurs et admins)
      const [{ data: isMod }, { data: isAdmin }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "moderator" }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      ]);
      if (!isMod && !isAdmin) return fail(403, "Acces reserve aux moderateurs", corsHeaders);
    }

    switch (action) {
      case "list_agents":           return await listAgents(supabase, corsHeaders);
      case "assign":                return await assignMO(supabase, user, body, corsHeaders, req);
      case "revoke":                return await revokeMO(supabase, user, body, corsHeaders, req);
      case "log_decision":          return await logDecision(supabase, user, body, corsHeaders);
      case "escalate_signalement":  return await escalateSignalement(supabase, user, body, corsHeaders);
      case "list_escalations":      return await listEscalations(supabase, corsHeaders);
      case "review_escalation":     return await reviewEscalation(supabase, user, body, corsHeaders);
      default: return fail(400, `Action inconnue: ${action}`, corsHeaders);
    }
  } catch (e) {
    console.error("admin-moderateur error:", e);
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

async function logAction(supabase: any, adminId: string, actionType: string, entityId: string, newData: unknown, req?: Request) {
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
    .eq("role", "moderator")
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

async function assignMO(supabase: any, caller: any, body: any, cors: Record<string, string>, req: Request) {
  const { userId } = body;
  if (!userId) return fail(400, "userId requis", cors);

  const { data: profile } = await supabase
    .from("profiles").select("user_id, first_name, last_name, email").eq("user_id", userId).maybeSingle();
  if (!profile) return fail(404, "Utilisateur introuvable", cors);

  const { data: existing } = await supabase
    .from("user_roles").select("id").eq("user_id", userId).eq("role", "moderator").eq("is_active", true).maybeSingle();
  if (existing) return fail(409, "Cet utilisateur est deja Moderateur", cors);

  // R-GLOBAL-03: MO expire dans 6 mois
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  const { error } = await supabase.from("user_roles").insert({
    user_id:           userId,
    role:              "moderator",
    is_active:         true,
    expires_at:        expiresAt.toISOString(),
    charter_signed_at: body.charterAcknowledged ? new Date().toISOString() : null,
  });
  if (error) throw error;

  await logAction(supabase, caller.id, "assign_moderator", userId,
    { email: profile.email, expiresAt }, req);
  return ok({ success: true, profile }, cors);
}

async function revokeMO(supabase: any, caller: any, body: any, cors: Record<string, string>, req: Request) {
  const { userId } = body;
  if (!userId) return fail(400, "userId requis", cors);

  const { error } = await supabase
    .from("user_roles")
    .update({ is_active: false, revocation_reason: body.reason ?? "Révoqué par admin" })
    .eq("user_id", userId).eq("role", "moderator").eq("is_active", true);
  if (error) throw error;

  await logAction(supabase, caller.id, "revoke_moderator", userId, { reason: body.reason }, req);
  return ok({ success: true }, cors);
}

async function logDecision(supabase: any, caller: any, body: any, cors: Record<string, string>) {
  const { actionType, targetId, targetType, note, decision, pendingAoConversion } = body;

  // R-MO-03: note obligatoire ≥ MIN_NOTE_LENGTH chars
  if (!note || note.trim().length < MIN_NOTE_LENGTH) {
    return fail(400, `R-MO-03 : une note documentee (min ${MIN_NOTE_LENGTH} caracteres) est obligatoire.`, cors);
  }

  const validDecisions = ["approved", "rejected", "escalated", "pending_ao"];
  if (!validDecisions.includes(decision)) return fail(400, "Decision invalide", cors);

  // R-MO-02: blocage suppression definitive pour les modérateurs
  if (actionType === "delete_review" || actionType === "permanent_delete") {
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) {
      return fail(403, "R-MO-02 : les modérateurs ne peuvent pas supprimer définitivement. Utilisez 'rejected' avec motif.", cors);
    }
  }

  const { data, error } = await supabase.from("moderation_decisions").insert({
    moderator_id: caller.id,
    action_type: actionType,
    target_id: targetId,
    target_type: targetType,
    note: note.trim(),
    decision,
    pending_ao_conversion: pendingAoConversion === true,
  }).select("id").single();
  if (error) throw error;

  // R-MO-05: log horodate
  await logAction(supabase, caller.id, `moderation_${actionType}`, targetId, {
    targetType, decision, note: note.trim(), pendingAoConversion,
  });

  return ok({ success: true, decisionId: data.id }, cors);
}

async function escalateSignalement(supabase: any, caller: any, body: any, cors: Record<string, string>) {
  const { reportId, reason, priority = "urgent" } = body;

  if (!reportId) return fail(400, "reportId requis", cors);
  if (!reason || reason.trim().length < 10) {
    return fail(400, "Un motif documenté (min 10 caractères) est obligatoire pour l'escalade.", cors);
  }

  const { data, error } = await supabase.from("signalement_escalations").insert({
    report_id: reportId,
    escalated_by: caller.id,
    reason: reason.trim(),
    priority,
    status: "pending",
  }).select("id").single();
  if (error) throw error;

  // R-MO-04 + R-MO-05
  await logAction(supabase, caller.id, "escalate_signalement", reportId, {
    reason: reason.trim(), priority, escalationId: data.id,
  });

  return ok({ success: true, escalationId: data.id }, cors);
}

async function listEscalations(supabase: any, cors: Record<string, string>) {
  const { data, error } = await supabase
    .from("signalement_escalations")
    .select("id, report_id, escalated_by, reason, priority, status, reviewed_at, review_notes, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ok({ escalations: data || [] }, cors);
}

async function reviewEscalation(supabase: any, caller: any, body: any, cors: Record<string, string>) {
  const { escalationId, status, notes } = body;
  if (!escalationId) return fail(400, "escalationId requis", cors);
  if (!["reviewed", "dismissed"].includes(status)) return fail(400, "Statut invalide", cors);

  const { data: esc } = await supabase
    .from("signalement_escalations").select("id, status").eq("id", escalationId).single();
  if (!esc) return fail(404, "Escalade introuvable", cors);
  if (esc.status !== "pending") return fail(409, "Escalade deja traitee", cors);

  const { error } = await supabase.from("signalement_escalations").update({
    status,
    reviewed_by: caller.id,
    reviewed_at: new Date().toISOString(),
    review_notes: notes || null,
  }).eq("id", escalationId);
  if (error) throw error;

  await logAction(supabase, caller.id, `signalement_escalation_${status}`, escalationId, { notes });
  return ok({ success: true }, cors);
}
