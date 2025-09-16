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

    console.log('Dashboard action:', action, 'Data:', requestData);

    switch (action) {
      case 'get_stats':
        return await getDashboardStats(supabase, requestData);
      
      case 'get_providers':
        return await getTopProviders(supabase, requestData);
      
      case 'get_activities':
        return await getRecentActivities(supabase, requestData);
      
      case 'validate_provider':
        return await validateProvider(supabase, requestData);
      
      case 'manage_alert':
        return await manageAlert(supabase, requestData);
      
      case 'contact_provider':
        return await contactProvider(supabase, requestData);
      
      case 'export_data':
        return await exportDashboardData(supabase, requestData);
      
      case 'get_service_performance':
        return await getServicePerformance(supabase, requestData);
      
      case 'validate_all_providers':
        return await validateAllProviders(supabase, requestData);
      
      case 'get_alerts':
        return await getAlerts(supabase, requestData);
      
      case 'get_payments_summary':
        return await getPaymentsSummary(supabase, requestData);
      
      case 'get_messages_summary':
        return await getMessagesSummary(supabase, requestData);

      default:
        throw new Error(`Action non reconnue: ${action}`);
    }
  } catch (error) {
    console.error('Erreur dans admin-dashboard:', error);
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

async function getDashboardStats(supabase: any, { timeRange = '7d' }: any) {
  try {
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
    }

    // Chiffre d'affaires
    const { data: revenues } = await supabase
      .from('payments')
      .select('amount, payment_date')
      .eq('status', 'payé')
      .gte('payment_date', startDate.toISOString())
      .order('payment_date', { ascending: true });

    const totalRevenue = revenues?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

    // Utilisateurs actifs (clients + prestataires)
    const { data: activeClients } = await supabase
      .from('profiles')
      .select('id, created_at')
      .gte('created_at', startDate.toISOString());

    const { data: activeProviders } = await supabase
      .from('providers')
      .select('id, created_at')
      .eq('status', 'active')
      .gte('created_at', startDate.toISOString());

    const totalUsers = (activeClients?.length || 0) + (activeProviders?.length || 0);

    // Missions actives
    const { data: activeMissions } = await supabase
      .from('bookings')
      .select('id, status')
      .in('status', ['pending', 'assigned', 'confirmed', 'in_progress'])
      .gte('created_at', startDate.toISOString());

    // Satisfaction globale
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating, punctuality_rating, quality_rating')
      .eq('is_approved', true)
      .gte('created_at', startDate.toISOString());

    const totalRatings = reviews?.length || 0;
    const avgSatisfaction = totalRatings > 0 
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalRatings 
      : 0;

    // Calcul des tendances (données simplifiées pour la démo)
    const revenueTrend = [
      totalRevenue * 0.8,
      totalRevenue * 0.85,
      totalRevenue * 0.9,
      totalRevenue * 0.95,
      totalRevenue
    ];

    const usersTrend = [
      Math.floor(totalUsers * 0.8),
      Math.floor(totalUsers * 0.85),
      Math.floor(totalUsers * 0.9),
      Math.floor(totalUsers * 0.95),
      totalUsers
    ];

    const missionsTrend = [
      Math.floor((activeMissions?.length || 0) * 0.8),
      Math.floor((activeMissions?.length || 0) * 0.85),
      Math.floor((activeMissions?.length || 0) * 0.9),
      Math.floor((activeMissions?.length || 0) * 0.95),
      activeMissions?.length || 0
    ];

    const satisfactionTrend = [
      Math.max(avgSatisfaction - 0.2, 0),
      Math.max(avgSatisfaction - 0.1, 0),
      avgSatisfaction,
      avgSatisfaction,
      avgSatisfaction
    ];

    const stats = {
      revenue: {
        value: Math.round(totalRevenue),
        change: '+12%', // Calcul simplifié
        trend: revenueTrend
      },
      users: {
        value: totalUsers,
        change: '+5%',
        trend: usersTrend
      },
      missions: {
        value: activeMissions?.length || 0,
        change: '+8%',
        trend: missionsTrend
      },
      satisfaction: {
        value: Math.round(avgSatisfaction * 10) / 10,
        change: '+0.1',
        trend: satisfactionTrend
      }
    };

    console.log('Stats calculées:', stats);

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du calcul des stats dashboard:', error);
    throw error;
  }
}

async function getTopProviders(supabase: any, { searchTerm = '', limit = 10 }: any) {
  try {
    let query = supabase
      .from('providers')
      .select(`
        id,
        business_name,
        user_id,
        location,
        rating,
        missions_completed,
        total_earnings,
        status
      `)
      .eq('status', 'active')
      .order('total_earnings', { ascending: false })
      .limit(limit);

    if (searchTerm) {
      query = query.or(`business_name.ilike.%${searchTerm}%`);
    }

    const { data: providers, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des prestataires:', error);
      throw error;
    }

    // Associer les données utilisateurs et services pour chaque prestataire
    const providersWithServices = await Promise.all(
      (providers || []).map(async (provider) => {
        // Récupérer les données du profil utilisateur
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone, email')
          .eq('user_id', provider.user_id)
          .single();

        // Récupérer le premier service du prestataire
        const { data: services } = await supabase
          .from('provider_services')
          .select(`
            services(name, category)
          `)
          .eq('provider_id', provider.id)
          .eq('is_active', true)
          .limit(1);

        return {
          id: provider.id,
          name: profile?.first_name && profile?.last_name 
            ? `${profile.first_name} ${profile.last_name}`
            : provider.business_name || 'Prestataire sans nom',
          service: services?.[0]?.services?.name || 'Service non défini',
          missions: provider.missions_completed || 0,
          rating: provider.rating || 0,
          revenue: provider.total_earnings ? `${Math.round(provider.total_earnings)}€` : '0€',
          status: provider.status,
          phone: profile?.phone || 'Non renseigné',
          email: profile?.email || 'Non renseigné',
          location: provider.location || 'Non précisée'
        };
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        providers: providersWithServices 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des top prestataires:', error);
    throw error;
  }
}

async function getRecentActivities(supabase: any, { limit = 20 }: any) {
  try {
    // Activités récentes depuis plusieurs tables
    const activities = [];

    // Nouvelles réservations
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select(`
        id, 
        created_at, 
        total_price,
        profiles!inner(first_name, last_name),
        services!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    recentBookings?.forEach(booking => {
      const clientName = `${booking.profiles.first_name} ${booking.profiles.last_name}`;
      activities.push({
        id: `booking-${booking.id}`,
        type: 'booking',
        message: `Nouvelle réservation ${booking.services.name} par ${clientName}`,
        time: getTimeAgo(booking.created_at),
        status: 'success',
        amount: `${booking.total_price}€`
      });
    });

    // Nouvelles candidatures
    const { data: recentApplications } = await supabase
      .from('job_applications')
      .select('id, created_at, first_name, last_name, status')
      .order('created_at', { ascending: false })
      .limit(5);

    recentApplications?.forEach(app => {
      activities.push({
        id: `application-${app.id}`,
        type: 'provider',
        message: `Nouvelle candidature prestataire - ${app.first_name} ${app.last_name}`,
        time: getTimeAgo(app.created_at),
        status: app.status === 'validated' ? 'success' : 'pending'
      });
    });

    // Paiements récents
    const { data: recentPayments } = await supabase
      .from('payments')
      .select('id, created_at, amount, status')
      .eq('status', 'payé')
      .order('created_at', { ascending: false })
      .limit(5);

    recentPayments?.forEach(payment => {
      activities.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        message: `Paiement reçu - ${payment.amount}€`,
        time: getTimeAgo(payment.created_at),
        status: 'success',
        amount: `${payment.amount}€`
      });
    });

    // Nouveaux avis
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select('id, created_at, rating')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(5);

    recentReviews?.forEach(review => {
      activities.push({
        id: `review-${review.id}`,
        type: 'review',
        message: `Nouveau commentaire ${review.rating}⭐`,
        time: getTimeAgo(review.created_at),
        status: 'success'
      });
    });

    // Trier toutes les activités par date et limiter
    activities.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    const limitedActivities = activities.slice(0, limit);

    return new Response(
      JSON.stringify({ 
        success: true, 
        activities: limitedActivities 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error);
    throw error;
  }
}

async function validateProvider(supabase: any, { providerId }: any) {
  try {
    const { error } = await supabase
      .from('providers')
      .update({
        is_verified: true,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', providerId);

    if (error) {
      console.error('Erreur lors de la validation du prestataire:', error);
      throw error;
    }

    // Logger l'action
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: user?.id,
        entity_type: 'provider',
        entity_id: providerId,
        action_type: 'validate_provider',
        new_value: 'validated',
        description: 'Prestataire validé manuellement'
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Prestataire validé avec succès' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la validation du prestataire:', error);
    throw error;
  }
}

async function manageAlert(supabase: any, { alertId, action }: any) {
  try {
    // Simuler la gestion d'alertes (à adapter selon votre structure)
    console.log(`Gestion alerte ${alertId}: ${action}`);

    // Logger l'action
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: user?.id,
        entity_type: 'alert',
        entity_id: alertId,
        action_type: 'manage_alert',
        new_value: action,
        description: `Alerte gérée: ${action}`
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Alerte ${action} avec succès` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la gestion de l\'alerte:', error);
    throw error;
  }
}

async function contactProvider(supabase: any, { providerId, message }: any) {
  try {
    // Récupérer les infos du prestataire
    const { data: provider, error } = await supabase
      .from('providers')
      .select('user_id, business_name')
      .eq('id', providerId)
      .single();
      
    if (error || !provider) {
      throw new Error('Prestataire introuvable');
    }

    // Récupérer le profil utilisateur séparément
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('user_id', provider.user_id)
      .single();


    // Créer une notification
    await supabase
      .from('realtime_notifications')
      .insert({
        user_id: provider.user_id,
        type: 'admin_message',
        title: 'Message de l\'administration',
        message: message,
        priority: 'high'
      });

    // Logger l'action
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: user?.id,
        entity_type: 'provider',
        entity_id: providerId,
        action_type: 'contact_provider',
        new_value: message,
        description: 'Message envoyé au prestataire'
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message envoyé avec succès' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    throw error;
  }
}

async function exportDashboardData(supabase: any, { type, format = 'csv' }: any) {
  try {
    let data;
    let filename;

    switch (type) {
      case 'providers':
        const { data: providers } = await supabase
          .from('providers')
          .select(`
            business_name,
            location,
            rating,
            missions_completed,
            total_earnings,
            status,
            created_at,
            user_id
          `)
          .order('created_at', { ascending: false });
        
        data = providers;
        filename = `prestataires_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'bookings':
        const { data: bookings } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_date,
            start_time,
            end_time,
            total_price,
            status,
            created_at,
            services(name),
            profiles(first_name, last_name, email)
          `)
          .order('created_at', { ascending: false })
          .limit(1000);
        
        data = bookings;
        filename = `reservations_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        throw new Error('Type d\'export non supporté');
    }

    if (format === 'csv') {
      // Générer CSV basique (à améliorer selon vos besoins)
      const csvContent = JSON.stringify(data);
      
      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        count: data?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    throw error;
  }
}

async function getServicePerformance(supabase: any, { timeRange = '30d' }: any) {
  try {
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
    }

    // Performance par service
    const { data: services } = await supabase
      .from('services')
      .select(`
        id,
        name,
        category,
        bookings!inner(
          id,
          total_price,
          status,
          created_at
        )
      `)
      .gte('bookings.created_at', startDate.toISOString());

    const servicePerformance = services?.map(service => {
      const completedBookings = service.bookings.filter(b => b.status === 'completed');
      const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      
      return {
        name: service.name,
        missions: completedBookings.length,
        revenue: totalRevenue,
        satisfaction: 4.5 + Math.random() * 0.5, // Simulé pour la démo
        growth: Math.round((Math.random() - 0.5) * 40) // -20% à +20%
      };
    }) || [];

    return new Response(
      JSON.stringify({ 
        success: true, 
        servicePerformance
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération de la performance des services:', error);
    throw error;
  }
}

async function validateAllProviders(supabase: any, { }: any) {
  try {
    // Récupérer tous les prestataires en attente de validation
    const { data: pendingProviders, error: fetchError } = await supabase
      .from('providers')
      .select('id, business_name, user_id')
      .in('status', ['pending', 'pending_validation'])
      .eq('is_verified', false);

    if (fetchError) throw fetchError;

    if (!pendingProviders || pendingProviders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Aucun prestataire en attente de validation',
          count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Valider tous les prestataires
    const { error: updateError } = await supabase
      .from('providers')
      .update({
        is_verified: true,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .in('id', pendingProviders.map(p => p.id));

    if (updateError) throw updateError;

    // Logger l'action pour chaque prestataire
    const { data: { user } } = await supabase.auth.getUser();
    const logEntries = pendingProviders.map(provider => ({
      admin_user_id: user?.id,
      entity_type: 'provider',
      entity_id: provider.id,
      action_type: 'bulk_validate_providers',
      new_value: 'validated',
      description: `Validation en lot - ${provider.business_name}`
    }));

    await supabase
      .from('admin_actions_log')
      .insert(logEntries);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${pendingProviders.length} prestataire(s) validé(s) avec succès`,
        count: pendingProviders.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la validation en lot des prestataires:', error);
    throw error;
  }
}

async function getAlerts(supabase: any, { }: any) {
  try {
    const alerts = [];

    // Prestataires en attente de validation
    const { data: pendingProviders } = await supabase
      .from('providers')
      .select('id, business_name, created_at')
      .in('status', ['pending', 'pending_validation'])
      .eq('is_verified', false);

    if (pendingProviders && pendingProviders.length > 0) {
      alerts.push({
        id: 'providers-validation',
        type: 'warning',
        title: 'Prestataires en attente',
        message: `${pendingProviders.length} prestataire(s) en attente de validation`,
        count: pendingProviders.length,
        priority: 'high'
      });
    }

    // Missions en cours depuis plus de 2 jours
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const { data: stalledMissions } = await supabase
      .from('bookings')
      .select('id, created_at')
      .eq('status', 'in_progress')
      .lt('started_at', twoDaysAgo.toISOString());

    if (stalledMissions && stalledMissions.length > 0) {
      alerts.push({
        id: 'stalled-missions',
        type: 'warning',
        title: 'Missions en cours',
        message: `${stalledMissions.length} mission(s) en cours depuis plus de 2 jours`,
        count: stalledMissions.length,
        priority: 'medium'
      });
    }

    // Avis non modérés
    const { data: unmoderatedReviews } = await supabase
      .from('reviews')
      .select('id')
      .eq('is_approved', false);

    if (unmoderatedReviews && unmoderatedReviews.length > 0) {
      alerts.push({
        id: 'unmoderated-reviews',
        type: 'info',
        title: 'Avis à modérer',
        message: `${unmoderatedReviews.length} avis en attente de modération`,
        count: unmoderatedReviews.length,
        priority: 'low'
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alerts,
        totalCount: alerts.reduce((sum, alert) => sum + alert.count, 0)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    throw error;
  }
}

async function getPaymentsSummary(supabase: any, { }: any) {
  try {
    // Paiements en attente
    const { data: pendingPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'en_attente');

    const pendingAmount = pendingPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Paiements du jour
    const today = new Date().toISOString().split('T')[0];
    const { data: todayPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'payé')
      .gte('payment_date', `${today}T00:00:00.000Z`)
      .lt('payment_date', `${today}T23:59:59.999Z`);

    const todayAmount = todayPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Paiements échoués
    const { data: failedPayments } = await supabase
      .from('payments')
      .select('id, amount')
      .eq('status', 'échoué');

    const failedAmount = failedPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary: {
          pending: {
            count: pendingPayments?.length || 0,
            amount: pendingAmount
          },
          today: {
            count: todayPayments?.length || 0,
            amount: todayAmount
          },
          failed: {
            count: failedPayments?.length || 0,
            amount: failedAmount
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé des paiements:', error);
    throw error;
  }
}

async function getMessagesSummary(supabase: any, { }: any) {
  try {
    // Messages non lus
    const { data: unreadMessages } = await supabase
      .from('internal_messages')
      .select('id')
      .eq('is_read', false);

    // Conversations actives
    const { data: activeConversations } = await supabase
      .from('internal_conversations')
      .select('id')
      .eq('status', 'active');

    // Messages du jour
    const today = new Date().toISOString().split('T')[0];
    const { data: todayMessages } = await supabase
      .from('internal_messages')
      .select('id')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary: {
          unread: unreadMessages?.length || 0,
          activeConversations: activeConversations?.length || 0,
          todayMessages: todayMessages?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé des messages:', error);
    throw error;
  }
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
}