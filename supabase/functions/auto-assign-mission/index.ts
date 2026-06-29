import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

import { getAdminCorsHeaders } from "../_shared/cors.ts";

interface AutoAssignRequest {
  clientRequestId: string;
  serviceType: string;
  location: string;
  postalCode?: string;
  requestedDate?: string;
}

type SupabaseClient = ReturnType<typeof createClient>;

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getAdminCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { clientRequestId, serviceType, location, postalCode, requestedDate }: AutoAssignRequest = await req.json();

    console.log('Starting auto-assignment for request:', clientRequestId);

    // 1. Trouver les prestataires éligibles avec filtrage géographique amélioré
    console.log('Searching providers for:', { serviceType, location, postalCode, requestedDate });

    const { data: eligibleProviders, error: providersError } = await supabase.rpc('find_eligible_providers', {
      p_service_type: serviceType,
      p_location: location,
      p_postal_code: postalCode || null,
      p_requested_date: requestedDate ? new Date(requestedDate).toISOString() : null
    });

    if (providersError) {
      console.error('Error finding eligible providers:', providersError);
      throw providersError;
    }

    if (!eligibleProviders || eligibleProviders.length === 0) {
      console.log('No eligible providers found');

      // Marquer la demande comme non pourvue
      await supabase
        .from('client_requests')
        .update({ status: 'unmatched' })
        .eq('id', clientRequestId);

      // Notifier l'admin
      await supabase.functions.invoke('send-notification-email', {
        body: {
          email: 'admin@bikawo.com',
          name: 'Admin',
          subject: 'Demande non pourvue',
          message: `La demande ${clientRequestId} pour ${serviceType} à ${location} n'a trouvé aucun prestataire disponible.`
        }
      });

      return new Response(JSON.stringify({
        success: false,
        message: 'No eligible providers found',
        eligibleCount: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log(`Found ${eligibleProviders.length} eligible providers`);

    // 2. Créer l'assignation de mission
    const providerIds = eligibleProviders.map((p: any) => p.provider_id);
    const responseDeadline = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const { data: missionAssignment, error: assignmentError } = await supabase
      .from('missions')
      .insert({
        client_request_id: clientRequestId,
        eligible_providers: providerIds,
        response_deadline: responseDeadline.toISOString(),
        sent_notifications: 0,
        responses_received: 0,
        assigned_by_admin: false
      })
      .select()
      .single();

    if (assignmentError) {
      console.error('Error creating mission assignment:', assignmentError);
      throw assignmentError;
    }

    console.log('Mission assignment created:', missionAssignment.id);

    // 3. Envoyer les notifications aux prestataires éligibles
    let notificationsSent = 0;

    for (const provider of eligibleProviders) {
      try {
        // Récupérer les informations du prestataire
        const { data: providerData } = await supabase
          .from('providers')
          .select('user_id, business_name')
          .eq('id', provider.provider_id)
          .single();

        if (providerData) {
          // Récupérer le profil complet du prestataire (email inclus)
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('user_id', providerData.user_id)
            .single();

          const providerName = providerData.business_name ||
            `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim() ||
            'Prestataire';
          const providerEmail = profileData?.email || '';

          // Créer notification dans la base
          await supabase
            .from('provider_notifications')
            .insert({
              provider_id: provider.provider_id,
              title: 'Nouvelle mission disponible',
              message: `Nouvelle mission : ${serviceType} à ${location}. Vous avez 5 minutes pour accepter.`,
              type: 'mission_available'
            });

          // Envoyer email uniquement si on a un vrai email
          if (providerEmail) {
            await supabase.functions.invoke('send-notification-email', {
              body: {
                email: providerEmail,
                name: providerName,
                subject: '🚨 Nouvelle mission disponible - 5 minutes pour répondre',
                message: `
                  Nouvelle mission disponible !

                  Service : ${serviceType}
                  Lieu : ${location}

                  ⏰ Vous avez 5 minutes pour accepter cette mission.

                  Connectez-vous à votre espace prestataire pour répondre.
                `
              }
            });
          }

          notificationsSent++;
        }
      } catch (error) {
        console.error(`Error sending notification to provider ${provider.provider_id}:`, error);
      }
    }

    // 4. Mettre à jour le nombre de notifications envoyées
    await supabase
      .from('missions')
      .update({ sent_notifications: notificationsSent })
      .eq('id', missionAssignment.id);

    // La vérification du timeout est gérée par le cron check-mission-acceptance-timeout
    // (toutes les 15 min) — un setTimeout dans un Edge Function Deno serait tué avant 5 min.
    console.log(`Assignment complete. Sent ${notificationsSent} notifications`);

    return new Response(JSON.stringify({
      success: true,
      assignmentId: missionAssignment.id,
      eligibleCount: eligibleProviders.length,
      notificationsSent
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    const corsHeaders = getAdminCorsHeaders(req.headers.get('origin'));
    console.error('Error in auto-assign-mission:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
