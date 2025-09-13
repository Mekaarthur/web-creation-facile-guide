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
    console.log(`Incident management action: ${action}`, params)

    let result;

    switch (action) {
      case 'cancel_last_minute':
        result = await handleLastMinuteCancellation(supabase, params);
        break;
      case 'report_absence':
        result = await handleAbsence(supabase, params);
        break;
      case 'quality_complaint':
        result = await handleQualityComplaint(supabase, params);
      case 'payment_dispute':
        result = await handlePaymentDispute(supabase, params);
        break;
      case 'create_counter_proposal':
        result = await createCounterProposal(supabase, params);
        break;
      case 'get_incidents':
        result = await getIncidents(supabase, params);
        break;
      default:
        throw new Error(`Action non supportée: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Incident management error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Erreur interne du serveur' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

async function handleLastMinuteCancellation(supabase: any, { bookingId, reason, cancelledBy }: any) {
  const currentTime = new Date();
  
  // Récupérer les détails de la réservation
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*, services(name)')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error('Réservation non trouvée');
  }

  // Vérifier si c'est vraiment last-minute (moins de 4h avant)
  const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
  const timeDiff = (bookingDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
  const isLastMinute = timeDiff < 4;

  // Créer un incident
  const { data: incident } = await supabase
    .from('incidents')
    .insert({
      booking_id: bookingId,
      type: 'cancellation_last_minute',
      severity: isLastMinute ? 'high' : 'medium',
      description: `Annulation ${isLastMinute ? 'de dernière minute' : ''}: ${reason}`,
      reported_by: cancelledBy,
      status: 'open',
      metadata: {
        hours_before: timeDiff,
        original_booking: booking,
        cancellation_reason: reason
      }
    })
    .select()
    .single();

  // Mettre à jour la réservation
  await supabase
    .from('bookings')
    .update({ 
      status: 'cancelled',
      provider_notes: `Annulé par ${cancelledBy}: ${reason}`
    })
    .eq('id', bookingId);

  // Notifications et compensations automatiques
  if (isLastMinute) {
    // Notification urgente admin
    await supabase.from('realtime_notifications').insert({
      user_id: 'admin',
      type: 'urgent_cancellation',
      title: '🚨 Annulation dernière minute',
      message: `Réservation ${booking.services.name} annulée avec ${timeDiff.toFixed(1)}h d'avance`,
      priority: 'high',
      data: { bookingId, incident_id: incident.id }
    });

    // Chercher un remplaçant automatiquement
    await findReplacementProvider(supabase, booking);
  }

  return { 
    success: true, 
    incident_id: incident.id,
    is_last_minute: isLastMinute,
    message: 'Incident créé et traitement en cours'
  };
}

async function handleAbsence(supabase: any, { bookingId, absentType, reportedBy }: any) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, services(name)')
    .eq('id', bookingId)
    .single();

  const { data: incident } = await supabase
    .from('incidents')
    .insert({
      booking_id: bookingId,
      type: `absence_${absentType}`, // provider_absent ou client_absent
      severity: 'high',
      description: `Absence signalée: ${absentType}`,
      reported_by: reportedBy,
      status: 'open',
      metadata: {
        absence_type: absentType,
        booking_details: booking
      }
    })
    .select()
    .single();

  // Actions automatiques selon le type d'absence
  if (absentType === 'provider') {
    // Pénalités prestataire et recherche de remplaçant
    await supabase.from('provider_penalties').insert({
      provider_id: booking.provider_id,
      booking_id: bookingId,
      penalty_type: 'absence',
      amount: booking.total_price * 0.1 // 10% de pénalité
    });
    
    await findReplacementProvider(supabase, booking);
  } else {
    // Client absent - compensation prestataire
    await supabase.from('provider_compensations').insert({
      provider_id: booking.provider_id,
      booking_id: bookingId,
      amount: booking.total_price * 0.5, // 50% du montant
      reason: 'client_absence'
    });
  }

  return { success: true, incident_id: incident.id };
}

async function handleQualityComplaint(supabase: any, { bookingId, complaint, severity, reportedBy }: any) {
  const { data: incident } = await supabase
    .from('incidents')
    .insert({
      booking_id: bookingId,
      type: 'quality_complaint',
      severity,
      description: complaint,
      reported_by: reportedBy,
      status: 'open',
      metadata: {
        complaint_details: complaint,
        quality_issues: true
      }
    })
    .select()
    .single();

  // Auto-escalade selon la sévérité
  if (severity === 'critical') {
    await supabase.from('realtime_notifications').insert({
      user_id: 'admin',
      type: 'quality_alert',
      title: '🔴 Réclamation qualité critique',
      message: complaint.substring(0, 100),
      priority: 'urgent',
      data: { bookingId, incident_id: incident.id }
    });
  }

  return { success: true, incident_id: incident.id };
}

async function handlePaymentDispute(supabase: any, { bookingId, dispute, amount, reportedBy }: any) {
  const { data: incident } = await supabase
    .from('incidents')
    .insert({
      booking_id: bookingId,
      type: 'payment_dispute',
      severity: 'high',
      description: dispute,
      reported_by: reportedBy,
      status: 'open',
      metadata: {
        dispute_amount: amount,
        dispute_details: dispute
      }
    })
    .select()
    .single();

  // Bloquer les paiements en attente
  await supabase
    .from('payments')
    .update({ status: 'disputed' })
    .eq('booking_id', bookingId);

  return { success: true, incident_id: incident.id };
}

async function createCounterProposal(supabase: any, { originalBookingId, providerId, proposedDate, proposedTime, newPrice, reason }: any) {
  const { data: counterProposal } = await supabase
    .from('counter_proposals')
    .insert({
      original_booking_id: originalBookingId,
      provider_id: providerId,
      proposed_date: proposedDate,
      proposed_time: proposedTime,
      proposed_price: newPrice,
      reason: reason,
      status: 'pending'
    })
    .select()
    .single();

  // Notifier le client
  const { data: booking } = await supabase
    .from('bookings')
    .select('client_id, services(name)')
    .eq('id', originalBookingId)
    .single();

  await supabase.from('realtime_notifications').insert({
    user_id: booking.client_id,
    type: 'counter_proposal',
    title: 'Nouvelle contre-proposition',
    message: `Votre prestataire propose une alternative pour ${booking.services.name}`,
    data: { counterProposalId: counterProposal.id }
  });

  return { success: true, counter_proposal_id: counterProposal.id };
}

async function findReplacementProvider(supabase: any, booking: any) {
  // Utiliser l'algorithme de matching pour trouver un remplaçant
  const { data: replacements } = await supabase.functions.invoke('match-providers', {
    body: {
      serviceType: booking.services.name,
      location: booking.address,
      urgency: 'urgent',
      dateTime: `${booking.booking_date}T${booking.start_time}`
    }
  });

  if (replacements?.providers?.length > 0) {
    const bestReplacement = replacements.providers[0];
    
    // Créer une nouvelle assignation
    await supabase.from('emergency_assignments').insert({
      original_booking_id: booking.id,
      replacement_provider_id: bestReplacement.provider_id,
      reason: 'last_minute_replacement',
      auto_assigned: true
    });

    // Notifier le nouveau prestataire
    await supabase.from('provider_notifications').insert({
      provider_id: bestReplacement.provider_id,
      title: '🚨 Mission urgente disponible',
      message: `Remplacement de dernière minute pour ${booking.services.name}`,
      type: 'urgent_assignment',
      booking_id: booking.id
    });
  }
}

async function getIncidents(supabase: any, { timeRange = '7d', status, type }: any) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = supabase
    .from('incidents')
    .select(`
      *,
      bookings(id, booking_date, services(name), client_id, provider_id)
    `)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  if (type) {
    query = query.eq('type', type);
  }

  const { data: incidents, error } = await query;

  if (error) throw error;

  // Statistiques des incidents
  const stats = {
    total: incidents?.length || 0,
    by_type: {},
    by_severity: {},
    resolution_time_avg: 0
  };

  incidents?.forEach((incident: any) => {
    stats.by_type[incident.type] = (stats.by_type[incident.type] || 0) + 1;
    stats.by_severity[incident.severity] = (stats.by_severity[incident.severity] || 0) + 1;
  });

  return {
    incidents: incidents || [],
    statistics: stats,
    trends: {
      last_24h: incidents?.filter(i => 
        new Date(i.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length || 0
    }
  };
}