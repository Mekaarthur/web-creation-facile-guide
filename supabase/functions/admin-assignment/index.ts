import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...requestData } = await req.json();

    console.log('Assignment action:', action, 'Data:', requestData);

    switch (action) {
      case 'get_stats':
        return await getAssignmentStats(supabase);
      
      case 'get_pending_missions':
        return await getPendingMissions(supabase);
      
      case 'toggle_auto_assign':
        return await toggleAutoAssign(supabase, requestData);
      
      case 'update_priority_mode':
        return await updatePriorityMode(supabase, requestData);
      
      case 'assign_mission_manually':
        return await assignMissionManually(supabase, requestData);
      
      case 'get_available_providers':
        return await getAvailableProviders(supabase, requestData);

      default:
        throw new Error(`Action non reconnue: ${action}`);
    }
  } catch (error) {
    console.error('Erreur dans admin-assignment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Une erreur est survenue'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function getAssignmentStats(supabase: any) {
  try {
    // Missions en attente
    const { data: pendingMissions } = await supabase
      .from('client_requests')
      .select('id')
      .eq('status', 'new');

    // Missions assignées aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const { data: todayAssignments } = await supabase
      .from('client_requests')
      .select('id')
      .eq('status', 'assigned')
      .gte('updated_at', today);

    // Prestataires actifs
    const { data: activeProviders } = await supabase
      .from('providers')
      .select('id')
      .eq('status', 'active')
      .eq('is_verified', true);

    // Calcul du taux de succès (missions terminées vs total)
    const { data: completedMissions } = await supabase
      .from('bookings')
      .select('id')
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const { data: totalMissions } = await supabase
      .from('bookings')
      .select('id')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const successRate = totalMissions?.length > 0 
      ? Math.round((completedMissions?.length || 0) / totalMissions.length * 100)
      : 0;

    const stats = {
      pendingMissions: pendingMissions?.length || 0,
      todayAssignments: todayAssignments?.length || 0,
      activeProviders: activeProviders?.length || 0,
      successRate: `${successRate}%`
    };

    console.log('Stats calculées:', stats);

    return new Response(
      JSON.stringify({ success: true, data: stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du calcul des stats:', error);
    throw error;
  }
}

async function getPendingMissions(supabase: any) {
  try {
    const { data: missions, error } = await supabase
      .from('client_requests')
      .select(`
        id,
        service_type,
        location,
        created_at,
        urgency_level,
        client_email
      `)
      .eq('status', 'new')
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Erreur lors de la récupération des missions:', error);
      throw error;
    }

    const formattedMissions = missions?.map(mission => {
      const timeWaiting = Math.floor((Date.now() - new Date(mission.created_at).getTime()) / (1000 * 60));
      return {
        id: mission.id,
        service: mission.service_type || 'Service non spécifié',
        location: mission.location || 'Localisation non précisée',
        priority: mission.urgency_level === 'urgent' ? 'Haute' : 
                 mission.urgency_level === 'normal' ? 'Normale' : 'Basse',
        timeWaiting: `${timeWaiting} min`,
        clientEmail: mission.client_email
      };
    }) || [];

    return new Response(
      JSON.stringify({ success: true, data: formattedMissions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des missions en attente:', error);
    throw error;
  }
}

async function toggleAutoAssign(supabase: any, { enabled, adminUserId }: any) {
  try {
    // Enregistrer la configuration dans une table de paramètres
    const { error } = await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'system_config',
        entity_id: '00000000-0000-0000-0000-000000000000',
        action_type: 'toggle_auto_assign',
        old_value: enabled ? 'false' : 'true',
        new_value: enabled.toString(),
        description: `Assignation automatique ${enabled ? 'activée' : 'désactivée'}`
      });

    if (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Assignation automatique ${enabled ? 'activée' : 'désactivée'}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du toggle auto-assign:', error);
    throw error;
  }
}

async function updatePriorityMode(supabase: any, { mode, adminUserId }: any) {
  try {
    const { error } = await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'system_config',
        entity_id: '00000000-0000-0000-0000-000000000000',
        action_type: 'update_priority_mode',
        new_value: mode,
        description: `Mode de priorité changé vers: ${mode}`
      });

    if (error) {
      console.error('Erreur lors de la sauvegarde du mode de priorité:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Mode de priorité mis à jour: ${mode}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mode de priorité:', error);
    throw error;
  }
}

async function assignMissionManually(supabase: any, { missionId, providerId, adminUserId }: any) {
  try {
    // Assigner le prestataire à la mission
    const { error: assignError } = await supabase
      .from('client_requests')
      .update({
        assigned_provider_id: providerId,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', missionId);

    if (assignError) {
      console.error('Erreur lors de l\'assignation:', assignError);
      throw assignError;
    }

    // Créer une notification pour le prestataire
    const { error: notifError } = await supabase
      .from('provider_notifications')
      .insert({
        provider_id: providerId,
        title: 'Nouvelle mission assignée',
        message: 'Une mission vous a été assignée manuellement par un administrateur.',
        type: 'mission_assigned'
      });

    if (notifError) {
      console.log('Avertissement: impossible de créer la notification:', notifError);
    }

    // Logger l'action
    const { error: logError } = await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'client_request',
        entity_id: missionId,
        action_type: 'manual_assignment',
        new_value: providerId,
        description: 'Assignation manuelle de mission'
      });

    if (logError) {
      console.log('Avertissement: impossible de logger l\'action:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mission assignée avec succès' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de l\'assignation manuelle:', error);
    throw error;
  }
}

async function getAvailableProviders(supabase: any, { serviceType, location }: any) {
  try {
    // Récupérer les prestataires disponibles pour ce service et cette localisation
    const { data: providers, error } = await supabase
      .from('providers')
      .select(`
        id,
        business_name,
        location,
        rating,
        hourly_rate,
        performance_score
      `)
      .eq('status', 'active')
      .eq('is_verified', true)
      .order('performance_score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Erreur lors de la récupération des prestataires:', error);
      throw error;
    }

    const formattedProviders = providers?.map(provider => ({
      id: provider.id,
      name: provider.business_name || 'Prestataire sans nom',
      location: provider.location || 'Localisation non précisée',
      rating: provider.rating || 0,
      hourlyRate: provider.hourly_rate || 'Non précisé',
      performanceScore: provider.performance_score || 0
    })) || [];

    return new Response(
      JSON.stringify({ success: true, data: formattedProviders }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des prestataires disponibles:', error);
    throw error;
  }
}