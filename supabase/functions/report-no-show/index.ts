import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportNoShowRequest {
  bookingId: string;
  reportedBy: string; // client_id
  notes?: string;
}

/**
 * Module 2 - No-show client (signalement absence prestataire)
 *
 * Workflow :
 * 1. Le client signale l'absence du prestataire (>15 min de retard)
 * 2. On vérifie qu'on est bien après l'heure de début prévue
 * 3. On enregistre l'incident + on déclenche une recherche de remplaçant URGENTE
 * 4. Pénalité automatique pour le prestataire défaillant
 * 5. Si aucun remplaçant en 30 min => bon de réduction 20% au client
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

    const { bookingId, reportedBy, notes }: ReportNoShowRequest = await req.json();

    if (!bookingId || !reportedBy) {
      return new Response(
        JSON.stringify({ error: "bookingId et reportedBy requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📍 No-show report for booking:", bookingId);

    // 1. Récupérer la réservation
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, services(name)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: "Réservation introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier que c'est bien le client de la réservation
    if (booking.client_id !== reportedBy) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Vérifier qu'on est bien après l'heure de début prévue (au moins 15 min)
    const bookingStart = new Date(`${booking.booking_date}T${booking.start_time}`);
    const now = new Date();
    const minutesLate = Math.floor((now.getTime() - bookingStart.getTime()) / 60000);

    if (minutesLate < 15) {
      return new Response(
        JSON.stringify({
          error: "Signalement prématuré",
          message: `Vous pouvez signaler l'absence après 15 minutes de retard. Temps écoulé : ${minutesLate} min.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Marquer la réservation comme no-show signalé
    await supabase
      .from("bookings")
      .update({
        no_show_reported_at: now.toISOString(),
        replacement_search_status: "searching",
      })
      .eq("id", bookingId);

    // 4. Créer un incident
    const { data: incident } = await supabase
      .from("incidents")
      .insert({
        booking_id: bookingId,
        type: "provider_no_show",
        severity: "high",
        status: "open",
        description: `Client a signalé l'absence du prestataire après ${minutesLate} min de retard. ${notes || ""}`,
        reported_by: reportedBy,
        metadata: {
          minutes_late: minutesLate,
          provider_id: booking.provider_id,
          original_start_time: booking.start_time,
          notes,
        },
      })
      .select()
      .single();

    console.log("✅ Incident created:", incident?.id);

    // 5. Sanction non-financière : retrait de points pour no-show (sévère, pas de montant prélevé)
    await supabase.from("provider_penalties").insert({
      provider_id: booking.provider_id,
      booking_id: bookingId,
      penalty_type: "points_deduction",
      reason: `No-show signalé par le client après ${minutesLate} min de retard`,
      amount: 0, // Pas de pénalité financière — uniquement impact sur la réputation/score
      status: "applied",
    }).then((res) => {
      if (res.error) console.warn("Pénalité non enregistrée:", res.error.message);
    });

    // 6. Lancer recherche urgente de remplaçant via emergency_assignments
    //    (on s'appuie sur la même logique que handle-cancellation)
    const { data: replacementInvoke, error: replacementError } = await supabase.functions.invoke(
      "handle-cancellation",
      {
        body: {
          bookingId,
          reason: `No-show signalé : ${notes || "Prestataire absent"}`,
          cancelledBy: "provider", // déclenche recherche remplaçant
          refundAmount: booking.total_price,
          refundPercentage: 100,
          // pas de refundReason => on ne rembourse pas tant qu'on n'a pas épuisé les alternatives
        },
      }
    );

    if (replacementError) {
      console.error("Erreur recherche remplaçant:", replacementError);
    }

    // 7. Notification temps réel au client
    await supabase.from("realtime_notifications").insert({
      user_id: booking.client_id,
      type: "no_show_acknowledged",
      title: "🔍 Recherche d'un prestataire de remplacement",
      message: "Nous avons bien reçu votre signalement et cherchons un remplaçant en urgence.",
      priority: "urgent",
    });

    // 8. Alerte admin
    await supabase.from("admin_notifications").insert({
      type: "provider_no_show",
      priority: "urgent",
      title: "🚨 No-show prestataire",
      message: `Booking ${bookingId} — Prestataire ${booking.provider_id} absent depuis ${minutesLate} min`,
      metadata: { booking_id: bookingId, provider_id: booking.provider_id, incident_id: incident?.id },
    }).then((res) => {
      if (res.error) console.warn("Alerte admin non créée:", res.error.message);
    });

    return new Response(
      JSON.stringify({
        success: true,
        incidentId: incident?.id,
        replacementSearchStarted: !replacementError,
        replacementResult: replacementInvoke,
        message: "Signalement enregistré, recherche d'un remplaçant en cours.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Erreur report-no-show:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
