import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

import { getAdminCorsHeaders } from "../_shared/cors.ts";

interface ProviderResponseRequest {
  assignmentId: string;
  providerId: string;
  responseType: 'accept' | 'decline';
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getAdminCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { assignmentId, providerId, responseType }: ProviderResponseRequest = await req.json();

    console.log(`Provider ${providerId} responding ${responseType} to assignment ${assignmentId}`);

    // 1. Vérifier que l'assignation existe et n'est pas déjà attribuée
    const { data: assignment, error: assignmentError } = await supabase
      .from('missions')
      .select('*, client_requests(*)')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.assigned_provider_id) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Mission déjà attribuée à un autre prestataire'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (new Date() > new Date(assignment.response_deadline)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Délai de réponse expiré'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 2. Enregistrer la réponse
    const responseTime = new Date(Date.now() - new Date(assignment.created_at).getTime());

    const { error: responseError } = await supabase
      .from('candidatures_prestataires')
      .insert({
        mission_assignment_id: assignmentId,
        provider_id: providerId,
        response_type: responseType === 'accept' ? 'acceptee' : 'attribuee_a_un_autre',
        response_time: responseTime
      });

    if (responseError) {
      throw responseError;
    }

    // 3. Si acceptation, attribuer la mission
    if (responseType === 'accept') {
      // Vérifier à nouveau qu'elle n'est pas déjà attribuée (race condition)
      const { data: currentAssignment } = await supabase
        .from('missions')
        .select('assigned_provider_id')
        .eq('id', assignmentId)
        .single();

      if (currentAssignment?.assigned_provider_id) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Mission déjà attribuée à un autre prestataire'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Attribuer la mission
      const { error: updateError } = await supabase
        .from('missions')
        .update({
          assigned_provider_id: providerId,
          assigned_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (updateError) {
        throw updateError;
      }

      // Récupérer la demande client complète (budget, durée, prix)
      const { data: clientRequest } = await supabase
        .from('client_requests')
        .select('service_type, preferred_date, location, budget, duration_hours, price_estimate, client_email')
        .eq('id', assignment.client_request_id)
        .single();

      // Montant réel depuis la demande client (fallback : durée × 17€ ou 34€ minimum)
      const durationHours = clientRequest?.duration_hours ?? 2;
      const montantPrestation =
        clientRequest?.budget ??
        clientRequest?.price_estimate ??
        durationHours * 17;

      await supabase
        .from('client_requests')
        .update({
          status: 'confirmee',
          assigned_provider_id: providerId,
          payment_amount: montantPrestation,
        })
        .eq('id', assignment.client_request_id);

      // Résoudre le vrai client_id (UUID) depuis son email
      const clientEmail = clientRequest?.client_email || assignment.client_requests?.client_email;
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', clientEmail)
        .maybeSingle();
      const clientUserId = clientProfile?.user_id ?? null;

      // Créer automatiquement une prestation réalisée
      await supabase
        .from('prestations_realisees')
        .insert({
          client_request_id: assignment.client_request_id,
          provider_id: providerId,
          client_id: clientUserId,
          service_type: clientRequest?.service_type || 'Service',
          duree_heures: durationHours,
          date_prestation: clientRequest?.preferred_date || new Date().toISOString().split('T')[0],
          location: clientRequest?.location || assignment.client_requests?.location,
          notes: 'Prestation créée automatiquement après acceptation du prestataire',
        });

      // Récupérer les infos du prestataire
      const { data: providerData } = await supabase
        .from('providers')
        .select('business_name, user_id')
        .eq('id', providerId)
        .single();

      // Notifier le client
      if (assignment.client_requests) {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            email: assignment.client_requests.client_email,
            name: assignment.client_requests.client_name,
            subject: 'Prestataire trouvé pour votre demande',
            message: `
              Bonne nouvelle ! Un prestataire a accepté votre demande.

              Prestataire : ${providerData?.business_name || 'Prestataire'}
              Service : ${assignment.client_requests.service_type}
              Lieu : ${assignment.client_requests.location}

              Connectez-vous à votre espace pour voir les détails et confirmer.
            `
          }
        });
      }

      // Notifier les autres prestataires que la mission est prise
      const otherProviders = assignment.eligible_providers.filter((id: string) => id !== providerId);

      for (const otherProviderId of otherProviders) {
        await supabase
          .from('provider_notifications')
          .insert({
            provider_id: otherProviderId,
            title: 'Mission attribuée',
            message: 'Cette mission a été attribuée à un autre prestataire. Merci pour votre réactivité !',
            type: 'mission_unavailable'
          });
      }

      // Mettre à jour les statistiques du prestataire
      // Lire d'abord les valeurs courantes pour incrémenter sans supabase.sql (non disponible)
      const { data: currentStats } = await supabase
        .from('providers')
        .select('missions_this_week, rotation_priority')
        .eq('id', providerId)
        .single();

      await supabase
        .from('providers')
        .update({
          missions_this_week: (currentStats?.missions_this_week ?? 0) + 1,
          last_mission_date:  new Date().toISOString(),
          rotation_priority:  (currentStats?.rotation_priority  ?? 100) - 10,
        })
        .eq('id', providerId);

      console.log(`Mission assigned to provider ${providerId}`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Mission confirmée ! Vous recevrez les détails du client.',
        assigned: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } else {
      // Si refus, juste enregistrer la réponse
      await supabase
        .from('missions')
        .update({
          responses_received: supabase.sql`responses_received + 1`
        })
        .eq('id', assignmentId);

      console.log(`Provider ${providerId} declined assignment ${assignmentId}`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Réponse enregistrée',
        assigned: false
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

  } catch (error: any) {
    const corsHeaders = getAdminCorsHeaders(req.headers.get('origin'));
    console.error('Error in provider-response:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
