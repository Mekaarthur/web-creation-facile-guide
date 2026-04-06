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

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error("Session ID manquant");
    }

    logStep('Vérification paiement pour session', { sessionId });

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'line_items']
    });

    logStep('Session Stripe récupérée', {
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

    logStep('Métadonnées extraites', {
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
      logStep('Réservations déjà existantes', { ids: existingBookings.map(b => b.id) });
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
      logStep('Guest checkout détecté, vérification compte existant...');
      
      const { data: existingUser } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('email', clientInfo.email)
        .single();

      if (existingUser) {
        userId = existingUser.user_id;
        logStep('Compte existant trouvé', { userId });
      } else {
        logStep('Création automatique de compte pour', { email: clientInfo.email });
        
        const tempPassword = crypto.randomUUID() + Math.random().toString(36);
        
        try {
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: clientInfo.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              first_name: clientInfo.firstName,
              last_name: clientInfo.lastName,
              phone: clientInfo.phone,
              created_from_guest_checkout: true,
            }
          });

          if (createError) {
            logStep('Erreur création utilisateur', { error: createError });
            throw createError;
          }

          if (newUser.user) {
            userId = newUser.user.id;
            logStep('Compte créé avec succès', { userId });

            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await supabaseAdmin
              .from('profiles')
              .update({
                first_name: clientInfo.firstName,
                last_name: clientInfo.lastName,
                phone: clientInfo.phone,
                email: clientInfo.email,
              })
              .eq('user_id', userId);
            
            try {
              const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
                type: 'recovery',
                email: clientInfo.email,
              });
              const setupLink = linkData?.properties?.action_link;
              
              await supabaseAdmin.functions.invoke('send-transactional-email', {
                body: {
                  type: 'password_setup',
                  recipientEmail: clientInfo.email,
                  recipientName: `${clientInfo.firstName} ${clientInfo.lastName}`,
                  data: {
                    clientName: clientInfo.firstName,
                    setupLink: setupLink,
                  },
                }
              });
              logStep('Email de création de mot de passe envoyé');
            } catch (emailError) {
              logStep('Erreur envoi email de bienvenue', { error: String(emailError) });
            }
          }
        } catch (error) {
          logStep('Erreur lors de la création du compte', { error: String(error) });
        }
      }
    }

    logStep('User ID pour la réservation', { userId });

    // Créer les réservations dans la table bookings
    const bookingIds: string[] = [];

    for (const service of services) {
      const customBooking = service.customBooking || {};
      const bookingDate = customBooking.date;
      const startTime = customBooking.startTime || '09:00';
      const endTime = customBooking.endTime || '17:00';
      const hours = customBooking.hours || 1;

      const { data: serviceData } = await supabaseClient
        .from('services')
        .select('id')
        .eq('name', service.serviceName)
        .single();

      const serviceId = serviceData?.id;

      if (!serviceId) {
        logStep('Service non trouvé', { name: service.serviceName });
        continue;
      }

      const { data: availableProvider } = await supabaseClient
        .from('providers')
        .select('id')
        .eq('is_verified', true)
        .limit(1)
        .single();

      if (!availableProvider) {
        logStep('Aucun prestataire vérifié disponible');
        throw new Error('Aucun prestataire disponible pour cette réservation');
      }

      logStep('Prestataire assigné', { id: availableProvider.id });

      // Statut initial : si URSSAF activé, la mission est en attente de déclaration
      const initialStatus = urssafEnabled ? 'pending_urssaf' : 'confirmed';

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
          status: initialStatus,
          confirmed_at: urssafEnabled ? null : new Date().toISOString(),
          address: clientInfo.address,
          notes: `stripe_session:${sessionId}\nEmail: ${clientInfo.email}\nTél: ${clientInfo.phone}\nNom: ${clientInfo.firstName} ${clientInfo.lastName}${urssafEnabled ? '\nURSSAF: en attente de déclaration' : ''}${customBooking.notes ? '\n' + customBooking.notes : ''}`,
          custom_duration: hours,
          hourly_rate: service.price,
        })
        .select()
        .single();

      if (bookingError) {
        logStep('Erreur création réservation', { error: bookingError.message });
        throw new Error(`Erreur lors de la création de la réservation: ${bookingError.message}`);
      }

      logStep('Réservation créée', { id: booking.id, status: initialStatus });
      bookingIds.push(booking.id);
    }

    // Mettre à jour les transactions financières
    logStep('Attente de la création des transactions financières...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    for (const bookingId of bookingIds) {
      const { data: existingTransaction, error: checkError } = await supabaseClient
        .from('financial_transactions')
        .select('id, payment_status')
        .eq('booking_id', bookingId)
        .single();

      if (checkError) {
        logStep('Transaction non trouvée pour booking', { bookingId, error: checkError.message });
        continue;
      }

      logStep('Transaction trouvée', { id: existingTransaction.id, status: existingTransaction.payment_status });

      await supabaseClient
        .from('financial_transactions')
        .update({
          payment_status: 'paid',
          client_paid_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId);
    }

    // === DÉCLARATION URSSAF ASYNCHRONE ===
    // La déclaration est faite APRÈS la confirmation du paiement Stripe,
    // indépendamment du flux de paiement. Si elle échoue, la réservation
    // existe quand même et l'admin est alerté.
    if (urssafEnabled && bookingIds.length > 0) {
      logStep('Déclenchement asynchrone de la déclaration URSSAF');

      try {
        const { data: urssafData, error: urssafError } = await supabaseAdmin.functions.invoke('urssaf-register-service', {
          body: {
            clientInfo,
            services,
            totalAmount,
            clientAmount,
            stateAmount,
            preferredDate: metadata.preferredDate,
            preferredTime: metadata.preferredTime,
            bookingIds,
          }
        });

        if (urssafError) {
          logStep('Erreur déclaration URSSAF (non bloquante)', { error: urssafError.message });
          
          // Créer une déclaration en statut "created" pour suivi
          for (const bookingId of bookingIds) {
            await supabaseAdmin
              .from('urssaf_declarations')
              .insert({
                booking_id: bookingId,
                client_email: clientInfo.email,
                client_name: `${clientInfo.firstName} ${clientInfo.lastName}`,
                total_amount: totalAmount,
                client_amount: clientAmount,
                state_amount: stateAmount,
                status: 'created',
                error_message: urssafError.message,
                retry_count: 0,
              });
          }

          // Alerter l'admin
          await supabaseAdmin.functions.invoke('create-admin-notification', {
            body: {
              type: 'urssaf_error',
              title: '⚠️ Échec déclaration URSSAF',
              message: `La déclaration URSSAF pour ${clientInfo.firstName} ${clientInfo.lastName} (${totalAmount}€) a échoué. Intervention manuelle requise. Réservations: ${bookingIds.join(', ')}`,
              data: { booking_ids: bookingIds, error: urssafError.message },
              priority: 'urgent',
            }
          });
        } else {
          logStep('Déclaration URSSAF réussie', { data: urssafData });
          
          // Si succès, créer déclaration avec deadline 48h et mettre à jour les bookings
          const deadline = new Date();
          deadline.setHours(deadline.getHours() + 48);

          for (const bookingId of bookingIds) {
            await supabaseAdmin
              .from('urssaf_declarations')
              .insert({
                booking_id: bookingId,
                client_email: clientInfo.email,
                client_name: `${clientInfo.firstName} ${clientInfo.lastName}`,
                total_amount: totalAmount,
                client_amount: clientAmount,
                state_amount: stateAmount,
                status: 'sent',
                declared_at: new Date().toISOString(),
                urssaf_reference: urssafData?.registrationId || null,
                client_validation_deadline: deadline.toISOString(),
                retry_count: 0,
              });

            // Confirmer la mission maintenant que la déclaration est envoyée
            await supabaseAdmin
              .from('bookings')
              .update({ 
                status: 'confirmed', 
                confirmed_at: new Date().toISOString(),
                notes: `stripe_session:${sessionId}\nEmail: ${clientInfo.email}\nTél: ${clientInfo.phone}\nNom: ${clientInfo.firstName} ${clientInfo.lastName}\nURSSAF: déclaration envoyée - ref ${urssafData?.registrationId || 'N/A'}`,
              })
              .eq('id', bookingId);
          }

          // Envoyer notification client pour valider dans les 48h
          try {
            await supabaseAdmin.functions.invoke('send-notification-email', {
              body: {
                to: clientInfo.email,
                subject: '✅ Validez votre avance immédiate URSSAF (48h)',
                html: `
                  <p>Bonjour ${clientInfo.firstName},</p>
                  <p>Votre demande d'avance immédiate a été envoyée à l'URSSAF avec succès.</p>
                  <p><strong>Montant total :</strong> ${totalAmount}€</p>
                  <p><strong>Votre part (50%) :</strong> ${clientAmount}€ (déjà payé)</p>
                  <p><strong>Part État (50%) :</strong> ${stateAmount}€</p>
                  <p><strong>⏰ Action requise :</strong> Vous devez valider cette demande sur <a href="https://www.particulier.urssaf.fr">particulier.urssaf.fr</a> dans les <strong>48 heures</strong>.</p>
                  <p>Sans validation de votre part, la demande expirera et vous devrez régler le solde restant.</p>
                  <p>L'équipe Bikawo</p>
                `,
              },
            });
            logStep('Notification 48h envoyée au client');
          } catch (emailErr) {
            logStep('Erreur envoi notification 48h', { error: String(emailErr) });
          }
        }
      } catch (urssafCritical) {
        logStep('Erreur critique URSSAF (non bloquante pour le paiement)', { error: String(urssafCritical) });
        
        // La réservation existe, on crée un suivi pour intervention manuelle
        await supabaseAdmin.functions.invoke('create-admin-notification', {
          body: {
            type: 'urssaf_critical',
            title: '🔴 Erreur critique URSSAF',
            message: `Erreur critique lors de la déclaration URSSAF. Paiement Stripe confirmé mais pas de déclaration. Réservations: ${bookingIds.join(', ')}. Erreur: ${String(urssafCritical)}`,
            data: { booking_ids: bookingIds },
            priority: 'urgent',
          }
        });
      }
    }

    logStep('Nettoyage du localStorage pour le panier');

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
        clearCart: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep("Erreur vérification paiement", { error: error.message });
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
