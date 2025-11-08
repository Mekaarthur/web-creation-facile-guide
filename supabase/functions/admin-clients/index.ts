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
    console.log('Admin clients action:', action, 'Data:', requestData);

    switch (action) {
      case 'list':
        return await listClients(supabase, requestData);
      case 'get_stats':
        return await getClientStats(supabase, requestData);
      case 'get_client_details':
        return await getClientDetails(supabase, requestData);
      case 'update_client':
        return await updateClient(supabase, requestData, user.id);
      case 'block_client':
        return await blockClient(supabase, requestData, user.id);
      case 'unblock_client':
        return await unblockClient(supabase, requestData, user.id);
      case 'create_client':
        return await createClient(supabase, requestData, user.id);
      default:
        throw new Error(`Action non reconnue: ${action}`);
    }
  } catch (error) {
    console.error('Erreur dans admin-clients:', error);
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

async function listClients(supabase: any, { limit = 50, offset = 0, searchTerm, statusFilter, serviceFilter }: any) {
  try {
    let query = supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        address,
        created_at,
        account_status,
        blocked_at,
        total_bookings,
        total_spent
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('account_status', statusFilter);
    }

    const { data: clients, error } = await query;

    if (error) throw error;

    // Enrichir avec les statistiques pour chaque client
    const enrichedClients = await Promise.all(
      (clients || []).map(async (client) => {
        // Utiliser les stats déjà calculées si disponibles, sinon les calculer
        let totalBookings = client.total_bookings || 0;
        let totalSpent = client.total_spent || 0;
        let completedBookings = 0;
        let customRequests = 0;

        if (!client.total_bookings || !client.total_spent) {
          const { data: bookings } = await supabase
            .from('bookings')
            .select('id, total_price, status, services(category)')
            .eq('client_id', client.user_id);

          totalBookings = bookings?.length || 0;
          completedBookings = bookings?.filter(b => b.status === 'completed')?.length || 0;
          totalSpent = bookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

          // Appliquer le filtre de service si nécessaire
          if (serviceFilter && serviceFilter !== 'all' && bookings) {
            const filteredBookings = bookings.filter(b => b.services?.category === serviceFilter);
            if (filteredBookings.length === 0) return null; // Exclure ce client
          }
        }

        const { data: requests } = await supabase
          .from('custom_requests')
          .select('id')
          .eq('client_email', client.email);

        customRequests = requests?.length || 0;

        return {
          ...client,
          full_name: `${client.first_name || ''} ${client.last_name || ''}`.trim(),
          status: client.account_status || 'active',
          stats: {
            total_bookings: totalBookings,
            completed_bookings: completedBookings,
            custom_requests: customRequests,
            total_spent: totalSpent,
            average_booking_value: totalBookings > 0 ? totalSpent / totalBookings : 0
          }
        };
      })
    );

    // Filtrer les clients null (exclus par le filtre de service)
    const validClients = enrichedClients.filter(c => c !== null);

    return new Response(
      JSON.stringify({ success: true, clients: validClients }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du listage des clients:', error);
    throw error;
  }
}

async function getClientDetails(supabase: any, { clientId }: any) {
  try {
    // Profil client
    const { data: client, error: clientError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', clientId)
      .single();

    if (clientError) throw clientError;

    // Réservations du client
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
        services(name, category),
        providers(business_name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Demandes personnalisées
    const { data: customRequests } = await supabase
      .from('custom_requests')
      .select('*')
      .eq('client_email', client.email)
      .order('created_at', { ascending: false })
      .limit(5);

    // Paiements
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Statistiques
    const totalBookings = bookings?.length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed')?.length || 0;
    const totalSpent = payments?.filter(p => p.status === 'payé')?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    return new Response(
      JSON.stringify({
        success: true,
        client: {
          ...client,
          bookings: bookings || [],
          custom_requests: customRequests || [],
          payments: payments || [],
          stats: {
            total_bookings: totalBookings,
            completed_bookings: completedBookings,
            total_spent: totalSpent,
            completion_rate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des détails client:', error);
    throw error;
  }
}

async function updateClient(supabase: any, { clientId, updates }: any, adminUserId: string) {
  try {
    // Récupérer les anciennes données
    const { data: oldClient } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', clientId)
      .single();

    // Mettre à jour
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', clientId);

    if (error) throw error;

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'client',
        entity_id: clientId,
        action_type: 'update',
        old_data: oldClient,
        new_data: updates,
        description: 'Profil client mis à jour par admin'
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Client mis à jour avec succès' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour du client:', error);
    throw error;
  }
}

async function blockClient(supabase: any, { clientId, reason }: any, adminUserId: string) {
  try {
    const { data: client, error: clientError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', clientId)
      .single();

    if (clientError) throw clientError;

    // Bloquer le client
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        account_status: 'blocked',
        blocked_at: new Date().toISOString(),
        blocked_by: adminUserId,
        block_reason: reason
      })
      .eq('user_id', clientId);

    if (updateError) throw updateError;

    // Annuler les réservations futures
    await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_by: 'admin',
        cancellation_reason: 'Client bloqué par administrateur'
      })
      .eq('client_id', clientId)
      .in('status', ['pending', 'confirmed']);

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'client',
        entity_id: clientId,
        action_type: 'block',
        old_data: client,
        new_data: { account_status: 'blocked', block_reason: reason },
        description: `Client bloqué: ${reason}`
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Client bloqué avec succès' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du blocage du client:', error);
    throw error;
  }
}

async function unblockClient(supabase: any, { clientId }: any, adminUserId: string) {
  try {
    const { data: client, error: clientError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', clientId)
      .single();

    if (clientError) throw clientError;

    // Débloquer le client
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        account_status: 'active',
        blocked_at: null,
        blocked_by: null,
        block_reason: null
      })
      .eq('user_id', clientId);

    if (updateError) throw updateError;

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'client',
        entity_id: clientId,
        action_type: 'unblock',
        old_data: client,
        new_data: { account_status: 'active' },
        description: 'Client débloqué'
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Client débloqué avec succès' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du déblocage du client:', error);
    throw error;
  }
}

async function createClient(supabase: any, { email, firstName, lastName, phone, address }: any, adminUserId: string) {
  try {
    // Créer l'utilisateur dans Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: phone
      }
    });

    if (authError) throw authError;

    // Créer le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        address: address,
        account_status: 'active'
      });

    if (profileError) throw profileError;

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'client',
        entity_id: authData.user.id,
        action_type: 'create',
        new_data: { email, firstName, lastName, phone, address },
        description: 'Client créé manuellement par admin'
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Client créé avec succès',
        clientId: authData.user.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la création du client:', error);
    throw error;
  }
}

async function getClientStats(supabase: any, { timeRange = '30d' }: any) {
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

    // Total des clients
    const { data: allClients } = await supabase
      .from('profiles')
      .select('user_id, created_at, account_status');

    // Nouveaux clients dans la période
    const { data: newClients } = await supabase
      .from('profiles')
      .select('user_id')
      .gte('created_at', startDate.toISOString());

    // Clients actifs (avec au moins une réservation)
    const { data: activeClients } = await supabase
      .from('bookings')
      .select('client_id')
      .gte('created_at', startDate.toISOString());

    // CA total
    const { data: revenue } = await supabase
      .from('bookings')
      .select('total_price')
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString());

    // Taux de rétention (clients avec plus d'une réservation)
    const { data: repeatClients } = await supabase
      .from('bookings')
      .select('client_id')
      .gte('created_at', startDate.toISOString());

    const clientBookingCounts = repeatClients?.reduce((acc: any, booking: any) => {
      acc[booking.client_id] = (acc[booking.client_id] || 0) + 1;
      return acc;
    }, {});

    const repeatClientCount = Object.values(clientBookingCounts || {}).filter((count: any) => count > 1).length;

    const totalClients = allClients?.length || 0;
    const newClientsCount = newClients?.length || 0;
    const activeClientsCount = new Set(activeClients?.map(b => b.client_id) || []).size;
    const totalRevenue = revenue?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
    const blockedClients = allClients?.filter(c => c.account_status === 'blocked')?.length || 0;
    const retentionRate = activeClientsCount > 0 ? Math.round((repeatClientCount / activeClientsCount) * 100) : 0;

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total: totalClients,
          new: newClientsCount,
          active: activeClientsCount,
          blocked: blockedClients,
          activity_rate: totalClients > 0 ? Math.round((activeClientsCount / totalClients) * 100) : 0,
          retention_rate: retentionRate,
          total_revenue: totalRevenue,
          average_revenue_per_client: activeClientsCount > 0 ? totalRevenue / activeClientsCount : 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du calcul des stats clients:', error);
    throw error;
  }
}