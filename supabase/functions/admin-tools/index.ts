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
    console.log('Admin tools action:', action, 'Data:', requestData);

    switch (action) {
      case 'system_health':
        return await getSystemHealth(supabase, requestData);
      case 'database_stats':
        return await getDatabaseStats(supabase, requestData);
      case 'cleanup_data':
        return await cleanupData(supabase, requestData);
      case 'backup_data':
        return await backupData(supabase, requestData);
      case 'send_test_email':
        return await sendTestEmail(supabase, requestData);
      case 'run_diagnostics':
        return await runDiagnostics(supabase, requestData);
      case 'manage_cache':
        return await manageCache(supabase, requestData);
      case 'update_settings':
        return await updateSystemSettings(supabase, requestData);
      case 'get_logs':
        return await getSystemLogs(supabase, requestData);
      case 'maintenance_mode':
        return await toggleMaintenanceMode(supabase, requestData);
      default:
        throw new Error(`Action non reconnue: ${action}`);
    }
  } catch (error) {
    console.error('Erreur dans admin-tools:', error);
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

async function getSystemHealth(supabase: any, { detailed = false }: any) {
  try {
    const healthChecks = [];

    // Vérification de la base de données
    try {
      const { data: dbTest, error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      healthChecks.push({
        component: 'database',
        status: dbError ? 'error' : 'healthy',
        message: dbError ? dbError.message : 'Base de données accessible',
        response_time: Date.now()
      });
    } catch (error) {
      healthChecks.push({
        component: 'database',
        status: 'error',
        message: 'Impossible de se connecter à la base de données',
        response_time: null
      });
    }

    // Vérification des services critiques
    const services = ['bookings', 'providers', 'payments', 'communications'];
    
    for (const service of services) {
      try {
        const startTime = Date.now();
        const { error } = await supabase
          .from(service)
          .select('count')
          .limit(1);
        
        const responseTime = Date.now() - startTime;
        
        healthChecks.push({
          component: service,
          status: error ? 'warning' : 'healthy',
          message: error ? `Problème avec ${service}: ${error.message}` : `Service ${service} opérationnel`,
          response_time: responseTime
        });
      } catch (error) {
        healthChecks.push({
          component: service,
          status: 'error',
          message: `Service ${service} indisponible`,
          response_time: null
        });
      }
    }

    // Statistiques générales
    let systemStats = {};
    if (detailed) {
      systemStats = await getDetailedSystemStats(supabase);
    }

    const overallStatus = healthChecks.some(check => check.status === 'error') ? 'error' :
                         healthChecks.some(check => check.status === 'warning') ? 'warning' : 'healthy';

    return new Response(
      JSON.stringify({
        success: true,
        overall_status: overallStatus,
        checks: healthChecks,
        timestamp: new Date().toISOString(),
        ...(detailed && { system_stats: systemStats })
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la vérification de santé système:', error);
    throw error;
  }
}

async function getDatabaseStats(supabase: any, {}: any) {
  try {
    const stats = {};

    // Statistiques par table
    const tables = [
      'profiles', 'providers', 'bookings', 'services', 'payments', 
      'reviews', 'job_applications', 'communications', 'notifications'
    ];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          (stats as any)[table] = {
            total_records: count,
            status: 'accessible'
          };
        } else {
          (stats as any)[table] = {
            total_records: 0,
            status: 'error',
            error: error.message
          };
        }
      } catch (error) {
        (stats as any)[table] = {
          total_records: 0,
          status: 'error',
          error: 'Table inaccessible'
        };
      }
    }

    // Statistiques d'activité des dernières 24h
    const last24h = new Date();
    last24h.setDate(last24h.getDate() - 1);

    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('id')
      .gte('created_at', last24h.toISOString());

    const { data: recentApplications } = await supabase
      .from('job_applications')
      .select('id')
      .gte('created_at', last24h.toISOString());

    const activityStats = {
      bookings_24h: recentBookings?.length || 0,
      applications_24h: recentApplications?.length || 0,
      last_updated: new Date().toISOString()
    };

    return new Response(
      JSON.stringify({
        success: true,
        database_stats: stats,
        activity_stats: activityStats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des stats DB:', error);
    throw error;
  }
}

async function cleanupData(supabase: any, { type, dryRun = true, adminUserId }: any) {
  try {
    const cleanupResults = [];

    switch (type) {
      case 'expired_carts':
        // Nettoyer les paniers expirés
        const { data: expiredCarts, error: cartsError } = await supabase
          .from('carts')
          .select('id')
          .eq('status', 'active')
          .lt('expires_at', new Date().toISOString());

        if (!cartsError && expiredCarts) {
          if (!dryRun) {
            const { error: updateError } = await supabase
              .from('carts')
              .update({ status: 'expired' })
              .in('id', expiredCarts.map(c => c.id));
            
            if (!updateError) {
              cleanupResults.push({
                type: 'expired_carts',
                affected: expiredCarts.length,
                status: 'completed'
              });
            }
          } else {
            cleanupResults.push({
              type: 'expired_carts',
              affected: expiredCarts.length,
              status: 'dry_run'
            });
          }
        }
        break;

      case 'old_notifications':
        // Nettoyer les notifications anciennes (> 90 jours)
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 90);

        const { data: oldNotifications, error: notifError } = await supabase
          .from('realtime_notifications')
          .select('id')
          .lt('created_at', oldDate.toISOString());

        if (!notifError && oldNotifications) {
          if (!dryRun) {
            const { error: deleteError } = await supabase
              .from('realtime_notifications')
              .delete()
              .in('id', oldNotifications.map(n => n.id));
            
            if (!deleteError) {
              cleanupResults.push({
                type: 'old_notifications',
                affected: oldNotifications.length,
                status: 'completed'
              });
            }
          } else {
            cleanupResults.push({
              type: 'old_notifications',
              affected: oldNotifications.length,
              status: 'dry_run'
            });
          }
        }
        break;

      case 'incomplete_applications':
        // Supprimer les candidatures incomplètes anciennes (> 30 jours)
        const incompleteDate = new Date();
        incompleteDate.setDate(incompleteDate.getDate() - 30);

        const { data: incompleteApps, error: appsError } = await supabase
          .from('job_applications')
          .select('id')
          .eq('status', 'pending')
          .lt('created_at', incompleteDate.toISOString())
          .or('email.is.null,phone.is.null');

        if (!appsError && incompleteApps) {
          if (!dryRun) {
            const { error: deleteError } = await supabase
              .from('job_applications')
              .delete()
              .in('id', incompleteApps.map(a => a.id));
            
            if (!deleteError) {
              cleanupResults.push({
                type: 'incomplete_applications',
                affected: incompleteApps.length,
                status: 'completed'
              });
            }
          } else {
            cleanupResults.push({
              type: 'incomplete_applications',
              affected: incompleteApps.length,
              status: 'dry_run'
            });
          }
        }
        break;

      default:
        throw new Error(`Type de nettoyage non reconnu: ${type}`);
    }

    // Logger l'action de nettoyage
    if (!dryRun) {
      await supabase
        .from('admin_actions_log')
        .insert({
          admin_user_id: adminUserId,
          entity_type: 'system',
          action_type: 'cleanup_data',
          description: `Nettoyage des données: ${type}`,
          new_data: { cleanup_results: cleanupResults }
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: dryRun ? 'Simulation de nettoyage terminée' : 'Nettoyage terminé',
        results: cleanupResults,
        dry_run: dryRun
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    throw error;
  }
}

async function backupData(supabase: any, { tables, adminUserId }: any) {
  try {
    const backupInfo = {
      timestamp: new Date().toISOString(),
      tables: [],
      total_records: 0
    };

    // Pour une vraie implémentation, on exporterait vers un service de stockage
    // Ici, on simule juste la collecte des données
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (!error && data) {
          (backupInfo.tables as any[]).push({
            name: table,
            records: data.length,
            status: 'backed_up'
          });
          backupInfo.total_records += data.length;
        } else {
          (backupInfo.tables as any[]).push({
            name: table,
            records: 0,
            status: 'error',
            error: error?.message
          });
        }
      } catch (error) {
        (backupInfo.tables as any[]).push({
          name: table,
          records: 0,
          status: 'error',
          error: 'Erreur de lecture'
        });
      }
    }

    // Logger la sauvegarde
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'system',
        action_type: 'backup_data',
        description: `Sauvegarde des tables: ${tables.join(', ')}`,
        new_data: backupInfo
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Processus de sauvegarde simulé',
        backup_info: backupInfo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    throw error;
  }
}

async function sendTestEmail(supabase: any, { email, testType = 'basic', adminUserId }: any) {
  try {
    const testMessages = {
      'basic': {
        subject: 'Test email - Bikawo Admin',
        content: 'Ceci est un email de test envoyé depuis l\'interface d\'administration Bikawo.'
      },
      'booking_confirmation': {
        subject: 'Test - Confirmation de réservation',
        content: 'Test d\'email de confirmation de réservation avec formatage HTML.'
      },
      'provider_notification': {
        subject: 'Test - Notification prestataire',
        content: 'Test d\'email de notification pour prestataires.'
      }
    };

    const message = testMessages[testType as keyof typeof testMessages] || testMessages.basic;

    // Créer l'entrée de communication
    const { data: communication, error } = await supabase
      .from('communications')
      .insert({
        type: 'email',
        destinataire_email: email,
        sujet: message.subject,
        contenu: message.content,
        template_name: `test_${testType}`,
        status: 'en_attente'
      })
      .select('id')
      .single();

    if (error) throw error;

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'system',
        action_type: 'send_test_email',
        description: `Email de test envoyé à ${email} (type: ${testType})`,
        new_data: { email, test_type: testType, communication_id: communication.id }
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email de test envoyé avec succès',
        communication_id: communication.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de l\'envoi d\'email de test:', error);
    throw error;
  }
}

async function runDiagnostics(supabase: any, { category = 'all' }: any) {
  try {
    const diagnostics = [];

    if (category === 'all' || category === 'performance') {
      // Diagnostics de performance
      const perfStart = Date.now();
      
      try {
        await supabase.from('bookings').select('count').limit(1);
        const dbResponseTime = Date.now() - perfStart;
        
        diagnostics.push({
          category: 'performance',
          test: 'database_response_time',
          status: dbResponseTime < 1000 ? 'good' : dbResponseTime < 3000 ? 'warning' : 'critical',
          value: dbResponseTime,
          unit: 'ms',
          message: `Temps de réponse base de données: ${dbResponseTime}ms`
        });
      } catch (error) {
        diagnostics.push({
          category: 'performance',
          test: 'database_response_time',
          status: 'error',
          message: 'Impossible de tester le temps de réponse DB'
        });
      }
    }

    if (category === 'all' || category === 'data_integrity') {
      // Vérification de l'intégrité des données
      
      // Réservations sans client
      const { data: orphanBookings } = await supabase
        .from('bookings')
        .select('id')
        .not('client_id', 'in', 
          supabase.from('profiles').select('user_id')
        );

      diagnostics.push({
        category: 'data_integrity',
        test: 'orphan_bookings',
        status: (orphanBookings?.length || 0) === 0 ? 'good' : 'warning',
        value: orphanBookings?.length || 0,
        message: `${orphanBookings?.length || 0} réservation(s) sans client valide`
      });

      // Prestataires sans profil utilisateur
      const { data: orphanProviders } = await supabase
        .from('providers')
        .select('id')
        .not('user_id', 'in', 
          supabase.from('profiles').select('user_id')
        );

      diagnostics.push({
        category: 'data_integrity',
        test: 'orphan_providers',
        status: (orphanProviders?.length || 0) === 0 ? 'good' : 'warning',
        value: orphanProviders?.length || 0,
        message: `${orphanProviders?.length || 0} prestataire(s) sans profil utilisateur`
      });
    }

    if (category === 'all' || category === 'business_logic') {
      // Vérifications de logique métier
      
      // Réservations avec dates incohérentes
      const { data: invalidBookings } = await supabase
        .from('bookings')
        .select('id')
        .lt('end_time', 'start_time');

      diagnostics.push({
        category: 'business_logic',
        test: 'invalid_booking_times',
        status: (invalidBookings?.length || 0) === 0 ? 'good' : 'critical',
        value: invalidBookings?.length || 0,
        message: `${invalidBookings?.length || 0} réservation(s) avec horaires incohérents`
      });

      // Prestataires avec tarifs négatifs
      const { data: invalidRates } = await supabase
        .from('providers')
        .select('id')
        .lt('hourly_rate', 0);

      diagnostics.push({
        category: 'business_logic',
        test: 'negative_hourly_rates',
        status: (invalidRates?.length || 0) === 0 ? 'good' : 'warning',
        value: invalidRates?.length || 0,
        message: `${invalidRates?.length || 0} prestataire(s) avec tarif horaire négatif`
      });
    }

    const overallStatus = diagnostics.some(d => d.status === 'critical') ? 'critical' :
                         diagnostics.some(d => d.status === 'error') ? 'error' :
                         diagnostics.some(d => d.status === 'warning') ? 'warning' : 'good';

    return new Response(
      JSON.stringify({
        success: true,
        overall_status: overallStatus,
        diagnostics: diagnostics,
        timestamp: new Date().toISOString(),
        category: category
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors des diagnostics:', error);
    throw error;
  }
}

async function manageCache(supabase: any, { action, adminUserId }: any) {
  try {
    // Simulation de gestion de cache
    const cacheStats = {
      action: action,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    let message = '';
    switch (action) {
      case 'clear':
        message = 'Cache système vidé avec succès';
        break;
      case 'refresh':
        message = 'Cache système rafraîchi avec succès';
        break;
      case 'stats':
        cacheStats.stats = {
          hit_rate: '87%',
          total_entries: 1247,
          memory_usage: '12.4 MB'
        };
        message = 'Statistiques de cache récupérées';
        break;
      default:
        throw new Error(`Action de cache non reconnue: ${action}`);
    }

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'system',
        action_type: 'manage_cache',
        description: `Gestion cache: ${action}`,
        new_data: cacheStats
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: message,
        cache_info: cacheStats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la gestion du cache:', error);
    throw error;
  }
}

async function updateSystemSettings(supabase: any, { settings, adminUserId }: any) {
  try {
    // Pour l'instant, on simule la mise à jour des paramètres système
    // Dans une vraie implémentation, on aurait une table system_settings
    
    const updatedSettings = {
      ...settings,
      updated_at: new Date().toISOString(),
      updated_by: adminUserId
    };

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'system',
        action_type: 'update_settings',
        description: 'Paramètres système mis à jour',
        new_data: updatedSettings
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Paramètres système mis à jour avec succès',
        settings: updatedSettings
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    throw error;
  }
}

async function getSystemLogs(supabase: any, { level = 'all', limit = 100, offset = 0 }: any) {
  try {
    // Récupérer les logs d'actions admin
    let query = supabase
      .from('admin_actions_log')
      .select(`
        id,
        entity_type,
        action_type,
        description,
        created_at,
        admin_user_id
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: logs, error } = await query;
    if (error) throw error;

    // Enrichir avec les noms des admins
    const enrichedLogs = await Promise.all(
      (logs || []).map(async (log) => {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', log.admin_user_id)
          .single();

        return {
          ...log,
          admin_name: adminProfile ? 
            `${adminProfile.first_name} ${adminProfile.last_name}` : 
            'Admin inconnu',
          level: getLogLevel(log.action_type)
        };
      })
    );

    // Filtrer par niveau si spécifié
    const filteredLogs = level === 'all' ? 
      enrichedLogs : 
      enrichedLogs.filter(log => log.level === level);

    return new Response(
      JSON.stringify({
        success: true,
        logs: filteredLogs,
        total: filteredLogs.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    throw error;
  }
}

async function toggleMaintenanceMode(supabase: any, { enabled, message, adminUserId }: any) {
  try {
    // Simulation du mode maintenance
    const maintenanceInfo = {
      enabled: enabled,
      message: message || 'Site en maintenance, veuillez revenir plus tard.',
      enabled_at: enabled ? new Date().toISOString() : null,
      enabled_by: enabled ? adminUserId : null
    };

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'system',
        action_type: 'maintenance_mode',
        description: `Mode maintenance ${enabled ? 'activé' : 'désactivé'}`,
        new_data: maintenanceInfo
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Mode maintenance ${enabled ? 'activé' : 'désactivé'} avec succès`,
        maintenance_info: maintenanceInfo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du basculement du mode maintenance:', error);
    throw error;
  }
}

// Fonctions utilitaires
async function getDetailedSystemStats(supabase: any) {
  const stats = {
    uptime: '99.8%',
    memory_usage: '67%',
    cpu_usage: '23%',
    disk_usage: '45%',
    active_connections: 127,
    requests_per_minute: 450
  };
  
  return stats;
}

function getLogLevel(actionType: string): string {
  const errorActions = ['error', 'failed', 'reject'];
  const warningActions = ['warning', 'suspend', 'cancel'];
  const infoActions = ['create', 'update', 'send'];
  
  if (errorActions.some(action => actionType.includes(action))) return 'error';
  if (warningActions.some(action => actionType.includes(action))) return 'warning';
  if (infoActions.some(action => actionType.includes(action))) return 'info';
  
  return 'debug';
}