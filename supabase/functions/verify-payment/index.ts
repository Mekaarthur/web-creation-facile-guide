import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
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

    // clientInfo : objet JSON direct (legacy) ou reconstruction depuis les champs plats
    let clientInfo: { firstName: string; lastName: string; email: string; phone: string; address: string } | null = null;
    if (metadata.clientInfo) {
      clientInfo = JSON.parse(metadata.clientInfo);
    } else if (metadata.client_email) {
      const nameParts = (metadata.client_name || '').trim().split(/\s+/);
      clientInfo = {
        firstName: nameParts[0] || '',
        lastName:  nameParts.slice(1).join(' ') || '',
        email:     metadata.client_email,
        phone:     metadata.client_phone || '',
        address:   metadata.address || '',
      };
    }

    // services : normalise les clés abrégées (n/c/p/q/d/t) vers noms complets
    const normalizeService = (s: any) => ({
      serviceName:   s.serviceName   ?? s.n ?? '',
      category:      s.category      ?? s.c ?? '',
      price:         s.price         ?? s.p ?? 0,
      quantity:      s.quantity      ?? s.q ?? 1,
      customBooking: s.customBooking ?? {
        date:      s.d ?? '',
        startTime: s.t ?? '09:00',
        endTime:   '17:00',
        hours:     s.q ?? 1,
        notes:     '',
      },
    });
    const services = metadata.services
      ? (JSON.parse(metadata.services) as any[]).map(normalizeService)
      : [];
    const urssafEnabled = metadata.urssafEnabled === 'true';
    const totalAmount = parseFloat(metadata.totalAmount || '0');
    const clientAmount = parseFloat(metadata.clientAmount || '0');
    const stateAmount = parseFloat(metadata.stateAmount || '0');

    // Split Bikawô — stocké par create-payment
    const splitServiceType  = metadata.service_type  || null;
    const splitHours        = parseFloat(metadata.hours || '1');
    const splitStripeComm   = parseFloat(metadata.stripe_commission || '0');
    const splitProviderAmt  = parseFloat(metadata.provider_amount   || '0');
    const splitBikawoNet    = parseFloat(metadata.bikawo_net        || '0');
    logStep('Split depuis métadonnées Stripe', {
      splitServiceType, splitHours, splitStripeComm, splitProviderAmt, splitBikawoNet,
    });

    // Stripe PaymentIntent ID — pour relier les remboursements webhook
    const stripePaymentIntentId = session.payment_intent
      ? (typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent as any).id ?? null)
      : null;
    logStep('PaymentIntent ID', { stripePaymentIntentId });

    if (!clientInfo || services.length === 0) {
      throw new Error("Données de réservation incomplètes dans les métadonnées");
    }

    logStep('Métadonnées extraites', {
      clientInfo,
      servicesCount: services.length,
      urssafEnabled,
      totalAmount,
    });

    // Vérifier si une réservation existe déjà pour cette session (admin key — RLS bloque les lectures anon)
    const { data: existingBookings } = await supabaseAdmin
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
      
      const { data: existingUser } = await supabaseAdmin
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
        } catch (error: any) {
          logStep('Erreur lors de la création du compte', { error: String(error) });
          // Si l'email est déjà dans auth (mais pas dans profiles), chercher l'user existant
          const errMsg = String(error).toLowerCase();
          if (errMsg.includes('already registered') || errMsg.includes('already exists') || errMsg.includes('already been registered')) {
            try {
              const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
              const found = (listData?.users ?? []).find((u: any) => u.email === clientInfo.email);
              if (found) {
                userId = found.id;
                logStep('User auth récupéré après échec createUser', { userId });
              }
            } catch (lookupErr) {
              logStep('Lookup user par email échoué', { error: String(lookupErr) });
            }
          }
        }
      }
    }

    logStep('User ID pour la réservation', { userId });

    // Créer les réservations dans la table bookings
    const bookingIds: string[] = [];

    // Extraire le code postal de l'adresse client (5 chiffres consécutifs)
    const postalCodeMatch = (clientInfo.address ?? '').match(/\b\d{5}\b/);
    const clientPostalCode = postalCodeMatch ? postalCodeMatch[0] : null;
    logStep('Code postal client', { clientPostalCode });

    for (const service of services) {
      const customBooking = service.customBooking || {};
      const bookingDate = customBooking.date;
      const startTime = customBooking.startTime || '09:00';
      const endTime = customBooking.endTime || '17:00';
      const hours = customBooking.hours || 1;

      // Lookup multi-stratégies : exact → ilike → mots-clés → null (service_id est nullable)
      let serviceId: string | null = null;
      let serviceUnmapped = false;

      const { data: exactSvc } = await supabaseAdmin
        .from('services').select('id').eq('name', service.serviceName).maybeSingle();
      if (exactSvc) {
        serviceId = exactSvc.id;
      } else {
        const { data: ilikeSvc } = await supabaseAdmin
          .from('services').select('id').ilike('name', service.serviceName).maybeSingle();
        if (ilikeSvc) {
          serviceId = ilikeSvc.id;
        } else {
          // Partial match : 2 mots-clés (%m1%m2%) puis 1 mot-clé seul (ordre alphabétique)
          const words = service.serviceName
            .split(/[\s&,\-–—!?']+/).filter((w: string) => w.length > 3);
          if (words.length >= 2) {
            const { data: twoWordSvc } = await supabaseAdmin
              .from('services').select('id')
              .ilike('name', `%${words[0]}%${words[1]}%`)
              .limit(1).maybeSingle();
            if (twoWordSvc) serviceId = twoWordSvc.id;
          }
          if (!serviceId && words.length >= 1) {
            const { data: oneWordSvc } = await supabaseAdmin
              .from('services').select('id')
              .ilike('name', `%${words[0]}%`)
              .order('name', { ascending: true }).limit(1).maybeSingle();
            if (oneWordSvc) serviceId = oneWordSvc.id;
          }
        }
      }

      if (!serviceId) {
        logStep('Service introuvable en base — booking créé sans service_id (assignation admin requise)', { name: service.serviceName });
        serviceUnmapped = true;
      }

      // Priorité 1 : prestataire favori actif du client
      let availableProvider: { id: string } | null = null;

      if (userId) {
        const { data: favoriteProviders } = await supabaseAdmin.rpc('get_client_active_favorites', {
          p_client_id: userId,
          p_service_type: service.category || null,
        });
        if (favoriteProviders && favoriteProviders.length > 0) {
          availableProvider = { id: favoriteProviders[0].provider_id };
          logStep('Prestataire favori utilisé', { providerId: availableProvider.id });
        }
      }

      // Priorité 2 : matching géographique par code postal
      if (!availableProvider && clientPostalCode) {
        const { data: zoneProviders } = await supabaseAdmin.rpc('find_providers_in_zone', {
          p_code_postal: clientPostalCode,
          p_service_type: service.category || null,
        });
        if (zoneProviders && zoneProviders.length > 0) {
          availableProvider = { id: zoneProviders[0].provider_id };
          logStep('Prestataire trouvé dans la zone', { postalCode: clientPostalCode, providerId: availableProvider.id });
        } else {
          logStep('Aucun prestataire dans la zone, fallback global', { postalCode: clientPostalCode });
        }
      }

      // Fallback : n'importe quel prestataire vérifié
      if (!availableProvider) {
        const { data: fallbackProvider } = await supabaseAdmin
          .from('providers')
          .select('id')
          .eq('is_verified', true)
          .limit(1)
          .single();
        availableProvider = fallbackProvider;
      }

      if (!availableProvider) {
        logStep('Aucun prestataire vérifié disponible — booking pending_provider');

        // Attempt to create booking without provider for manual admin assignment
        const { data: pendingBooking, error: pendingErr } = await supabaseAdmin
          .from('bookings')
          .insert({
            client_id: userId,
            provider_id: null,
            service_id: serviceId,
            booking_date: bookingDate,
            start_time: startTime,
            end_time: endTime,
            total_price: service.price * service.quantity,
            status: 'pending_provider',
            address: clientInfo.address,
            notes: `stripe_session:${sessionId}\nEmail: ${clientInfo.email}\nTél: ${clientInfo.phone}\nNom: ${clientInfo.firstName} ${clientInfo.lastName}\n⚠️ AUCUN PRESTATAIRE DISPONIBLE — assignation manuelle requise${serviceUnmapped ? `\n⚠️ SERVICE NON IDENTIFIÉ: "${service.serviceName}" — assignation service requise` : ''}`,
            custom_duration: hours,
            hourly_rate: service.price,
          } as any)
          .select()
          .single();

        if (!pendingErr && pendingBooking) {
          bookingIds.push(pendingBooking.id);
          logStep('Booking pending_provider créé', { id: pendingBooking.id });
        } else {
          // DB rejected insert (e.g. NOT NULL constraint) — refund client immediately
          logStep('Insert pending_provider refusé — remboursement Stripe', { error: pendingErr?.message });
          if (stripePaymentIntentId) {
            try {
              await stripe.refunds.create({ payment_intent: stripePaymentIntentId });
              logStep('Remboursement Stripe initié', { paymentIntentId: stripePaymentIntentId });
            } catch (refundErr) {
              logStep('Erreur remboursement Stripe (critique)', { error: String(refundErr) });
            }
          }
        }

        // Notify admin — urgent regardless of booking outcome
        await supabaseAdmin.functions.invoke('create-admin-notification', {
          body: {
            type: 'urgent',
            title: '⚠️ Aucun prestataire disponible',
            message: `Paiement reçu de ${clientInfo.firstName} ${clientInfo.lastName} (${clientInfo.email}) pour "${service.serviceName}" — aucun prestataire vérifié disponible. Assignation manuelle ou remboursement requis.`,
            data: { session_id: sessionId, service: service.serviceName, client_email: clientInfo.email },
            priority: 'urgent',
          },
        }).catch(() => {});

        // Email client
        await supabaseAdmin.functions.invoke('send-notification-email', {
          body: {
            to: clientInfo.email,
            type: 'booking_rejected',
            data: {
              clientName: clientInfo.firstName,
              serviceName: service.serviceName,
              bookingDate,
              bookingTime: startTime,
              location: clientInfo.address,
              price: service.price * service.quantity,
            },
          },
        }).catch(() => {});

        continue; // Move to next service — never leave client without a record or refund
      }

      logStep('Prestataire assigné', { id: availableProvider.id });

      // Statut initial : URSSAF → review admin, sinon confirmé directement
      // serviceUnmapped n'affecte pas le statut : la contrainte DB impose pending_provider ↔ provider_id IS NULL
      const initialStatus = urssafEnabled ? 'pending_urssaf' : 'confirmed';
      const unmappedNote = serviceUnmapped ? `\n⚠️ SERVICE NON IDENTIFIÉ: "${service.serviceName}" — assignation service requise` : '';

      const { data: booking, error: bookingError } = await supabaseAdmin
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
          notes: `stripe_session:${sessionId}\nEmail: ${clientInfo.email}\nTél: ${clientInfo.phone}\nNom: ${clientInfo.firstName} ${clientInfo.lastName}${unmappedNote}${urssafEnabled ? '\nURSSAF: en attente de déclaration' : ''}${customBooking.notes ? '\n' + customBooking.notes : ''}`,
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

      // Notifier le prestataire assigné (notification DB + email)
      const providerNotifText =
        `Nouvelle mission : ${service.serviceName} le ${bookingDate} de ${startTime} à ${endTime}.` +
        ` Client : ${clientInfo.firstName} ${clientInfo.lastName}.` +
        ` Adresse : ${clientInfo.address}.`;

      await supabaseAdmin
        .from('provider_notifications')
        .insert({
          provider_id: availableProvider.id,
          title:       'Nouvelle mission confirmée',
          message:     providerNotifText,
          type:        'mission_confirmed',
        })
        .then(({ error }) => {
          if (error) logStep('Erreur notification prestataire (non bloquant)', { error: error.message });
        });

      // Email au prestataire si son profil a un email
      const { data: providerProfile } = await supabaseAdmin
        .from('providers')
        .select('user_id, business_name')
        .eq('id', availableProvider.id)
        .single()
        .catch(() => ({ data: null }));

      if (providerProfile?.user_id) {
        const { data: provProfile } = await supabaseAdmin
          .from('profiles')
          .select('email, first_name, last_name')
          .eq('user_id', providerProfile.user_id)
          .maybeSingle()
          .catch(() => ({ data: null }));

        if (provProfile?.email) {
          await supabaseAdmin.functions.invoke('send-notification-email', {
            body: {
              email:   provProfile.email,
              name:    providerProfile.business_name || `${provProfile.first_name || ''} ${provProfile.last_name || ''}`.trim(),
              subject: '✅ Nouvelle mission confirmée — Bikawo',
              message: providerNotifText,
            },
          }).catch(() => {});
        }
      }
    }

    // Email de confirmation au client — envoyé une seule fois après création de tous les bookings.
    // L'idempotence est garantie par le early-return ligne ~112 si alreadyProcessed.
    if (bookingIds.length > 0 && clientInfo?.email) {
      const firstService = services[0];
      const firstCustom = firstService?.customBooking || {};
      try {
        await supabaseAdmin.functions.invoke('send-transactional-email', {
          body: {
            type: 'booking_confirmation',
            recipientEmail: clientInfo.email,
            recipientName: `${clientInfo.firstName} ${clientInfo.lastName}`,
            data: {
              clientName: clientInfo.firstName,
              serviceName: firstService?.serviceName || 'Service Bikawo',
              bookingDate: firstCustom.date || '',
              startTime: firstCustom.startTime || '09:00',
              endTime: firstCustom.endTime || '17:00',
              totalPrice: totalAmount,
              bookingId: bookingIds[0],
            },
          },
        });
        logStep('Email de confirmation envoyé au client');
      } catch (emailErr) {
        logStep('Erreur envoi email confirmation client (non bloquant)', { error: String(emailErr) });
      }
    }

    // Mettre à jour les transactions financières
    // Le trigger DB crée la transaction ; on poll jusqu'à 5× avec backoff exponentiel.
    logStep('Attente création transactions financières par trigger...');

    const now = new Date().toISOString();

    for (const bookingId of bookingIds) {
      let existingTransaction: any = null;
      let checkError: any = null;
      for (let attempt = 1; attempt <= 5; attempt++) {
        const result = await supabaseAdmin
          .from('financial_transactions')
          .select('id, payment_status, provider_payment, company_commission, stripe_commission')
          .eq('booking_id', bookingId)
          .single();
        existingTransaction = result.data;
        checkError = result.error;
        if (existingTransaction) break;
        logStep(`Transaction non trouvée, tentative ${attempt}/5, attente ${attempt * 500}ms...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }

      if (checkError || !existingTransaction) {
        logStep('Transaction non trouvée — création manuelle', { bookingId });

        // Fallback : créer la transaction si le trigger n'a pas fonctionné
        await supabaseAdmin
          .from('financial_transactions')
          .upsert({
            booking_id:               bookingId,
            client_id:                userId,
            provider_id:              null,
            service_category:         splitServiceType || 'bika_maison',
            client_price:             totalAmount,
            provider_payment:         splitProviderAmt,
            company_commission:       splitBikawoNet,
            stripe_commission:        splitStripeComm,
            hours:                    splitHours,
            payment_status:           'completed',
            client_paid_at:           now,
            stripe_payment_intent_id: stripePaymentIntentId,
          }, { onConflict: 'booking_id' });

        continue;
      }

      logStep('Transaction trouvée — marquage paid', {
        id:               existingTransaction.id,
        provider_payment: existingTransaction.provider_payment,
        stripe_commission: existingTransaction.stripe_commission,
        company_commission: existingTransaction.company_commission,
      });

      // Utiliser supabaseAdmin pour contourner les politiques RLS restrictives
      await supabaseAdmin
        .from('financial_transactions')
        .update({
          payment_status:           'completed',
          client_paid_at:           now,
          stripe_payment_intent_id: stripePaymentIntentId,
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
