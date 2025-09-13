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
    console.log(`System monitoring action: ${action}`, params)

    let result;

    switch (action) {
      case 'check_system_health':
        result = await checkSystemHealth(supabase);
        break;
      case 'monitor_email_delivery':
        result = await monitorEmailDelivery(supabase, params);
        break;
      case 'monitor_payment_failures':
        result = await monitorPaymentFailures(supabase, params);
        break;
      case 'check_load_metrics':
        result = await checkLoadMetrics(supabase, params);
        break;
      case 'get_alerts':
        result = await getSystemAlerts(supabase, params);
        break;
      case 'create_alert':
        result = await createSystemAlert(supabase, params);
        break;
      case 'nps_tracking':
        result = await trackNPS(supabase, params);
        break;
      default:
        throw new Error(`Action non supportée: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('System monitoring error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Erreur interne du serveur' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

async function checkSystemHealth(supabase: any) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Vérifier la santé des composants critiques
  const healthChecks = await Promise.allSettled([
    // 1. Base de données
    supabase.from('bookings').select('count', { count: 'exact', head: true }),
    
    // 2. Emails récents
    supabase.from('notification_logs')
      .select('status')
      .gte('created_at', oneHourAgo.toISOString())
      .limit(100),
    
    // 3. Paiements récents
    supabase.from('payments')
      .select('status')
      .gte('created_at', oneHourAgo.toISOString())
      .limit(50),
    
    // 4. Activité utilisateurs
    supabase.from('user_presence')
      .select('status')
      .gte('last_seen', oneHourAgo.toISOString())
  ]);

  const [dbHealth, emailHealth, paymentHealth, userActivity] = healthChecks;

  const systemHealth = {
    overall: 'healthy',
    components: {
      database: {
        status: dbHealth.status === 'fulfilled' ? 'healthy' : 'error',
        response_time: '< 100ms',
        last_check: now.toISOString()
      },
      email_service: {
        status: 'healthy',
        delivery_rate: 0,
        last_check: now.toISOString()
      },
      payment_gateway: {
        status: 'healthy',
        success_rate: 0,
        last_check: now.toISOString()
      },
      user_activity: {
        status: userActivity.status === 'fulfilled' ? 'healthy' : 'warning',
        active_users: 0,
        last_check: now.toISOString()
      }
    },
    alerts: []
  };

  // Analyser les emails
  if (emailHealth.status === 'fulfilled' && emailHealth.value.data) {
    const emails = emailHealth.value.data;
    const successfulEmails = emails.filter(e => e.status === 'delivered').length;
    const deliveryRate = emails.length > 0 ? (successfulEmails / emails.length) * 100 : 100;
    
    systemHealth.components.email_service.delivery_rate = deliveryRate;
    systemHealth.components.email_service.status = deliveryRate < 95 ? 'warning' : 'healthy';
    
    if (deliveryRate < 90) {
      systemHealth.alerts.push({
        type: 'email_delivery_low',
        severity: 'high',
        message: `Taux de livraison email faible: ${deliveryRate.toFixed(1)}%`
      });
    }
  }

  // Analyser les paiements
  if (paymentHealth.status === 'fulfilled' && paymentHealth.value.data) {
    const payments = paymentHealth.value.data;
    const successfulPayments = payments.filter(p => p.status === 'confirme').length;
    const successRate = payments.length > 0 ? (successfulPayments / payments.length) * 100 : 100;
    
    systemHealth.components.payment_gateway.success_rate = successRate;
    systemHealth.components.payment_gateway.status = successRate < 95 ? 'warning' : 'healthy';
    
    if (successRate < 90) {
      systemHealth.alerts.push({
        type: 'payment_failures_high',
        severity: 'critical',
        message: `Taux d'échec paiement élevé: ${(100-successRate).toFixed(1)}%`
      });
    }
  }

  // Analyser l'activité utilisateur
  if (userActivity.status === 'fulfilled' && userActivity.value.data) {
    const activeUsers = userActivity.value.data.length;
    systemHealth.components.user_activity.active_users = activeUsers;
    
    if (activeUsers < 10) {
      systemHealth.alerts.push({
        type: 'low_user_activity',
        severity: 'medium',
        message: `Activité utilisateur faible: ${activeUsers} utilisateurs actifs`
      });
    }
  }

  // Déterminer l'état global
  const componentStates = Object.values(systemHealth.components).map(c => c.status);
  if (componentStates.includes('error')) {
    systemHealth.overall = 'critical';
  } else if (componentStates.includes('warning')) {
    systemHealth.overall = 'warning';
  }

  // Logger les alertes
  for (const alert of systemHealth.alerts) {
    await createSystemAlert(supabase, {
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      component: 'system_health'
    });
  }

  return systemHealth;
}

async function monitorEmailDelivery(supabase: any, { timeRange = '24h' }: any) {
  const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 24;
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  const { data: logs, error } = await supabase
    .from('notification_logs')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  const metrics = {
    total_sent: logs?.length || 0,
    delivered: logs?.filter(l => l.status === 'delivered').length || 0,
    failed: logs?.filter(l => l.status === 'failed').length || 0,
    pending: logs?.filter(l => l.status === 'pending').length || 0,
    bounce_rate: 0,
    delivery_rate: 0,
    avg_delivery_time: 0
  };

  if (metrics.total_sent > 0) {
    metrics.delivery_rate = (metrics.delivered / metrics.total_sent) * 100;
    metrics.bounce_rate = (metrics.failed / metrics.total_sent) * 100;
  }

  // Analyser les temps de livraison
  const deliveredEmails = logs?.filter(l => l.delivered_at && l.sent_at) || [];
  if (deliveredEmails.length > 0) {
    const totalDeliveryTime = deliveredEmails.reduce((sum, email) => {
      const sent = new Date(email.sent_at).getTime();
      const delivered = new Date(email.delivered_at).getTime();
      return sum + (delivered - sent);
    }, 0);
    metrics.avg_delivery_time = totalDeliveryTime / deliveredEmails.length / 1000; // en secondes
  }

  // Détecter les problèmes
  const issues = [];
  if (metrics.delivery_rate < 95) {
    issues.push({
      type: 'low_delivery_rate',
      severity: metrics.delivery_rate < 90 ? 'critical' : 'warning',
      value: metrics.delivery_rate
    });
  }
  if (metrics.bounce_rate > 5) {
    issues.push({
      type: 'high_bounce_rate',
      severity: metrics.bounce_rate > 10 ? 'critical' : 'warning',
      value: metrics.bounce_rate
    });
  }

  return { metrics, issues, time_range: timeRange };
}

async function monitorPaymentFailures(supabase: any, { timeRange = '24h' }: any) {
  const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 24;
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  const metrics = {
    total_attempts: payments?.length || 0,
    successful: payments?.filter(p => p.status === 'confirme').length || 0,
    failed: payments?.filter(p => p.status === 'echec').length || 0,
    pending: payments?.filter(p => p.status === 'en_attente').length || 0,
    success_rate: 0,
    failure_rate: 0,
    avg_amount: 0
  };

  if (metrics.total_attempts > 0) {
    metrics.success_rate = (metrics.successful / metrics.total_attempts) * 100;
    metrics.failure_rate = (metrics.failed / metrics.total_attempts) * 100;
    
    const totalAmount = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    metrics.avg_amount = totalAmount / metrics.total_attempts;
  }

  // Analyser les causes d'échec
  const failedPayments = payments?.filter(p => p.status === 'echec') || [];
  const failureCauses = {};
  failedPayments.forEach(payment => {
    const cause = payment.admin_notes || 'unknown';
    failureCauses[cause] = (failureCauses[cause] || 0) + 1;
  });

  return { 
    metrics, 
    failure_causes: failureCauses,
    time_range: timeRange,
    recent_failures: failedPayments.slice(0, 10)
  };
}

async function checkLoadMetrics(supabase: any, { timeRange = '1h' }: any) {
  const minutes = timeRange === '5m' ? 5 : timeRange === '1h' ? 60 : timeRange === '24h' ? 1440 : 60;
  const startDate = new Date(Date.now() - minutes * 60 * 1000);

  // Simuler des métriques de charge (dans un vrai système, ces données viendraient de votre monitoring)
  const loadMetrics = {
    cpu_usage: Math.random() * 100,
    memory_usage: Math.random() * 100,
    active_connections: Math.floor(Math.random() * 1000),
    requests_per_minute: Math.floor(Math.random() * 5000),
    response_time_avg: Math.random() * 500,
    error_rate: Math.random() * 5,
    timestamp: new Date().toISOString()
  };

  // Seuils d'alerte
  const alerts = [];
  if (loadMetrics.cpu_usage > 80) {
    alerts.push({ type: 'high_cpu', value: loadMetrics.cpu_usage, severity: 'warning' });
  }
  if (loadMetrics.cpu_usage > 95) {
    alerts.push({ type: 'critical_cpu', value: loadMetrics.cpu_usage, severity: 'critical' });
  }
  if (loadMetrics.memory_usage > 85) {
    alerts.push({ type: 'high_memory', value: loadMetrics.memory_usage, severity: 'warning' });
  }
  if (loadMetrics.response_time_avg > 1000) {
    alerts.push({ type: 'slow_response', value: loadMetrics.response_time_avg, severity: 'warning' });
  }

  return { metrics: loadMetrics, alerts };
}

async function trackNPS(supabase: any, { clientId, bookingId, score, feedback }: any) {
  // Enregistrer le score NPS
  const { data: npsRecord } = await supabase
    .from('nps_surveys')
    .insert({
      client_id: clientId,
      booking_id: bookingId,
      score: score,
      feedback: feedback,
      survey_date: new Date().toISOString(),
      category: score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor'
    })
    .select()
    .single();

  // Calculer le NPS global
  const { data: allScores } = await supabase
    .from('nps_surveys')
    .select('score')
    .gte('survey_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // 90 derniers jours

  let npsScore = 0;
  if (allScores && allScores.length > 0) {
    const promoters = allScores.filter(s => s.score >= 9).length;
    const detractors = allScores.filter(s => s.score <= 6).length;
    npsScore = ((promoters - detractors) / allScores.length) * 100;
  }

  return {
    success: true,
    nps_record_id: npsRecord.id,
    current_nps: Math.round(npsScore),
    total_responses: allScores?.length || 0
  };
}

async function getSystemAlerts(supabase: any, { severity, timeRange = '24h' }: any) {
  const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 24;
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  let query = supabase
    .from('system_alerts')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (severity) {
    query = query.eq('severity', severity);
  }

  const { data: alerts, error } = await query;
  if (error) throw error;

  return {
    alerts: alerts || [],
    summary: {
      total: alerts?.length || 0,
      critical: alerts?.filter(a => a.severity === 'critical').length || 0,
      warning: alerts?.filter(a => a.severity === 'warning').length || 0,
      info: alerts?.filter(a => a.severity === 'info').length || 0
    }
  };
}

async function createSystemAlert(supabase: any, { type, severity, message, component, metadata }: any) {
  const { data: alert } = await supabase
    .from('system_alerts')
    .insert({
      alert_type: type,
      severity: severity,
      message: message,
      component: component,
      metadata: metadata || {},
      status: 'open',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Notifications en temps réel pour les alertes critiques
  if (severity === 'critical') {
    await supabase.from('realtime_notifications').insert({
      user_id: 'admin',
      type: 'system_alert',
      title: `🚨 Alerte système critique`,
      message: message,
      priority: 'urgent',
      data: { alert_id: alert.id, component }
    });
  }

  return { success: true, alert_id: alert.id };
}