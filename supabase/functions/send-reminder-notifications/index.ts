import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingWithDetails {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  address: string;
  notes?: string;
  client_id: string;
  provider_id: string;
  service_id: string;
  total_price: number;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  providers: {
    business_name: string;
    contact_email: string;
    contact_phone?: string;
  };
  services: {
    name: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Starting reminder notifications check...');

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Calculer la date de demain
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split('T')[0];

    console.log('Checking bookings for date:', tomorrowDateString);

    // Récupérer tous les bookings confirmés pour demain
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        address,
        notes,
        total_price,
        client_id,
        provider_id,
        service_id,
        profiles!client_id (
          first_name,
          last_name,
          email,
          phone
        ),
        providers (
          business_name,
          contact_email,
          contact_phone
        ),
        services (
          name
        )
      `)
      .eq('status', 'confirmed')
      .eq('booking_date', tomorrowDateString);

    if (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }

    console.log(`Found ${bookings?.length || 0} bookings for tomorrow`);

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No bookings found for tomorrow' }),
        { 
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    const notifications = [];

    // Envoyer les rappels pour chaque booking
    for (const booking of bookings as BookingWithDetails[]) {
      try {
        // Email au client
        if (booking.profiles?.email) {
          const clientEmailResult = await resend.emails.send({
            from: 'Bikawo <notifications@bikawo.com>',
            to: [booking.profiles.email],
            subject: 'Rappel : Votre service demain',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Rappel de votre service</h2>
                <p>Bonjour ${booking.profiles.first_name} ${booking.profiles.last_name},</p>
                
                <p>Nous vous rappelons que vous avez un service prévu demain :</p>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #1e40af;">📅 Détails du service</h3>
                  <p><strong>Service :</strong> ${booking.services.name}</p>
                  <p><strong>Date :</strong> ${new Date(booking.booking_date).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Heure :</strong> ${booking.start_time} - ${booking.end_time}</p>
                  <p><strong>Adresse :</strong> ${booking.address}</p>
                  <p><strong>Prestataire :</strong> ${booking.providers.business_name}</p>
                  ${booking.notes ? `<p><strong>Notes :</strong> ${booking.notes}</p>` : ''}
                </div>
                
                <p>Si vous avez des questions, n'hésitez pas à nous contacter :</p>
                <p>📞 <strong>06 09 08 53 90</strong></p>
                <p>✉️ contact@bikawo.com</p>
                
                <p>À bientôt,<br>L'équipe Bikawo</p>
              </div>
            `,
          });

          notifications.push({
            type: 'client_email',
            booking_id: booking.id,
            recipient: booking.profiles.email,
            status: clientEmailResult.error ? 'failed' : 'sent'
          });
        }

        // Email au prestataire
        if (booking.providers?.contact_email) {
          const providerEmailResult = await resend.emails.send({
            from: 'Bikawo <notifications@bikawo.com>',
            to: [booking.providers.contact_email],
            subject: 'Rappel : Mission demain',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Rappel de votre mission</h2>
                <p>Bonjour ${booking.providers.business_name},</p>
                
                <p>Nous vous rappelons que vous avez une mission prévue demain :</p>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #1e40af;">📋 Détails de la mission</h3>
                  <p><strong>Service :</strong> ${booking.services.name}</p>
                  <p><strong>Date :</strong> ${new Date(booking.booking_date).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Heure :</strong> ${booking.start_time} - ${booking.end_time}</p>
                  <p><strong>Adresse :</strong> ${booking.address}</p>
                  <p><strong>Client :</strong> ${booking.profiles.first_name} ${booking.profiles.last_name}</p>
                  ${booking.profiles.phone ? `<p><strong>Téléphone client :</strong> ${booking.profiles.phone}</p>` : ''}
                  ${booking.notes ? `<p><strong>Instructions :</strong> ${booking.notes}</p>` : ''}
                  <p><strong>Montant :</strong> ${booking.total_price}€</p>
                </div>
                
                <p>Pour toute question, contactez-nous :</p>
                <p>📞 <strong>06 09 08 53 90</strong></p>
                <p>✉️ contact@bikawo.com</p>
                
                <p>Bonne mission !<br>L'équipe Bikawo</p>
              </div>
            `,
          });

          notifications.push({
            type: 'provider_email',
            booking_id: booking.id,
            recipient: booking.providers.contact_email,
            status: providerEmailResult.error ? 'failed' : 'sent'
          });
        }

        // Enregistrer la notification en base
        await supabase
          .from('notifications')
          .insert([
            {
              user_id: booking.client_id,
              title: 'RAPPEL BIKAWO',
              message: `RAPPEL : vous avez BIKAWO demain à ${booking.start_time} pour ${booking.services.name}.`,
              type: 'booking_reminder',
              booking_id: booking.id
            },
            {
              user_id: booking.provider_id,
              title: 'RAPPEL BIKAWO',
              message: `RAPPEL : vous avez BIKAWO demain à ${booking.start_time} pour ${booking.services.name}.`,
              type: 'booking_reminder',
              booking_id: booking.id
            }
          ]);

      } catch (error) {
        console.error(`Error sending notification for booking ${booking.id}:`, error);
        notifications.push({
          type: 'error',
          booking_id: booking.id,
          error: error.message
        });
      }
    }

    console.log('Reminder notifications sent successfully:', notifications);

    return new Response(
      JSON.stringify({ 
        message: 'Reminder notifications processed',
        bookings_processed: bookings.length,
        notifications
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error in reminder notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

serve(handler);