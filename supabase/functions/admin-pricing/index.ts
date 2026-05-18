import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Vérification du rôle admin via le JWT de la requête
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Non authentifié" }, 401);

    const { data: roleRow } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) return json({ error: "Accès réservé aux administrateurs" }, 403);

    // Client avec service role pour les écritures d'audit (bypass RLS)
    const adminClient = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // ------------------------------------------------------------------
    // ACTION : get_prices — liste tous les prix en base
    // ------------------------------------------------------------------
    if (action === "get_prices") {
      const { data, error } = await adminClient
        .from("service_pricing")
        .select("*")
        .order("universe_id")
        .order("service_slug");

      if (error) throw error;
      return json({ success: true, prices: data });
    }

    // ------------------------------------------------------------------
    // ACTION : update — met à jour un prix + journal d'audit
    // ------------------------------------------------------------------
    if (action === "update") {
      const { serviceSlug, universeName, serviceName, universeId, newPrice, reason } = body;

      if (!serviceSlug || !serviceName || !universeId || newPrice === undefined) {
        return json({ error: "Champs obligatoires manquants" }, 400);
      }
      const numericPrice = Number(newPrice);
      if (isNaN(numericPrice) || numericPrice < 0) {
        return json({ error: "Prix invalide" }, 400);
      }

      // Lire l'ancien prix (s'il existe)
      const { data: existing } = await adminClient
        .from("service_pricing")
        .select("client_price")
        .eq("service_slug", serviceSlug)
        .maybeSingle();

      const oldPrice = existing?.client_price ?? numericPrice; // si nouveau service, pas de "ancien prix"

      // Upsert du prix
      const { error: upsertErr } = await adminClient
        .from("service_pricing")
        .upsert({
          service_slug: serviceSlug,
          universe_id:  universeId,
          service_name: serviceName,
          client_price: numericPrice,
          is_active:    true,
          updated_at:   new Date().toISOString(),
          updated_by:   user.id,
        }, { onConflict: "service_slug" });

      if (upsertErr) throw upsertErr;

      // Journal d'audit (seulement si le prix a réellement changé)
      if (oldPrice !== numericPrice) {
        const { error: auditErr } = await adminClient
          .from("pricing_audit_log")
          .insert({
            service_slug: serviceSlug,
            service_name: serviceName,
            universe_id:  universeId,
            old_price:    oldPrice,
            new_price:    numericPrice,
            changed_by:   user.id,
            changed_at:   new Date().toISOString(),
            reason:       reason || null,
          });

        if (auditErr) console.warn("Erreur audit log (non bloquant):", auditErr.message);
      }

      return json({ success: true, serviceSlug, newPrice: numericPrice });
    }

    // ------------------------------------------------------------------
    // ACTION : get_audit_log — historique des changements
    // ------------------------------------------------------------------
    if (action === "get_audit_log") {
      const { serviceSlug, limit = 50, offset = 0 } = body;

      let query = adminClient
        .from("pricing_audit_log")
        .select(`
          id, service_slug, service_name, universe_id,
          old_price, new_price, changed_at, reason,
          changed_by
        `)
        .order("changed_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (serviceSlug) query = query.eq("service_slug", serviceSlug);

      const { data, error, count } = await query;
      if (error) throw error;

      // Enrichir avec le nom de l'admin (profil)
      const changedByIds = [...new Set((data || []).map((r: any) => r.changed_by).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      if (changedByIds.length > 0) {
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", changedByIds);
        (profiles || []).forEach((p: any) => {
          profilesMap[p.user_id] = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Admin";
        });
      }

      const enriched = (data || []).map((row: any) => ({
        ...row,
        admin_name: profilesMap[row.changed_by] || "Admin",
      }));

      return json({ success: true, logs: enriched, total: count });
    }

    return json({ error: "Action inconnue" }, 400);

  } catch (err: any) {
    console.error("[admin-pricing] Erreur:", err.message);
    return json({ error: err.message || "Erreur interne" }, 500);
  }
});
