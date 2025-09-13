import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...params } = await req.json()
    console.log(`Real-time KPIs action: ${action}`, params)

    let result;

    switch (action) {
      case 'calculate_conversion_rate':
        result = await calculateConversionRate(supabase, params);
        break;
      case 'calculate_response_times':
        result = await calculateResponseTimes(supabase, params);
        break;
      case 'calculate_cancellation_rate':
        result = await calculateCancellationRate(supabase, params);
        break;
      case 'calculate_retention_rates':
        result = await calculateRetentionRates(supabase, params);
        break;
      case 'get_all_kpis':
        result = await getAllRealTimeKPIs(supabase, params);
        break;
      case 'provider_performance':
        result = await calculateProviderPerformance(supabase, params);
        break;
      default:
        throw new Error(`Action non supportée: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Real-time KPIs error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Erreur interne du serveur' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

async function calculateConversionRate(supabase: any, { timeRange = '30d' }: any) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Étapes du funnel de conversion
  const [requestsResult, bookingsResult, paymentsResult] = await Promise.all([
    // 1. Demandes clients initiales
    supabase
      .from('client_requests')
      .select('id, created_at, status')
      .gte('created_at', startDate.toISOString()),
    
    // 2. Réservations créées
    supabase
      .from('bookings')
      .select('id, created_at, status, client_id')
      .gte('created_at', startDate.toISOString()),
    
    // 3. Paiements confirmés
    supabase
      .from('payments')
      .select('id, created_at, status, client_id')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'confirme')
  ]);

  if (requestsResult.error || bookingsResult.error || paymentsResult.error) {
    throw new Error('Erreur lors du calcul du taux de conversion');
  }

  const totalRequests = requestsResult.data?.length || 0;
  const totalBookings = bookingsResult.data?.length || 0;
  const totalPayments = paymentsResult.data?.length || 0;

  const conversionMetrics = {
    request_to_booking: totalRequests > 0 ? (totalBookings / totalRequests) * 100 : 0,
    booking_to_payment: totalBookings > 0 ? (totalPayments / totalBookings) * 100 : 0,
    overall_conversion: totalRequests > 0 ? (totalPayments / totalRequests) * 100 : 0,
    funnel_data: {
      step1_requests: totalRequests,
      step2_bookings: totalBookings,
      step3_payments: totalPayments
    },
    drop_off_points: {
      request_to_booking_loss: totalRequests - totalBookings,
      booking_to_payment_loss: totalBookings - totalPayments
    }
  };

  return { success: true, conversion_metrics: conversionMetrics, time_range: timeRange };
}

async function calculateResponseTimes(supabase: any, { timeRange = '30d' }: any) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Temps de réponse des prestataires aux missions
  const { data: responses, error } = await supabase
    .from('candidatures_prestataires')
    .select(`
      *,
      mission_assignments!inner(created_at)
    `)
    .gte('created_at', startDate.toISOString());

  if (error) throw error;

  const responseMetrics = {
    avg_response_time_hours: 0,
    median_response_time_hours: 0,
    fast_responders_pct: 0, // < 1h
    slow_responders_pct: 0, // > 4h
    by_urgency: {},
    by_provider: {}
  };

  if (responses && responses.length > 0) {
    const responseTimes = responses
      .filter(r => r.response_time)
      .map(r => {
        // Convertir l'interval PostgreSQL en heures
        const interval = r.response_time;
        // Approximation basique pour la démo
        return parseFloat(interval) || 2.5; // Fallback 2.5h
      });

    if (responseTimes.length > 0) {
      // Moyenne
      responseMetrics.avg_response_time_hours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      
      // Médiane
      const sorted = responseTimes.sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      responseMetrics.median_response_time_hours = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      
      // Pourcentages
      responseMetrics.fast_responders_pct = (responseTimes.filter(t => t < 1).length / responseTimes.length) * 100;
      responseMetrics.slow_responders_pct = (responseTimes.filter(t => t > 4).length / responseTimes.length) * 100;
    }
  }

  return { success: true, response_metrics: responseMetrics, time_range: timeRange };
}

async function calculateCancellationRate(supabase: any, { timeRange = '30d' }: any) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [allBookingsResult, cancelledBookingsResult, incidentsResult] = await Promise.all([
    // Toutes les réservations
    supabase
      .from('bookings')
      .select('id, status, booking_date, start_time, created_at')
      .gte('created_at', startDate.toISOString()),
    
    // Réservations annulées
    supabase
      .from('bookings')
      .select('id, status, booking_date, start_time, created_at')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'cancelled'),
    
    // Incidents d'annulation
    supabase
      .from('incidents')
      .select('*, bookings!inner(booking_date, start_time)')
      .gte('created_at', startDate.toISOString())
      .like('type', '%cancellation%')
  ]);

  if (allBookingsResult.error || cancelledBookingsResult.error) {
    throw new Error('Erreur lors du calcul du taux d\'annulation');
  }

  const totalBookings = allBookingsResult.data?.length || 0;
  const cancelledBookings = cancelledBookingsResult.data?.length || 0;
  const incidents = incidentsResult.data || [];

  // Analyser les annulations de dernière minute
  const now = new Date();
  const lastMinuteCancellations = incidents.filter(incident => {
    if (incident.bookings && incident.bookings.booking_date && incident.bookings.start_time) {
      const bookingDateTime = new Date(`${incident.bookings.booking_date}T${incident.bookings.start_time}`);
      const incidentTime = new Date(incident.created_at);
      const timeDiff = (bookingDateTime.getTime() - incidentTime.getTime()) / (1000 * 60 * 60); // heures
      return timeDiff < 4; // Moins de 4h avant
    }
    return false;
  });

  const cancellationMetrics = {
    overall_rate: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
    last_minute_rate: totalBookings > 0 ? (lastMinuteCancellations.length / totalBookings) * 100 : 0,
    by_reason: {},
    trends: {
      total_bookings: totalBookings,
      total_cancelled: cancelledBookings,
      last_minute_cancelled: lastMinuteCancellations.length
    }
  };

  // Grouper par raisons d'annulation
  incidents.forEach(incident => {
    const reason = incident.metadata?.cancellation_reason || 'Non spécifié';
    cancellationMetrics.by_reason[reason] = (cancellationMetrics.by_reason[reason] || 0) + 1;
  });

  return { success: true, cancellation_metrics: cancellationMetrics, time_range: timeRange };
}

async function calculateRetentionRates(supabase: any, { timeRange = '90d' }: any) {
  const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : timeRange === '180d' ? 180 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Rétention clients
  const { data: clientBookings, error: clientError } = await supabase
    .from('bookings')
    .select('client_id, booking_date, created_at')
    .gte('created_at', startDate.toISOString())
    .eq('status', 'completed')
    .order('booking_date', { ascending: true });

  // Rétention prestataires
  const { data: providerBookings, error: providerError } = await supabase
    .from('bookings')
    .select('provider_id, booking_date, created_at')
    .gte('created_at', startDate.toISOString())
    .eq('status', 'completed')
    .order('booking_date', { ascending: true });

  if (clientError || providerError) {
    throw new Error('Erreur lors du calcul des taux de rétention');
  }

  // Analyser la rétention clients
  const clientRetention = analyzeRetention(clientBookings || [], 'client_id', 30);
  const providerRetention = analyzeRetention(providerBookings || [], 'provider_id', 30);

  return { 
    success: true, 
    retention_metrics: {
      clients: clientRetention,
      providers: providerRetention
    },
    time_range: timeRange 
  };
}

function analyzeRetention(bookings: any[], idField: string, periodDays: number) {
  const userFirstBooking = new Map();
  const userLastBooking = new Map();
  const userBookingCount = new Map();

  // Analyser les données de réservation
  bookings.forEach(booking => {
    const userId = booking[idField];
    const bookingDate = new Date(booking.booking_date);
    
    if (!userFirstBooking.has(userId) || bookingDate < userFirstBooking.get(userId)) {
      userFirstBooking.set(userId, bookingDate);
    }
    
    if (!userLastBooking.has(userId) || bookingDate > userLastBooking.get(userId)) {
      userLastBooking.set(userId, bookingDate);
    }
    
    userBookingCount.set(userId, (userBookingCount.get(userId) || 0) + 1);
  });

  const now = new Date();
  const cutoffDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

  // Calculer la rétention
  const totalUsers = userFirstBooking.size;
  const activeUsers = Array.from(userLastBooking.values())
    .filter(lastBooking => lastBooking >= cutoffDate).length;

  const repeatUsers = Array.from(userBookingCount.values())
    .filter(count => count > 1).length;

  return {
    total_users: totalUsers,
    active_users: activeUsers,
    retention_rate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
    repeat_users: repeatUsers,
    repeat_rate: totalUsers > 0 ? (repeatUsers / totalUsers) * 100 : 0,
    period_days: periodDays
  };
}

async function calculateProviderPerformance(supabase: any, { providerId, timeRange = '30d' }: any) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [bookingsResult, reviewsResult, responsesResult] = await Promise.all([
    // Missions du prestataire
    supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId)
      .gte('created_at', startDate.toISOString()),
    
    // Avis reçus
    supabase
      .from('reviews')
      .select('*')
      .eq('provider_id', providerId)
      .gte('created_at', startDate.toISOString()),
    
    // Réponses aux candidatures
    supabase
      .from('candidatures_prestataires')
      .select('*')
      .eq('provider_id', providerId)
      .gte('created_at', startDate.toISOString())
  ]);

  const bookings = bookingsResult.data || [];
  const reviews = reviewsResult.data || [];
  const responses = responsesResult.data || [];

  const performance = {
    missions_completed: bookings.filter(b => b.status === 'completed').length,
    missions_cancelled: bookings.filter(b => b.status === 'cancelled').length,
    avg_rating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
    response_rate: responses.length > 0 ? (responses.filter(r => r.response_type === 'acceptee').length / responses.length) * 100 : 0,
    earnings: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_price * 0.7), 0), // 70% pour le prestataire
    punctuality_score: reviews.length > 0 ? 
      reviews.reduce((sum, r) => sum + (r.punctuality_rating || r.rating), 0) / reviews.length : 0
  };

  return { success: true, provider_performance: performance, time_range: timeRange };
}

async function getAllRealTimeKPIs(supabase: any, { timeRange = '30d' }: any) {
  // Exécuter tous les calculs en parallèle
  const [conversion, responseTimes, cancellations, retention] = await Promise.all([
    calculateConversionRate(supabase, { timeRange }),
    calculateResponseTimes(supabase, { timeRange }),
    calculateCancellationRate(supabase, { timeRange }),
    calculateRetentionRates(supabase, { timeRange })
  ]);

  return {
    success: true,
    timestamp: new Date().toISOString(),
    kpis: {
      conversion: conversion.conversion_metrics,
      response_times: responseTimes.response_metrics,
      cancellations: cancellations.cancellation_metrics,
      retention: retention.retention_metrics
    },
    time_range: timeRange
  };
}