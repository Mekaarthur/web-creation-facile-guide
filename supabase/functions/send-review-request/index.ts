import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: send-review-request
 * 
 * Envoie une demande d'avis au client après la fin d'une mission
 * Appelé automatiquement quand une réservation passe en statut 'completed'
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { bookingId, clientId, providerId } = await req.json();

    if (!bookingId || !clientId || !providerId) {
      throw new Error("Missing required parameters");
    }

    // Récupérer les informations de la réservation
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        client:profiles!bookings_client_id_fkey(first_name, email),
        provider:profiles!bookings_provider_id_fkey(first_name, last_name),
        service:services(name, category)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) throw bookingError;

    // Vérifier si le client a déjà laissé un avis
    const { data: existingReview } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    if (existingReview) {
      console.log('Avis déjà existant pour cette réservation');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Avis déjà existant" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const clientName = booking.client?.first_name || 'Client';
    const providerName = booking.provider 
      ? `${booking.provider.first_name} ${booking.provider.last_name}` 
      : 'Prestataire';
    const serviceName = booking.service?.name || 'Service';

    // Créer une notification pour le client
    await supabaseAdmin
      .from('realtime_notifications')
      .insert({
        user_id: clientId,
        type: 'review_request',
        title: '⭐ Notez votre prestataire',
        message: `Merci d'avoir fait confiance à Bikawo ! Partagez votre expérience avec ${providerName}.`,
        data: {
          booking_id: bookingId,
          provider_id: providerId,
          provider_name: providerName,
          service_name: serviceName
        },
        priority: 'normal'
      });

    // Envoi email Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SITE_URL = Deno.env.get("SITE_URL") ?? "https://bikawo.com";
    const recipient = booking.client?.email;

    let emailSent = false;
    if (RESEND_API_KEY && recipient) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg,#667eea,#764ba2); color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin:0;">⭐ Notez votre expérience</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 8px 8px;">
            <h2 style="color:#1f2937;">Bonjour ${clientName},</h2>
            <p>Merci d'avoir fait confiance à Bikawo !</p>
            <p><strong>Pouvez-vous noter votre expérience avec ${providerName} ?</strong></p>
            <p>Votre avis aide d'autres familles à faire le bon choix. 🙏</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${SITE_URL}/espace-personnel?tab=bookings&rate=${bookingId}"
                 style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight:600;">
                ⭐ Laisser un avis
              </a>
            </p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              Mission : ${serviceName}<br>
              Date : ${new Date(booking.booking_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      `;

      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Bikawo <contact@bikawo.com>",
          to: recipient,
          subject: "⭐ Notez votre expérience avec Bikawo",
          html,
        }),
      });

      emailSent = resp.ok;
      if (!resp.ok) console.error("Resend error", await resp.text());
    }

    // Trace dans communications
    if (recipient) {
      await supabaseAdmin.from("communications").insert({
        type: "email",
        destinataire_id: clientId,
        destinataire_email: recipient,
        sujet: "Demande de notation",
        contenu: `review-request:${bookingId}`,
        template_name: "review-request",
        status: emailSent ? "sent" : "failed",
        sent_at: new Date().toISOString(),
        related_entity_type: "booking",
        related_entity_id: bookingId,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demande d'avis envoyée",
        notification_sent: true,
        email_sent: emailSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erreur envoi demande avis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
