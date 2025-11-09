import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error("Session ID manquant");
    }

    console.log('Vérification paiement pour session:', sessionId);

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'line_items']
    });

    console.log('Session Stripe récupérée:', {
      id: session.id,
      status: session.payment_status,
      amount: session.amount_total,
    });

    // Vérifier que le paiement est réussi
    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ 
          error: "Paiement non complété",
          status: session.payment_status 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Extraire les métadonnées
    const metadata = session.metadata || {};
    const clientInfo = metadata.clientInfo ? JSON.parse(metadata.clientInfo) : null;
    const services = metadata.services ? JSON.parse(metadata.services) : [];
    const urssafEnabled = metadata.urssafEnabled === 'true';
    const totalAmount = parseFloat(metadata.totalAmount || '0');
    const clientAmount = parseFloat(metadata.clientAmount || '0');
    const stateAmount = parseFloat(metadata.stateAmount || '0');

    if (!clientInfo || services.length === 0) {
      throw new Error("Données de réservation incomplètes dans les métadonnées");
    }

    console.log('Métadonnées extraites:', {
      clientInfo,
      servicesCount: services.length,
      urssafEnabled,
      totalAmount,
    });

    // Vérifier si une réservation existe déjà pour cette session
    const { data: existingBooking } = await supabaseClient
      .from('bookings')
      .select('id')
      .eq('notes', `stripe_session:${sessionId}`)
      .single();

    if (existingBooking) {
      console.log('Réservation déjà existante:', existingBooking.id);
      return new Response(
        JSON.stringify({
          success: true,
          bookingId: existingBooking.id,
          alreadyProcessed: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Récupérer l'utilisateur authentifié (optionnel pour guest checkout)
    let userId = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      userId = userData.user?.id || null;
    }

    // Si pas d'user_id, chercher ou créer un profil basé sur l'email
    if (!userId && clientInfo.email) {
      // Chercher un utilisateur existant avec cet email
      const { data: existingUser } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('email', clientInfo.email)
        .single();

      if (existingUser) {
        userId = existingUser.id;
      }
    }

    console.log('User ID pour la réservation:', userId);

    // Créer les réservations dans la table bookings
    const bookingIds: string[] = [];

    for (const service of services) {
      const customBooking = service.customBooking || {};
      const bookingDate = customBooking.date;
      const startTime = customBooking.startTime || '09:00';
      const endTime = customBooking.endTime || '17:00';
      const hours = customBooking.hours || 1;

      // Récupérer le service_id depuis la table services
      const { data: serviceData } = await supabaseClient
        .from('services')
        .select('id')
        .eq('name', service.serviceName)
        .single();

      const serviceId = serviceData?.id;

      if (!serviceId) {
        console.warn('Service non trouvé:', service.serviceName);
        continue;
      }

      // Créer la réservation
      const { data: booking, error: bookingError } = await supabaseClient
        .from('bookings')
        .insert({
          client_id: userId,
          service_id: serviceId,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          total_price: service.price * service.quantity,
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          address: clientInfo.address,
          notes: `stripe_session:${sessionId}\nEmail: ${clientInfo.email}\nTél: ${clientInfo.phone}\nNom: ${clientInfo.firstName} ${clientInfo.lastName}${customBooking.notes ? '\n' + customBooking.notes : ''}`,
          custom_duration: hours,
          hourly_rate: service.price,
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Erreur création réservation:', bookingError);
        throw new Error(`Erreur lors de la création de la réservation: ${bookingError.message}`);
      }

      console.log('Réservation créée:', booking.id);
      bookingIds.push(booking.id);
    }

    // Nettoyer le localStorage côté client sera fait par la page de confirmation

    return new Response(
      JSON.stringify({
        success: true,
        bookingIds,
        clientInfo,
        services,
        totalAmount,
        clientAmount,
        stateAmount,
        urssafEnabled,
        paymentStatus: session.payment_status,
        sessionId: session.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Erreur vérification paiement:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString() 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
