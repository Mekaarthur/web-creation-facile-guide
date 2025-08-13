import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoAssignRequest {
  clientRequestId: string;
  serviceType: string;
  location: string;
  postalCode?: string;
  requestedDate?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientRequestId, serviceType, location, postalCode, requestedDate }: AutoAssignRequest = await req.json();

    console.log('Starting auto-assignment for request:', clientRequestId);

    // 1. Trouver les prestataires éligibles
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
          email: 'admin@bikawo.fr',
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
      .from('mission_assignments')
      .insert({
        client_request_id: clientRequestId,
        eligible_providers: providerIds,
        response_deadline: responseDeadline.toISOString(),
        sent_notifications: 0,
        responses_received: 0
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
          // Récupérer l'email du prestataire
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', providerData.user_id)
            .single();

          // Créer notification dans la base
          await supabase
            .from('provider_notifications')
            .insert({
              provider_id: provider.provider_id,
              title: 'Nouvelle mission disponible',
              message: `Nouvelle mission : ${serviceType} à ${location}. Vous avez 5 minutes pour accepter.`,
              type: 'mission_available'
            });

          // Envoyer email de notification (optionnel)
          const providerName = providerData.business_name || 
            `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim() ||
            'Prestataire';

          await supabase.functions.invoke('send-notification-email', {
            body: {
              email: providerData.user_id, // Utiliser user_id comme placeholder
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

          notificationsSent++;
        }
      } catch (error) {
        console.error(`Error sending notification to provider ${provider.provider_id}:`, error);
      }
    }

    // 4. Mettre à jour le nombre de notifications envoyées
    await supabase
      .from('mission_assignments')
      .update({ sent_notifications: notificationsSent })
      .eq('id', missionAssignment.id);

    // 5. Programmer la vérification automatique après 5 minutes
    setTimeout(async () => {
      await checkMissionTimeout(missionAssignment.id);
    }, 5 * 60 * 1000);

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
    console.error('Error in auto-assign-mission:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

async function checkMissionTimeout(assignmentId: string) {
  try {
    console.log('Checking timeout for assignment:', assignmentId);

    const { data: assignment } = await supabase
      .from('mission_assignments')
      .select('*, client_requests(*)')
      .eq('id', assignmentId)
      .single();

    if (!assignment || assignment.assigned_provider_id) {
      console.log('Assignment already processed or assigned');
      return;
    }

    // Marquer comme non pourvue si pas de réponse
    await supabase
      .from('client_requests')
      .update({ status: 'unmatched' })
      .eq('id', assignment.client_request_id);

    // Notifier l'admin
    await supabase.functions.invoke('send-notification-email', {
      body: {
        email: 'admin@bikawo.fr',
        name: 'Admin',
        subject: 'Mission expirée sans réponse',
        message: `La mission ${assignment.client_request_id} a expiré sans qu'aucun prestataire ne réponde.`
      }
    });

    console.log('Mission marked as unmatched due to timeout');

  } catch (error) {
    console.error('Error in checkMissionTimeout:', error);
  }
}

serve(handler);