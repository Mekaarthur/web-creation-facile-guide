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
    console.log('Admin reservations action:', action, 'Data:', requestData);

    switch (action) {
      case 'list':
        return await listBookings(supabase, requestData);
      case 'update_status':
        return await updateBookingStatus(supabase, requestData);
      case 'get_stats':
        return await getBookingStats(supabase, requestData);
      case 'reassign':
        return await reassignBooking(supabase, requestData);
      default:
        throw new Error(`Action non reconnue: ${action}`);
    }
  } catch (error) {
    console.error('Erreur dans admin-reservations:', error);
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

async function listBookings(supabase: any, { status = 'all', limit = 50, offset = 0, dateFilter }: any) {
  try {
    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        total_price,
        status,
        created_at,
        confirmed_at,
        client_id,
        provider_id,
        service_id,
        notes,
        address
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (dateFilter) {
      query = query.gte('booking_date', dateFilter.start).lte('booking_date', dateFilter.end);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;

    // Enrichir avec les données client, prestataire et service
    const enrichedBookings = await Promise.all(
      (bookings || []).map(async (booking) => {
        // Client info
        const { data: client } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone')
          .eq('user_id', booking.client_id)
          .single();

        // Provider info
        const { data: provider } = await supabase
          .from('providers')
          .select('business_name')
          .eq('id', booking.provider_id)
          .single();

        // Service info
        const { data: service } = await supabase
          .from('services')
          .select('name, category')
          .eq('id', booking.service_id)
          .single();

        return {
          ...booking,
          client_name: client ? `${client.first_name} ${client.last_name}` : 'Client inconnu',
          client_email: client?.email || '',
          client_phone: client?.phone || '',
          provider_name: provider?.business_name || 'Prestataire non assigné',
          service_name: service?.name || 'Service inconnu',
          service_category: service?.category || ''
        };
      })
    );

    return new Response(
      JSON.stringify({ success: true, bookings: enrichedBookings }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du listage des réservations:', error);
    throw error;
  }
}

async function updateBookingStatus(supabase: any, { bookingId, status, adminUserId, reason }: any) {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: status })
      .eq('id', bookingId);

    if (error) throw error;

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'booking',
        entity_id: bookingId,
        action_type: 'status_update',
        new_data: { status },
        description: `Statut modifié vers ${status}: ${reason || 'Aucune raison spécifiée'}`
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Statut mis à jour avec succès' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
}

async function reassignBooking(supabase: any, { bookingId, newProviderId, adminUserId, reason }: any) {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        provider_id: newProviderId,
        assigned_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) throw error;

    // Notifier le nouveau prestataire
    await supabase
      .from('provider_notifications')
      .insert({
        provider_id: newProviderId,
        booking_id: bookingId,
        title: 'Nouvelle assignation',
        message: 'Une réservation vous a été réassignée par l\'administration.',
        type: 'assignment'
      });

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'booking',
        entity_id: bookingId,
        action_type: 'reassign',
        new_data: { provider_id: newProviderId },
        description: `Réassignation à un nouveau prestataire: ${reason || 'Aucune raison spécifiée'}`
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Réservation réassignée avec succès' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la réassignation:', error);
    throw error;
  }
}

async function getBookingStats(supabase: any, { timeRange = '30d' }: any) {
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

    const { data: bookings } = await supabase
      .from('bookings')
      .select('status, total_price, created_at')
      .gte('created_at', startDate.toISOString());

    const totalBookings = bookings?.length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed')?.length || 0;
    const pendingBookings = bookings?.filter(b => b.status === 'pending')?.length || 0;
    const canceledBookings = bookings?.filter(b => b.status === 'canceled')?.length || 0;
    const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total: totalBookings,
          completed: completedBookings,
          pending: pendingBookings,
          canceled: canceledBookings,
          revenue: totalRevenue,
          completion_rate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du calcul des stats réservations:', error);
    throw error;
  }
}