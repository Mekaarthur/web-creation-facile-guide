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
      case 'get_system_health':
        return new Response(JSON.stringify(await getSystemHealth(supabase)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'get_database_stats':
        return new Response(JSON.stringify(await getDatabaseStats(supabase)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'get_error_logs':
        return new Response(JSON.stringify(await getErrorLogs(supabase, requestData)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'cleanup_data':
        return new Response(JSON.stringify(await cleanupData(supabase, requestData)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'backup_status':
        return new Response(JSON.stringify(await getBackupStatus(supabase)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'system_diagnostics':
        return new Response(JSON.stringify(await runSystemDiagnostics(supabase)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      default:
        throw new Error(`Action non reconnue: ${action}`);
    }
  } catch (error) {
    console.error('Erreur dans admin-system:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getSystemHealth(supabase: any) {
  const checks = [];

  // Vérifier la connectivité de la base de données
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    checks.push({
      name: 'Database Connection',
      status: error ? 'error' : 'healthy',
      message: error ? error.message : 'Database accessible',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    checks.push({
      name: 'Database Connection',
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }

  // Vérifier les services critiques
  const criticalTables = ['bookings', 'providers', 'profiles', 'payments'];
  for (const table of criticalTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      checks.push({
        name: `Table ${table}`,
        status: error ? 'error' : 'healthy',
        message: error ? error.message : 'Table accessible',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      checks.push({
        name: `Table ${table}`,
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Vérifier les incidents récents
  const { data: recentIncidents } = await supabase
    .from('incidents')
    .select('*')
    .neq('status', 'resolved')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  checks.push({
    name: 'Active Incidents',
    status: (recentIncidents?.length || 0) > 0 ? 'warning' : 'healthy',
    message: `${recentIncidents?.length || 0} incident(s) actif(s)`,
    timestamp: new Date().toISOString()
  });

  const overallStatus = checks.some(c => c.status === 'error') ? 'error' : 
                       checks.some(c => c.status === 'warning') ? 'warning' : 'healthy';

  return {
    success: true,
    overall_status: overallStatus,
    checks,
    last_updated: new Date().toISOString()
  };
}

async function getDatabaseStats(supabase: any) {
  const stats = {};

  const tables = [
    'profiles', 'providers', 'bookings', 'payments', 
    'reviews', 'services', 'carts', 'notifications',
    'incidents', 'referrals'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      stats[table] = {
        count: count || 0,
        status: error ? 'error' : 'ok'
      };
    } catch (error) {
      stats[table] = {
        count: 0,
        status: 'error',
        error: error.message
      };
    }
  }

  // Statistiques de croissance (derniers 30 jours)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const growth = {};

  for (const table of ['profiles', 'providers', 'bookings']) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      growth[table] = count || 0;
    } catch (error) {
      growth[table] = 0;
    }
  }

  return {
    success: true,
    table_stats: stats,
    growth_stats: growth,
    generated_at: new Date().toISOString()
  };
}

async function getErrorLogs(supabase: any, { severity = 'all', limit = 100, hours = 24 }: any) {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  // Récupérer les incidents comme logs d'erreur
  let query = supabase
    .from('incidents')
    .select('*')
    .gte('created_at', startTime.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (severity !== 'all') {
    query = query.eq('severity', severity);
  }

  const { data: incidents, error } = await query;

  if (error) {
    throw new Error(`Erreur récupération logs: ${error.message}`);
  }

  // Ajouter d'autres sources de logs si disponibles
  const logs = incidents?.map((incident: any) => ({
    id: incident.id,
    timestamp: incident.created_at,
    level: incident.severity,
    category: incident.type,
    message: incident.description,
    details: incident.metadata,
    status: incident.status
  })) || [];

  return {
    success: true,
    logs,
    total: logs.length,
    time_range: `${hours}h`
  };
}

async function cleanupData(supabase: any, { type, olderThan = 90 }: any) {
  const cutoffDate = new Date(Date.now() - olderThan * 24 * 60 * 60 * 1000);
  let cleaned = 0;

  try {
    switch (type) {
      case 'expired_carts':
        const { count: cartCount } = await supabase
          .from('carts')
          .delete({ count: 'exact' })
          .eq('status', 'expired')
          .lt('expires_at', cutoffDate.toISOString());
        cleaned = cartCount || 0;
        break;

      case 'old_notifications':
        const { count: notifCount } = await supabase
          .from('realtime_notifications')
          .delete({ count: 'exact' })
          .eq('is_read', true)
          .lt('created_at', cutoffDate.toISOString());
        cleaned = notifCount || 0;
        break;

      case 'resolved_incidents':
        const { count: incidentCount } = await supabase
          .from('incidents')
          .delete({ count: 'exact' })
          .eq('status', 'resolved')
          .lt('resolved_at', cutoffDate.toISOString());
        cleaned = incidentCount || 0;
        break;

      case 'old_logs':
        const { count: logCount } = await supabase
          .from('notification_logs')
          .delete({ count: 'exact' })
          .lt('created_at', cutoffDate.toISOString());
        cleaned = logCount || 0;
        break;

      default:
        throw new Error('Type de nettoyage non supporté');
    }

    // Logger l'action de nettoyage
    await supabase
      .from('admin_actions_log')
      .insert({
        entity_type: 'system',
        action_type: 'cleanup',
        description: `Nettoyage ${type}: ${cleaned} éléments supprimés`
      });

    return {
      success: true,
      type,
      cleaned,
      message: `${cleaned} éléments nettoyés avec succès`
    };

  } catch (error) {
    throw new Error(`Erreur nettoyage: ${error.message}`);
  }
}

async function getBackupStatus(supabase: any) {
  // Simuler le statut de sauvegarde (dans un vrai système, on interrogerait l'API de backup)
  const lastBackup = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
  const nextBackup = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return {
    success: true,
    backup_status: {
      last_backup: lastBackup.toISOString(),
      next_backup: nextBackup.toISOString(),
      backup_frequency: 'daily',
      backup_size: '2.3 GB',
      status: 'healthy',
      retention_period: '30 days',
      location: 'Supabase managed backups'
    }
  };
}

async function runSystemDiagnostics(supabase: any) {
  const diagnostics = [];

  // Test de performance de base de données
  const dbStart = Date.now();
  try {
    await supabase.from('profiles').select('id').limit(10);
    const dbTime = Date.now() - dbStart;
    diagnostics.push({
      test: 'Database Query Performance',
      status: dbTime < 1000 ? 'good' : dbTime < 3000 ? 'warning' : 'poor',
      value: `${dbTime}ms`,
      benchmark: '< 1000ms'
    });
  } catch (error) {
    diagnostics.push({
      test: 'Database Query Performance',
      status: 'error',
      value: 'Failed',
      error: error.message
    });
  }

  // Vérifier la cohérence des données
  const { data: orphanBookings } = await supabase
    .from('bookings')
    .select('id')
    .not('client_id', 'in', `(SELECT user_id FROM profiles)`);

  diagnostics.push({
    test: 'Data Integrity - Orphan Bookings',
    status: (orphanBookings?.length || 0) > 0 ? 'warning' : 'good',
    value: `${orphanBookings?.length || 0} orphan records`,
    benchmark: '0 orphan records'
  });

  // Vérifier les prestataires sans profil
  const { data: orphanProviders } = await supabase
    .from('providers')
    .select('id')
    .not('user_id', 'in', `(SELECT user_id FROM profiles)`);

  diagnostics.push({
    test: 'Data Integrity - Orphan Providers',
    status: (orphanProviders?.length || 0) > 0 ? 'warning' : 'good',
    value: `${orphanProviders?.length || 0} orphan records`,
    benchmark: '0 orphan records'
  });

  return {
    success: true,
    diagnostics,
    overall_score: calculateOverallScore(diagnostics),
    run_time: new Date().toISOString()
  };
}

function calculateOverallScore(diagnostics: any[]) {
  const scores = { good: 100, warning: 60, poor: 30, error: 0 };
  const totalScore = diagnostics.reduce((sum, d) => sum + (scores[d.status] || 0), 0);
  const averageScore = diagnostics.length > 0 ? totalScore / diagnostics.length : 0;
  
  return {
    score: Math.round(averageScore),
    grade: averageScore >= 80 ? 'A' : averageScore >= 60 ? 'B' : averageScore >= 40 ? 'C' : 'D'
  };
}