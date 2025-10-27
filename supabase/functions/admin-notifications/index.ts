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
    // Vérifier l'authentification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier le rôle admin
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Accès refusé - Droits administrateur requis' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...requestData } = await req.json();

    switch (action) {
      case 'list_notifications':
        return new Response(JSON.stringify(await listNotifications(supabase, requestData)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'send_notification':
        return new Response(JSON.stringify(await sendNotification(supabase, requestData)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'send_bulk_notification':
        return new Response(JSON.stringify(await sendBulkNotification(supabase, requestData)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'get_notification_stats':
        return new Response(JSON.stringify(await getNotificationStats(supabase, requestData)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'get_templates':
        return new Response(JSON.stringify(await getNotificationTemplates(supabase)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      default:
        throw new Error(`Action non reconnue: ${action}`);
    }
  } catch (error) {
    console.error('Erreur dans admin-notifications:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function listNotifications(supabase: any, { type, status, limit = 50, offset = 0 }: any) {
  let query = supabase
    .from('notification_logs')
    .select(`
      *,
      profiles!user_id(first_name, last_name, email)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq('notification_type', type);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: notifications, error } = await query;

  if (error) {
    throw new Error(`Erreur récupération notifications: ${error.message}`);
  }

  return {
    success: true,
    notifications: notifications || []
  };
}

async function sendNotification(supabase: any, { userId, type, title, content, priority = 'normal' }: any) {
  // Créer la notification en temps réel
  const { data: notification, error: notificationError } = await supabase
    .from('realtime_notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message: content,
      priority
    })
    .select()
    .single();

  if (notificationError) {
    throw new Error(`Erreur création notification: ${notificationError.message}`);
  }

  // Logger dans les notification_logs
  await supabase
    .from('notification_logs')
    .insert({
      user_id: userId,
      notification_type: type,
      subject: title,
      content,
      status: 'sent'
    });

  return {
    success: true,
    notification,
    message: 'Notification envoyée avec succès'
  };
}

async function sendBulkNotification(supabase: any, { targetType, title, content, priority = 'normal', serviceType }: any) {
  let targetUsers = [];

  switch (targetType) {
    case 'all_clients':
      const { data: allClients } = await supabase
        .from('profiles')
        .select('user_id');
      targetUsers = allClients?.map((c: any) => c.user_id) || [];
      break;

    case 'all_providers':
      const { data: allProviders } = await supabase
        .from('providers')
        .select('user_id')
        .eq('status', 'active');
      targetUsers = allProviders?.map((p: any) => p.user_id) || [];
      break;

    case 'inactive_providers':
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data: inactiveProviders } = await supabase
        .from('providers')
        .select('user_id')
        .eq('status', 'active')
        .lt('last_activity_at', weekAgo.toISOString());
      targetUsers = inactiveProviders?.map((p: any) => p.user_id) || [];
      break;

    case 'service_providers':
      if (serviceType) {
        const { data: serviceProviders } = await supabase
          .from('provider_services')
          .select(`
            providers!inner(user_id)
          `)
          .eq('is_active', true)
          .eq('services.category', serviceType);
        targetUsers = serviceProviders?.map((sp: any) => sp.providers.user_id) || [];
      }
      break;

    default:
      throw new Error('Type de cible non supporté');
  }

  if (targetUsers.length === 0) {
    return {
      success: true,
      sent: 0,
      message: 'Aucun utilisateur trouvé pour cette cible'
    };
  }

  // Envoyer les notifications en lot
  const notifications = targetUsers.map((userId: string) => ({
    user_id: userId,
    type: 'admin_broadcast',
    title,
    message: content,
    priority
  }));

  const { error: bulkError } = await supabase
    .from('realtime_notifications')
    .insert(notifications);

  if (bulkError) {
    throw new Error(`Erreur envoi groupé: ${bulkError.message}`);
  }

  // Logger les envois
  const logs = targetUsers.map((userId: string) => ({
    user_id: userId,
    notification_type: 'admin_broadcast',
    subject: title,
    content,
    status: 'sent'
  }));

  await supabase
    .from('notification_logs')
    .insert(logs);

  return {
    success: true,
    sent: targetUsers.length,
    message: `Notification envoyée à ${targetUsers.length} utilisateur(s)`
  };
}

async function getNotificationStats(supabase: any, { days = 7 }: any) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: notifications } = await supabase
    .from('notification_logs')
    .select('status, notification_type, opened_at, clicked_at')
    .gte('created_at', startDate.toISOString());

  const total = notifications?.length || 0;
  const delivered = notifications?.filter((n: any) => n.status === 'delivered').length || 0;
  const opened = notifications?.filter((n: any) => n.opened_at).length || 0;
  const clicked = notifications?.filter((n: any) => n.clicked_at).length || 0;

  // Stats par type
  const typeStats = {};
  notifications?.forEach((n: any) => {
    const type = n.notification_type || 'unknown';
    if (!typeStats[type]) {
      typeStats[type] = { sent: 0, opened: 0, clicked: 0 };
    }
    typeStats[type].sent++;
    if (n.opened_at) typeStats[type].opened++;
    if (n.clicked_at) typeStats[type].clicked++;
  });

  return {
    success: true,
    stats: {
      total,
      delivered,
      opened,
      clicked,
      deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
      openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
      clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
      typeStats
    }
  };
}

async function getNotificationTemplates(supabase: any) {
  const templates = [
    {
      id: 'welcome_client',
      name: 'Bienvenue Client',
      type: 'welcome',
      title: 'Bienvenue sur Bikawo !',
      content: 'Nous sommes ravis de vous accueillir dans notre communauté. Découvrez tous nos services d\'aide à domicile.',
      variables: ['client_name']
    },
    {
      id: 'welcome_provider',
      name: 'Bienvenue Prestataire',
      type: 'welcome',
      title: 'Bienvenue dans l\'équipe Bikawo !',
      content: 'Félicitations ! Votre candidature a été approuvée. Vous pouvez maintenant commencer à recevoir des missions.',
      variables: ['provider_name']
    },
    {
      id: 'booking_reminder',
      name: 'Rappel de Réservation',
      type: 'reminder',
      title: 'Rappel : Votre prestation demain',
      content: 'N\'oubliez pas votre prestation prévue demain à {time}. Votre prestataire {provider_name} vous contactera bientôt.',
      variables: ['time', 'provider_name', 'service_name']
    },
    {
      id: 'maintenance_alert',
      name: 'Alerte Maintenance',
      type: 'system',
      title: 'Maintenance programmée',
      content: 'Notre plateforme sera en maintenance le {date} de {start_time} à {end_time}. Nous nous excusons pour la gêne occasionnée.',
      variables: ['date', 'start_time', 'end_time']
    },
    {
      id: 'seasonal_promo',
      name: 'Promotion Saisonnière',
      type: 'marketing',
      title: 'Offre spéciale {season} !',
      content: 'Profitez de notre offre spéciale : {discount}% de réduction sur tous les services {service_category} jusqu\'au {end_date}.',
      variables: ['season', 'discount', 'service_category', 'end_date']
    }
  ];

  return {
    success: true,
    templates
  };
}