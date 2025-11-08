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

    // TODO: Envoyer un email avec Resend
    const emailData = {
      to: booking.client?.email,
      subject: '⭐ Notez votre expérience avec Bikawo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
            <h1>BIKAWO</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2>Bonjour ${clientName},</h2>
            <p>Merci d'avoir fait confiance à Bikawo !</p>
            <p><strong>Pouvez-vous noter votre expérience avec ${providerName} ?</strong></p>
            <p>Votre avis aide d'autres familles à faire le bon choix. 🙏</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get("SITE_URL")}/review/${bookingId}" 
                 style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                ⭐ Laisser un avis
              </a>
            </p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              Mission : ${serviceName}<br>
              Date : ${new Date(booking.booking_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      `
    };

    console.log("📧 Email de demande d'avis préparé:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Demande d'avis envoyée",
        notification_sent: true
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
