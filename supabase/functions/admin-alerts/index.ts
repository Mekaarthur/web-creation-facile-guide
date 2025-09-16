import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...requestData } = await req.json();

    switch (action) {
      case 'get_system_alerts':
        return new Response(JSON.stringify(await getSystemAlerts(supabase)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'get_business_alerts':
        return new Response(JSON.stringify(await getBusinessAlerts(supabase)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'dismiss_alert':
        return new Response(JSON.stringify(await dismissAlert(supabase, requestData)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'create_alert':
        return new Response(JSON.stringify(await createAlert(supabase, requestData)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      default:
        throw new Error(`Action non reconnue: ${action}`);
    }
  } catch (error) {
    console.error('Erreur dans admin-alerts:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getSystemAlerts(supabase: any) {
  const alerts = [];

  // Vérifier les incidents non résolus
  const { data: incidents } = await supabase
    .from('incidents')
    .select('*')
    .neq('status', 'resolved')
    .order('created_at', { ascending: false });

  if (incidents && incidents.length > 0) {
    alerts.push({
      id: 'incidents_open',
      type: 'error',
      title: 'Incidents non résolus',
      message: `${incidents.length} incident(s) nécessitent votre attention`,
      data: { count: incidents.length },
      created_at: new Date().toISOString()
    });
  }

  // Vérifier les paiements échoués récents
  const { data: failedPayments } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'failed')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (failedPayments && failedPayments.length > 0) {
    alerts.push({
      id: 'payments_failed',
      type: 'warning',
      title: 'Paiements échoués',
      message: `${failedPayments.length} paiement(s) ont échoué dans les dernières 24h`,
      data: { count: failedPayments.length },
      created_at: new Date().toISOString()
    });
  }

  // Vérifier les prestataires en attente depuis trop longtemps
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { data: pendingProviders } = await supabase
    .from('providers')
    .select('*')
    .eq('status', 'pending')
    .lt('created_at', weekAgo.toISOString());

  if (pendingProviders && pendingProviders.length > 0) {
    alerts.push({
      id: 'providers_pending',
      type: 'info',
      title: 'Prestataires en attente',
      message: `${pendingProviders.length} prestataire(s) attendent validation depuis plus d'une semaine`,
      data: { count: pendingProviders.length },
      created_at: new Date().toISOString()
    });
  }

  // Vérifier les avis en attente de modération
  const { data: pendingReviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_approved', false);

  if (pendingReviews && pendingReviews.length > 0) {
    alerts.push({
      id: 'reviews_pending',
      type: 'info',
      title: 'Avis en attente',
      message: `${pendingReviews.length} avis attendent modération`,
      data: { count: pendingReviews.length },
      created_at: new Date().toISOString()
    });
  }

  return {
    success: true,
    alerts
  };
}

async function getBusinessAlerts(supabase: any) {
  const alerts = [];
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  // Vérifier la baisse d'activité
  const { data: todayBookings } = await supabase
    .from('bookings')
    .select('*')
    .gte('created_at', today.toISOString().split('T')[0]);

  const { data: yesterdayBookings } = await supabase
    .from('bookings')
    .select('*')
    .gte('created_at', yesterday.toISOString().split('T')[0])
    .lt('created_at', today.toISOString().split('T')[0]);

  const todayCount = todayBookings?.length || 0;
  const yesterdayCount = yesterdayBookings?.length || 0;

  if (yesterdayCount > 0 && todayCount < yesterdayCount * 0.7) {
    alerts.push({
      id: 'bookings_decline',
      type: 'warning',
      title: 'Baisse d\'activité',
      message: `${Math.round((1 - todayCount/yesterdayCount) * 100)}% de baisse des réservations aujourd'hui`,
      data: { today: todayCount, yesterday: yesterdayCount },
      created_at: new Date().toISOString()
    });
  }

  // Vérifier les prestataires inactifs
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { data: inactiveProviders } = await supabase
    .from('providers')
    .select('*')
    .eq('status', 'active')
    .lt('last_activity_at', weekAgo.toISOString());

  if (inactiveProviders && inactiveProviders.length > 10) {
    alerts.push({
      id: 'providers_inactive',
      type: 'info',
      title: 'Prestataires inactifs',
      message: `${inactiveProviders.length} prestataires n'ont pas été actifs cette semaine`,
      data: { count: inactiveProviders.length },
      created_at: new Date().toISOString()
    });
  }

  // Vérifier les paniers abandonnés
  const { data: abandonedCarts } = await supabase
    .from('carts')
    .select('*')
    .eq('status', 'active')
    .lt('updated_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()); // 2h

  if (abandonedCarts && abandonedCarts.length > 20) {
    alerts.push({
      id: 'carts_abandoned',
      type: 'info',
      title: 'Paniers abandonnés',
      message: `${abandonedCarts.length} paniers ont été abandonnés récemment`,
      data: { count: abandonedCarts.length },
      created_at: new Date().toISOString()
    });
  }

  return {
    success: true,
    alerts
  };
}

async function dismissAlert(supabase: any, { alertId }: any) {
  // Pour l'instant, on simule le dismiss en loggant l'action
  await supabase
    .from('admin_actions_log')
    .insert({
      entity_type: 'alert',
      entity_id: alertId,
      action_type: 'dismiss',
      description: 'Alerte masquée par administrateur'
    });

  return {
    success: true,
    message: 'Alerte masquée'
  };
}

async function createAlert(supabase: any, { type, title, message, data }: any) {
  // Logger la création d'alerte personnalisée
  await supabase
    .from('admin_actions_log')
    .insert({
      entity_type: 'alert',
      action_type: 'create',
      description: `Alerte créée: ${title}`,
      new_data: { type, title, message, data }
    });

  // Créer une notification système
  const { data: adminUsers } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');

  if (adminUsers) {
    for (const admin of adminUsers) {
      await supabase
        .from('realtime_notifications')
        .insert({
          user_id: admin.user_id,
          type: 'admin_alert',
          title,
          message,
          data,
          priority: type === 'error' ? 'high' : 'normal'
        });
    }
  }

  return {
    success: true,
    message: 'Alerte créée et envoyée aux administrateurs'
  };
}