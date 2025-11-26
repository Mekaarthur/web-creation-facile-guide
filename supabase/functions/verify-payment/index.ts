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
    const { data: existingBookings } = await supabaseClient
      .from('bookings')
      .select('id')
      .ilike('notes', `%stripe_session:${sessionId}%`);

    if (existingBookings && existingBookings.length > 0) {
      console.log('Réservations déjà existantes:', existingBookings.map(b => b.id));
      return new Response(
        JSON.stringify({
          success: true,
          bookingIds: existingBookings.map(b => b.id),
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

    // Si pas d'user_id, chercher ou créer automatiquement un compte
    if (!userId && clientInfo.email) {
      console.log('Guest checkout détecté, vérification compte existant...');
      
      // Chercher un utilisateur existant avec cet email
      const { data: existingUser } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('email', clientInfo.email)
        .single();

      if (existingUser) {
        userId = existingUser.id;
        console.log('Compte existant trouvé:', userId);
      } else {
        // Créer un compte automatiquement pour le guest
        console.log('Création automatique de compte pour:', clientInfo.email);
        
        // Utiliser le service role key pour créer l'utilisateur
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Générer un mot de passe temporaire sécurisé
        const tempPassword = crypto.randomUUID() + Math.random().toString(36);
        
        try {
          // Créer l'utilisateur avec auto-confirmation
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: clientInfo.email,
            password: tempPassword,
            email_confirm: true, // Auto-confirmer l'email
            user_metadata: {
              first_name: clientInfo.firstName,
              last_name: clientInfo.lastName,
              phone: clientInfo.phone,
              created_from_guest_checkout: true,
            }
          });

          if (createError) {
            console.error('Erreur création utilisateur:', createError);
            throw createError;
          }

          if (newUser.user) {
            userId = newUser.user.id;
            console.log('Compte créé avec succès:', userId);

            // Attendre un peu pour que le trigger crée le profil
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Vérifier et mettre à jour le profil avec les informations complètes
            const { error: profileError } = await supabaseAdmin
              .from('profiles')
              .update({
                first_name: clientInfo.firstName,
                last_name: clientInfo.lastName,
                phone: clientInfo.phone,
                email: clientInfo.email,
              })
              .eq('id', userId);

            if (profileError) {
              console.error('Erreur mise à jour profil:', profileError);
            }
            
            // Envoyer un email de bienvenue avec instructions de connexion
            try {
              await supabaseClient.functions.invoke('send-welcome-email', {
                body: {
                  email: clientInfo.email,
                  firstName: clientInfo.firstName,
                  tempPassword: tempPassword,
                }
              });
              console.log('Email de bienvenue envoyé');
            } catch (emailError) {
              console.error('Erreur envoi email de bienvenue:', emailError);
              // Ne pas bloquer le processus si l'email échoue
            }
          }
        } catch (error) {
          console.error('Erreur lors de la création du compte:', error);
          // Ne pas bloquer la réservation si la création de compte échoue
        }
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

      // Trouver un prestataire vérifié disponible (premier disponible pour l'instant)
      const { data: availableProvider } = await supabaseClient
        .from('providers')
        .select('id')
        .eq('is_verified', true)
        .limit(1)
        .single();

      if (!availableProvider) {
        console.error('Aucun prestataire vérifié disponible');
        throw new Error('Aucun prestataire disponible pour cette réservation');
      }

      console.log('Prestataire assigné:', availableProvider.id);

      // Créer la réservation
      const { data: booking, error: bookingError } = await supabaseClient
        .from('bookings')
        .insert({
          client_id: userId,
          provider_id: availableProvider.id,
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

    // Attendre que toutes les transactions financières soient créées par le trigger
    console.log('Attente de la création des transactions financières...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mettre à jour toutes les transactions financières pour les bookings créés
    for (const bookingId of bookingIds) {
      const { data: existingTransaction, error: checkError } = await supabaseClient
        .from('financial_transactions')
        .select('id, payment_status')
        .eq('booking_id', bookingId)
        .single();

      if (checkError) {
        console.error('Transaction non trouvée pour booking:', bookingId, checkError);
        continue;
      }

      console.log('Transaction trouvée:', existingTransaction.id, 'status actuel:', existingTransaction.payment_status);

      const { error: transactionError } = await supabaseClient
        .from('financial_transactions')
        .update({
          payment_status: 'paid',
          client_paid_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId);

      if (transactionError) {
        console.error('Erreur mise à jour transaction pour booking', bookingId, ':', transactionError);
      } else {
        console.log('Transaction financière mise à jour avec succès pour booking:', bookingId);
      }
    }

    // Nettoyer le localStorage côté client après confirmation du paiement
    console.log('Nettoyage du localStorage pour le panier');

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
        clearCart: true, // Signal pour vider le panier
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
