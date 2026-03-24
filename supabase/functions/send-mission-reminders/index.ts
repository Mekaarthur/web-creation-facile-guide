import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Find bookings for tomorrow that haven't been reminded
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id, booking_date, start_time, end_time, address, total_price,
        provider_id, status,
        services(name),
        providers(user_id, profiles:user_id(first_name, last_name))
      `)
      .eq('booking_date', tomorrowStr)
      .in('status', ['confirmed', 'assigned'])
      .is('reminder_sent', null);

    if (bookingsError) throw bookingsError;

    const notifications = [];

    for (const booking of (bookings || [])) {
      // Create a notification for the provider
      const { error: notifError } = await supabase
        .from('provider_notifications')
        .insert({
          provider_id: booking.provider_id,
          booking_id: booking.id,
          title: `🔔 Mission demain - ${booking.services?.name || 'Service'}`,
          message: `Vous avez une mission prévue demain ${booking.booking_date} de ${booking.start_time} à ${booking.end_time} à ${booking.address || 'adresse à confirmer'}. Merci de confirmer votre disponibilité.`,
          type: 'mission_reminder',
          is_read: false
        });

      if (notifError) {
        console.error('Notification insert error:', notifError);
        continue;
      }

      // Mark the booking as reminded
      await supabase
        .from('bookings')
        .update({ reminder_sent: now.toISOString() })
        .eq('id', booking.id);

      notifications.push({
        booking_id: booking.id,
        provider_id: booking.provider_id,
      });
    }

    // Also create a communication record for email tracking
    for (const notif of notifications) {
      await supabase
        .from('communications')
        .insert({
          type: 'notification',
          destinataire_id: notif.provider_id,
          sujet: 'Rappel de mission - Demain',
          contenu: `Rappel automatique pour la mission du ${tomorrowStr}`,
          related_entity_type: 'booking',
          related_entity_id: notif.booking_id,
          status: 'envoyé'
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: notifications.length,
        date: tomorrowStr
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Mission reminder error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
