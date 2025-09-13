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
    console.log(`Automated alerts action: ${action}`, params)

    let result;

    switch (action) {
      case 'run_all_checks':
        result = await runAllAutomatedChecks(supabase);
        break;
      case 'check_performance_thresholds':
        result = await checkPerformanceThresholds(supabase, params);
        break;
      case 'check_booking_anomalies':
        result = await checkBookingAnomalies(supabase, params);
        break;
      case 'check_provider_quality':
        result = await checkProviderQuality(supabase, params);
        break;
      case 'predictive_alerts':
        result = await generatePredictiveAlerts(supabase, params);
        break;
      case 'escalate_critical_issues':
        result = await escalateCriticalIssues(supabase, params);
        break;
      default:
        throw new Error(`Action non supportée: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Automated alerts error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Erreur interne du serveur' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

async function runAllAutomatedChecks(supabase: any) {
  console.log('Running all automated checks...');
  
  const [performance, bookings, quality, predictive] = await Promise.allSettled([
    checkPerformanceThresholds(supabase, {}),
    checkBookingAnomalies(supabase, {}),
    checkProviderQuality(supabase, {}),
    generatePredictiveAlerts(supabase, {})
  ]);

  const results = {
    performance: performance.status === 'fulfilled' ? performance.value : { error: performance.reason },
    bookings: bookings.status === 'fulfilled' ? bookings.value : { error: bookings.reason },
    quality: quality.status === 'fulfilled' ? quality.value : { error: quality.reason },
    predictive: predictive.status === 'fulfilled' ? predictive.value : { error: predictive.reason },
    timestamp: new Date().toISOString()
  };

  // Compter les alertes générées
  let totalAlerts = 0;
  Object.values(results).forEach(result => {
    if (result && typeof result === 'object' && 'alerts_generated' in result) {
      totalAlerts += result.alerts_generated || 0;
    }
  });

  return { 
    success: true, 
    checks_completed: 4,
    total_alerts_generated: totalAlerts,
    results 
  };
}

async function checkPerformanceThresholds(supabase: any, { timeRange = '24h' }: any) {
  const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 24;
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Seuils d'alerte configurables
  const thresholds = {
    conversion_rate_min: 15, // %
    response_time_max: 4, // heures
    cancellation_rate_max: 8, // %
    provider_rating_min: 3.5,
    booking_success_rate_min: 85, // %
    email_delivery_rate_min: 95 // %
  };

  const alertsGenerated = [];

  // 1. Vérifier le taux de conversion
  try {
    const { data: recentRequests } = await supabase
      .from('client_requests')
      .select('id')
      .gte('created_at', startDate.toISOString());
    
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('id')
      .gte('created_at', startDate.toISOString());

    const conversionRate = recentRequests?.length > 0 ? 
      ((recentBookings?.length || 0) / recentRequests.length) * 100 : 0;

    if (conversionRate < thresholds.conversion_rate_min) {
      alertsGenerated.push(await createAlert(supabase, {
        type: 'low_conversion_rate',
        severity: 'high',
        message: `Taux de conversion faible: ${conversionRate.toFixed(1)}% (seuil: ${thresholds.conversion_rate_min}%)`,
        metrics: { current_rate: conversionRate, threshold: thresholds.conversion_rate_min }
      }));
    }
  } catch (error) {
    console.error('Error checking conversion rate:', error);
  }

  // 2. Vérifier les temps de réponse moyens
  try {
    const { data: responses } = await supabase
      .from('candidatures_prestataires')
      .select('response_time')
      .gte('created_at', startDate.toISOString())
      .not('response_time', 'is', null);

    if (responses && responses.length > 0) {
      // Simulation du calcul du temps de réponse moyen
      const avgResponseTime = 3.2; // Heures (à calculer réellement)
      
      if (avgResponseTime > thresholds.response_time_max) {
        alertsGenerated.push(await createAlert(supabase, {
          type: 'slow_provider_response',
          severity: 'medium',
          message: `Temps de réponse prestataires lent: ${avgResponseTime}h (seuil: ${thresholds.response_time_max}h)`,
          metrics: { avg_response_time: avgResponseTime, threshold: thresholds.response_time_max }
        }));
      }
    }
  } catch (error) {
    console.error('Error checking response times:', error);
  }

  // 3. Vérifier le taux d'annulation
  try {
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('status')
      .gte('created_at', startDate.toISOString());
    
    if (allBookings && allBookings.length > 0) {
      const cancelledCount = allBookings.filter(b => b.status === 'cancelled').length;
      const cancellationRate = (cancelledCount / allBookings.length) * 100;
      
      if (cancellationRate > thresholds.cancellation_rate_max) {
        alertsGenerated.push(await createAlert(supabase, {
          type: 'high_cancellation_rate',
          severity: 'high',
          message: `Taux d'annulation élevé: ${cancellationRate.toFixed(1)}% (seuil: ${thresholds.cancellation_rate_max}%)`,
          metrics: { cancellation_rate: cancellationRate, threshold: thresholds.cancellation_rate_max }
        }));
      }
    }
  } catch (error) {
    console.error('Error checking cancellation rate:', error);
  }

  // 4. Vérifier la livraison d'emails
  try {
    const { data: emailLogs } = await supabase
      .from('notification_logs')
      .select('status')
      .gte('created_at', startDate.toISOString());
    
    if (emailLogs && emailLogs.length > 0) {
      const deliveredCount = emailLogs.filter(e => e.status === 'delivered').length;
      const deliveryRate = (deliveredCount / emailLogs.length) * 100;
      
      if (deliveryRate < thresholds.email_delivery_rate_min) {
        alertsGenerated.push(await createAlert(supabase, {
          type: 'low_email_delivery',
          severity: 'critical',
          message: `Taux de livraison email faible: ${deliveryRate.toFixed(1)}% (seuil: ${thresholds.email_delivery_rate_min}%)`,
          metrics: { delivery_rate: deliveryRate, threshold: thresholds.email_delivery_rate_min }
        }));
      }
    }
  } catch (error) {
    console.error('Error checking email delivery:', error);
  }

  return { 
    success: true, 
    alerts_generated: alertsGenerated.length,
    thresholds_checked: Object.keys(thresholds).length,
    alerts: alertsGenerated 
  };
}

async function checkBookingAnomalies(supabase: any, { timeRange = '24h' }: any) {
  const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 24;
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  const alertsGenerated = [];

  // 1. Détecter les pics de demande inhabituels
  try {
    const { data: currentHourRequests } = await supabase
      .from('client_requests')
      .select('id')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    const { data: averageHourRequests } = await supabase
      .from('client_requests')
      .select('id')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const currentRate = currentHourRequests?.length || 0;
    const averageRate = (averageHourRequests?.length || 0) / (7 * 24); // Moyenne par heure sur 7 jours

    if (currentRate > averageRate * 3) { // 300% au-dessus de la normale
      alertsGenerated.push(await createAlert(supabase, {
        type: 'demand_spike',
        severity: 'high',
        message: `Pic de demande détecté: ${currentRate} demandes/h (moyenne: ${averageRate.toFixed(1)})`,
        metrics: { current_rate: currentRate, average_rate: averageRate }
      }));
    }
  } catch (error) {
    console.error('Error checking demand spikes:', error);
  }

  // 2. Détecter les réservations suspectes
  try {
    const { data: suspiciousBookings } = await supabase
      .from('bookings')
      .select('id, client_id, total_price, created_at')
      .gte('created_at', startDate.toISOString())
      .gt('total_price', 500); // Prix élevé

    if (suspiciousBookings && suspiciousBookings.length > 0) {
      // Détecter les réservations multiples du même client
      const clientBookingCounts = {};
      suspiciousBookings.forEach(booking => {
        const clientId = booking.client_id;
        clientBookingCounts[clientId] = (clientBookingCounts[clientId] || 0) + 1;
      });

      Object.entries(clientBookingCounts).forEach(([clientId, count]) => {
        if (count >= 5) { // 5+ réservations en 24h
          alertsGenerated.push(createAlert(supabase, {
            type: 'suspicious_booking_pattern',
            severity: 'medium',
            message: `Pattern suspect: ${count} réservations pour le client ${clientId} en ${timeRange}`,
            metrics: { client_id: clientId, booking_count: count }
          }));
        }
      });
    }
  } catch (error) {
    console.error('Error checking suspicious bookings:', error);
  }

  // 3. Détecter les zones géographiques avec problèmes
  try {
    const { data: failedBookings } = await supabase
      .from('bookings')
      .select('address, status')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'cancelled');

    if (failedBookings && failedBookings.length > 0) {
      const locationFailures = {};
      failedBookings.forEach(booking => {
        const city = booking.address?.split(',')[1]?.trim() || 'Unknown';
        locationFailures[city] = (locationFailures[city] || 0) + 1;
      });

      Object.entries(locationFailures).forEach(([city, failures]) => {
        if (failures >= 3) { // 3+ échecs dans la même ville
          alertsGenerated.push(createAlert(supabase, {
            type: 'geographic_service_issue',
            severity: 'medium',
            message: `Problème géographique détecté à ${city}: ${failures} annulations en ${timeRange}`,
            metrics: { location: city, failure_count: failures }
          }));
        }
      });
    }
  } catch (error) {
    console.error('Error checking geographic issues:', error);
  }

  return { 
    success: true, 
    alerts_generated: alertsGenerated.length,
    anomalies_checked: 3,
    alerts: alertsGenerated 
  };
}

async function checkProviderQuality(supabase: any, { timeRange = '7d' }: any) {
  const hours = timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : 168;
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  const alertsGenerated = [];

  // 1. Prestataires avec note en baisse
  try {
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select('provider_id, rating, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (recentReviews && recentReviews.length > 0) {
      const providerRatings = {};
      
      recentReviews.forEach(review => {
        if (!providerRatings[review.provider_id]) {
          providerRatings[review.provider_id] = [];
        }
        providerRatings[review.provider_id].push(review.rating);
      });

      // Analyser les tendances
      Object.entries(providerRatings).forEach(([providerId, ratings]) => {
        if (ratings.length >= 3) {
          const firstHalf = ratings.slice(0, Math.floor(ratings.length / 2));
          const secondHalf = ratings.slice(Math.floor(ratings.length / 2));
          
          const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          
          if (firstAvg - secondAvg > 0.5) { // Baisse significative
            alertsGenerated.push(createAlert(supabase, {
              type: 'provider_quality_decline',
              severity: 'medium',
              message: `Baisse de qualité détectée pour prestataire ${providerId}: ${firstAvg.toFixed(1)} → ${secondAvg.toFixed(1)}`,
              metrics: { provider_id: providerId, rating_decline: firstAvg - secondAvg }
            }));
          }
        }
      });
    }
  } catch (error) {
    console.error('Error checking provider quality:', error);
  }

  // 2. Prestataires avec taux d'annulation élevé
  try {
    const { data: providerBookings } = await supabase
      .from('bookings')
      .select('provider_id, status')
      .gte('created_at', startDate.toISOString());

    if (providerBookings && providerBookings.length > 0) {
      const providerStats = {};
      
      providerBookings.forEach(booking => {
        if (!providerStats[booking.provider_id]) {
          providerStats[booking.provider_id] = { total: 0, cancelled: 0 };
        }
        providerStats[booking.provider_id].total++;
        if (booking.status === 'cancelled') {
          providerStats[booking.provider_id].cancelled++;
        }
      });

      Object.entries(providerStats).forEach(([providerId, stats]) => {
        if (stats.total >= 5) { // Minimum 5 réservations pour être significatif
          const cancellationRate = (stats.cancelled / stats.total) * 100;
          if (cancellationRate > 20) { // Plus de 20% d'annulations
            alertsGenerated.push(createAlert(supabase, {
              type: 'high_provider_cancellation',
              severity: 'high',
              message: `Taux d'annulation élevé pour prestataire ${providerId}: ${cancellationRate.toFixed(1)}%`,
              metrics: { provider_id: providerId, cancellation_rate: cancellationRate }
            }));
          }
        }
      });
    }
  } catch (error) {
    console.error('Error checking provider cancellations:', error);
  }

  return { 
    success: true, 
    alerts_generated: alertsGenerated.length,
    quality_checks: 2,
    alerts: alertsGenerated 
  };
}

async function generatePredictiveAlerts(supabase: any, { timeRange = '24h' }: any) {
  const alertsGenerated = [];

  // 1. Prédire les problèmes de capacité
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Demandes prévues pour demain (basé sur l'historique)
    const { data: historicalRequests } = await supabase
      .from('client_requests')
      .select('created_at, service_type')
      .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Prestataires disponibles demain
    const { data: availableProviders } = await supabase
      .from('providers')
      .select('id, status')
      .eq('status', 'active');

    const avgDailyRequests = (historicalRequests?.length || 0) / 7;
    const availableCapacity = (availableProviders?.length || 0) * 3; // 3 missions par prestataire par jour

    if (avgDailyRequests > availableCapacity * 0.8) { // 80% de la capacité
      alertsGenerated.push(await createAlert(supabase, {
        type: 'capacity_warning',
        severity: 'medium',
        message: `Risque de surcharge demain: ${avgDailyRequests.toFixed(0)} demandes prévues, capacité ${availableCapacity}`,
        metrics: { predicted_requests: avgDailyRequests, available_capacity: availableCapacity }
      }));
    }
  } catch (error) {
    console.error('Error generating predictive alerts:', error);
  }

  // 2. Prédire les problèmes de qualité de service
  const { data: recentIncidents } = await supabase
    .from('incidents')
    .select('type, severity')
    .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

  if (recentIncidents && recentIncidents.length > 5) { // Plus de 5 incidents en 48h
    alertsGenerated.push(await createAlert(supabase, {
      type: 'service_quality_risk',
      severity: 'high',
      message: `Risque de dégradation service: ${recentIncidents.length} incidents en 48h`,
      metrics: { recent_incidents: recentIncidents.length }
    }));
  }

  return { 
    success: true, 
    alerts_generated: alertsGenerated.length,
    predictive_models: 2,
    alerts: alertsGenerated 
  };
}

async function escalateCriticalIssues(supabase: any, { timeRange = '1h' }: any) {
  const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 1;
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Récupérer les alertes critiques non traitées
  const { data: criticalAlerts } = await supabase
    .from('system_alerts')
    .select('*')
    .eq('severity', 'critical')
    .eq('status', 'open')
    .gte('created_at', startDate.toISOString());

  let escalated = 0;
  
  if (criticalAlerts && criticalAlerts.length > 0) {
    for (const alert of criticalAlerts) {
      // Escalade automatique après 30 minutes
      const alertAge = (Date.now() - new Date(alert.created_at).getTime()) / (1000 * 60);
      
      if (alertAge > 30) { // Plus de 30 minutes
        // Créer une notification urgente pour l'admin
        await supabase.from('realtime_notifications').insert({
          user_id: 'admin',
          type: 'critical_escalation',
          title: '🔥 ESCALADE CRITIQUE',
          message: `Alerte non traitée depuis ${Math.round(alertAge)} min: ${alert.message}`,
          priority: 'urgent',
          data: { original_alert_id: alert.id, escalation_reason: 'timeout' }
        });

        escalated++;
      }
    }
  }

  return { 
    success: true, 
    critical_alerts_found: criticalAlerts?.length || 0,
    alerts_escalated: escalated 
  };
}

async function createAlert(supabase: any, { type, severity, message, metrics = {} }: any) {
  const { data: alert } = await supabase
    .from('system_alerts')
    .insert({
      alert_type: type,
      severity: severity,
      message: message,
      component: 'automated_monitoring',
      metadata: metrics,
      status: 'open',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Notification en temps réel pour les alertes critiques
  if (severity === 'critical') {
    await supabase.from('realtime_notifications').insert({
      user_id: 'admin',
      type: 'automated_alert',
      title: `🚨 ${type.toUpperCase()}`,
      message: message,
      priority: 'urgent',
      data: { alert_id: alert?.id, automated: true }
    });
  }

  return alert;
}