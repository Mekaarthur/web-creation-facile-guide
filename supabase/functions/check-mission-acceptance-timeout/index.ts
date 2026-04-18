import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Module 4 - Workflow d'acceptation 2h
 *
 * Cette fonction est appelée par cron (toutes les 15 min) pour :
 * 1. Détecter les missions assignées non acceptées dans les 2h
 * 2. Réassigner automatiquement à d'autres prestataires éligibles
 * 3. Pénaliser le prestataire qui n'a pas répondu (avertissement)
 * 4. Si plus aucun prestataire => alerter admin
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    console.log("⏰ Checking mission acceptance timeouts (>2h)...");

    // 1. Récupérer les missions en attente depuis +2h sans réponse
    const { data: expiredMissions, error: missionsError } = await supabase
      .from("missions")
      .select("*, client_requests(*)")
      .eq("status", "pending")
      .lte("created_at", twoHoursAgo.toISOString())
      .or("expires_at.is.null,expires_at.lte." + now.toISOString());

    if (missionsError) {
      throw missionsError;
    }

    if (!expiredMissions || expiredMissions.length === 0) {
      console.log("✅ Aucune mission expirée");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 ${expiredMissions.length} mission(s) expirée(s) à traiter`);

    let reassigned = 0;
    let unmatched = 0;
    const results: any[] = [];

    for (const mission of expiredMissions) {
      try {
        // 2. Identifier les prestataires qui n'ont PAS répondu
        const { data: responses } = await supabase
          .from("candidatures_prestataires")
          .select("provider_id")
          .eq("mission_assignment_id", mission.id);

        const respondedIds = new Set((responses ?? []).map((r) => r.provider_id));
        const nonResponders = (mission.eligible_providers ?? []).filter(
          (id: string) => !respondedIds.has(id)
        );

        // 3. Avertissement (sanction non-financière) pour les non-répondants
        for (const providerId of nonResponders) {
          await supabase.from("provider_penalties").insert({
            provider_id: providerId,
            penalty_type: "warning",
            reason: "Aucune réponse à une mission dans le délai de 2h",
            amount: 0, // Pas de pénalité financière — simple avertissement
            status: "applied",
          }).then((res) => {
            if (res.error) console.warn(`Avertissement ignoré pour ${providerId}:`, res.error.message);
          });
        }

        // 4. Tentative de réassignation : exclure les non-répondants et chercher d'autres
        const clientRequest = mission.client_requests;
        if (!clientRequest) {
          console.warn(`Mission ${mission.id} : client_request manquant`);
          continue;
        }

        // Marquer la mission expirée
        await supabase
          .from("missions")
          .update({ status: "expired" })
          .eq("id", mission.id);

        // Relancer auto-assign (qui va chercher de nouveaux prestataires)
        const { data: reassignResult, error: reassignError } = await supabase.functions.invoke(
          "auto-assign-mission",
          {
            body: {
              clientRequestId: clientRequest.id,
              serviceType: clientRequest.service_type,
              location: clientRequest.location,
              postalCode: clientRequest.city,
              requestedDate: clientRequest.preferred_date,
            },
          }
        );

        if (reassignError || reassignResult?.success === false) {
          // Personne d'autre dispo => alerter admin
          unmatched++;
          await supabase.from("admin_notifications").insert({
            type: "mission_unassignable",
            priority: "urgent",
            title: "⚠️ Mission impossible à réassigner",
            message: `Demande ${clientRequest.id} (${clientRequest.service_type}) — aucun prestataire trouvé après expiration.`,
            metadata: { mission_id: mission.id, client_request_id: clientRequest.id },
          }).then((res) => {
            if (res.error) console.warn("Alerte admin non créée:", res.error.message);
          });
        } else {
          reassigned++;
        }

        results.push({
          missionId: mission.id,
          nonResponders: nonResponders.length,
          reassigned: !reassignError,
        });
      } catch (err) {
        console.error(`Erreur mission ${mission.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: expiredMissions.length,
        reassigned,
        unmatched,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Erreur check-mission-acceptance-timeout:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
