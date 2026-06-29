import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

type SupabaseClient = ReturnType<typeof createClient>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Cette fonction est appelée par un cron job pour envoyer les emails programmés :
 * - Rappels 24h avant les prestations
 * - Rappels de paiement
 * - Demandes d'avis après 24h
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log('🕐 Starting scheduled emails job');

    const results = {
      reminders: 0,
      reviewRequests: 0,
      errors: 0
    };

    // 1. Rappels 24h avant la prestation
    await sendBookingReminders(supabase, results);

    // 2. Demandes d'avis pour missions terminées depuis 24h
    await sendReviewRequests(supabase, results);

    console.log('✅ Scheduled emails completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in scheduled emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function sendBookingReminders(supabase: SupabaseClient, results: any) {
  try {
    // Récupérer les réservations confirmées pour demain
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        address,
        client_id,
        provider_id,
        service:services(name),
        client:profiles!bookings_client_id_fkey(first_name, last_name, email)
      `)
      .eq('status', 'confirmed')
      .eq('booking_date', tomorrowStr)
      .is('reminder_sent', null);

    if (error) throw error;

    console.log(`📧 Found ${bookings?.length || 0} bookings needing reminders`);

    for (const booking of bookings || []) {
      try {
        // Récupérer les infos du prestataire
        const { data: provider } = await supabase
          .from('providers')
          .select('business_name, user_id')
          .eq('id', booking.provider_id)
          .single();

        const { data: providerProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', provider?.user_id)
          .single();

        const providerName = provider?.business_name ||
          `${providerProfile?.first_name || ''} ${providerProfile?.last_name || ''}`.trim() ||
          'Votre prestataire';

        // Envoyer l'email au client
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            type: 'booking_reminder',
            recipientEmail: booking.client?.email,
            recipientName: `${booking.client?.first_name} ${booking.client?.last_name}`,
            data: {
              clientName: booking.client?.first_name || 'Client',
              serviceName: booking.service?.name || 'Service',
              bookingDate: new Date(booking.booking_date).toLocaleDateString('fr-FR'),
              startTime: booking.start_time,
              address: booking.address,
              providerName
            }
          }
        });

        // Marquer comme envoyé
        await supabase
          .from('bookings')
          .update({ reminder_sent: new Date().toISOString() })
          .eq('id', booking.id);

        results.reminders++;
      } catch (err) {
        console.error(`Error sending reminder for booking ${booking.id}:`, err);
        results.errors++;
      }
    }
  } catch (error) {
    console.error('Error in sendBookingReminders:', error);
    results.errors++;
  }
}

async function sendReviewRequests(supabase: SupabaseClient, results: any) {
  try {
    // Récupérer les missions terminées il y a 24h sans avis
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString();

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        client_id,
        provider_id,
        service:services(name),
        client:profiles!bookings_client_id_fkey(first_name, last_name, email)
      `)
      .eq('status', 'completed')
      .lt('completed_at', yesterdayStr)
      .is('review_request_sent', null);

    if (error) throw error;

    console.log(`⭐ Found ${bookings?.length || 0} bookings needing review requests`);

    for (const booking of bookings || []) {
      try {
        // Vérifier s'il n'y a pas déjà un avis
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('booking_id', booking.id)
          .single();

        if (existingReview) {
          // Marquer comme envoyé même s'il y a déjà un avis
          await supabase
            .from('bookings')
            .update({ review_request_sent: new Date().toISOString() })
            .eq('id', booking.id);
          continue;
        }

        // Récupérer les infos du prestataire
        const { data: provider } = await supabase
          .from('providers')
          .select('business_name')
          .eq('id', booking.provider_id)
          .single();

        // Envoyer l'email de demande d'avis (utiliser mission_completed qui inclut le CTA avis)
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            type: 'mission_completed',
            recipientEmail: booking.client?.email,
            recipientName: `${booking.client?.first_name} ${booking.client?.last_name}`,
            data: {
              clientName: booking.client?.first_name || 'Client',
              serviceName: booking.service?.name || 'Service',
              providerName: provider?.business_name || 'Votre prestataire',
              completedAt: new Date().toLocaleDateString('fr-FR'),
              bookingId: booking.id
            }
          }
        });

        // Marquer comme envoyé
        await supabase
          .from('bookings')
          .update({ review_request_sent: new Date().toISOString() })
          .eq('id', booking.id);

        results.reviewRequests++;
      } catch (err) {
        console.error(`Error sending review request for booking ${booking.id}:`, err);
        results.errors++;
      }
    }
  } catch (error) {
    console.error('Error in sendReviewRequests:', error);
    results.errors++;
  }
}
