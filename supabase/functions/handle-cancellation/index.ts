import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ⚠️ Politique de remboursement : le remboursement n'est autorisé QUE dans ces cas
const REFUND_ALLOWED_REASONS = [
  'client_refuses_all_alternatives',
  'no_replacement_found_48h',
  'client_initiated_cancellation',
  'admin_manual_override'
] as const;

type RefundReason = typeof REFUND_ALLOWED_REASONS[number];

interface CancellationRequest {
  bookingId: string;
  reason: string;
  cancelledBy: 'client' | 'provider' | 'admin';
  refundAmount: number;
  refundPercentage: number;
  refundReason?: RefundReason; // Doit être fourni pour autoriser le remboursement
  skipReplacementSearch?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      bookingId,
      reason,
      cancelledBy,
      refundAmount,
      refundPercentage,
      refundReason,
      skipReplacementSearch
    }: CancellationRequest = await req.json();

    console.log('Processing cancellation:', { bookingId, cancelledBy, refundAmount, refundReason });

    // 1. Récupérer la réservation et le paiement
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        payments!inner(id, stripe_payment_intent_id, amount, status)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) throw bookingError;

    // 2. Pour annulation prestataire : tenter recherche remplaçant AVANT remboursement
    let replacementFound = false;
    let replacementProviderId: string | null = null;

    if (cancelledBy === 'provider' && !skipReplacementSearch) {
      console.log('Provider cancellation: searching for replacement...');
      
      await supabase
        .from('bookings')
        .update({ replacement_search_status: 'searching' })
        .eq('id', bookingId);

      // Recherche de remplaçant via la fonction de matching existante
      const { data: replacement } = await supabase.functions.invoke('find-replacement-provider', {
        body: { bookingId, excludeProviderId: booking.provider_id }
      }).catch(err => {
        console.warn('find-replacement-provider unavailable, fallback to manual search:', err);
        return { data: null };
      });

      if (replacement?.providerId) {
        replacementFound = true;
        replacementProviderId = replacement.providerId;

        // Créer une emergency_assignment
        await supabase.from('emergency_assignments').insert({
          original_booking_id: bookingId,
          replacement_provider_id: replacementProviderId,
          reason: `Annulation prestataire: ${reason}`,
          auto_assigned: true,
          status: 'pending'
        });

        await supabase
          .from('bookings')
          .update({ 
            replacement_search_status: 'found',
            provider_id: replacementProviderId,
            assigned_at: new Date().toISOString()
          })
          .eq('id', bookingId);

        console.log('Replacement found:', replacementProviderId);
      } else {
        await supabase
          .from('bookings')
          .update({ replacement_search_status: 'not_found' })
          .eq('id', bookingId);
      }

      // Pénalité prestataire (1ère = avertissement, 2e+ = suspension)
      const { data: existingPenalties } = await supabase
        .from('provider_penalties')
        .select('id')
        .eq('provider_id', booking.provider_id)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // 90j

      const penaltyCount = (existingPenalties?.length || 0) + 1;
      const penaltyType = penaltyCount === 1 ? 'warning' : 'suspension';

      await supabase.from('provider_penalties').insert({
        provider_id: booking.provider_id,
        booking_id: bookingId,
        type: penaltyType,
        reason: `Annulation prestataire: ${reason}`,
        severity: penaltyCount >= 2 ? 'high' : 'low'
      }).then(() => {}, err => console.warn('provider_penalties insert failed (table may differ):', err));
    }

    // 3. Si remplaçant trouvé → pas de remboursement, mission maintenue
    if (replacementFound) {
      // Notifier client : nouveau prestataire assigné
      await supabase.from('realtime_notifications').insert({
        user_id: booking.client_id,
        type: 'replacement_assigned',
        title: 'Nouveau prestataire assigné',
        message: 'Votre prestation est maintenue avec un autre prestataire au même créneau.',
        priority: 'high',
        data: { bookingId, newProviderId: replacementProviderId }
      });

      return new Response(
        JSON.stringify({
          success: true,
          replacementFound: true,
          replacementProviderId,
          refundProcessed: false,
          message: 'Mission réassignée à un nouveau prestataire'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 4. Pas de remplaçant → vérifier si remboursement autorisé
    const refundAuthorized = refundReason && REFUND_ALLOWED_REASONS.includes(refundReason);

    if (refundAmount > 0 && !refundAuthorized) {
      // Remboursement BLOQUÉ : proposer alternatives au lieu
      console.log('Refund blocked - no authorized reason. Suggesting alternatives.');

      // Créer une notification client : choisir une alternative
      await supabase.from('realtime_notifications').insert({
        user_id: booking.client_id,
        type: 'alternatives_required',
        title: 'Choisissez une alternative',
        message: cancelledBy === 'provider'
          ? 'Aucun remplaçant immédiat. Choisissez un nouveau créneau ou un bon de réduction de 20%.'
          : 'Avant remboursement, merci de consulter les créneaux alternatifs proposés.',
        priority: 'high',
        data: { bookingId, requiresAction: true, action: 'choose_alternative' }
      });

      // Si annulation prestataire sans remplaçant : offrir voucher 20%
      if (cancelledBy === 'provider') {
        await supabase.from('client_rewards').insert({
          client_id: booking.client_id,
          booking_id: bookingId,
          reward_type: 'discount_20_percent',
          status: 'available',
          earned_date: new Date().toISOString(),
          valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }).then(() => {}, err => console.warn('voucher creation failed:', err));
      }

      return new Response(
        JSON.stringify({
          success: true,
          refundProcessed: false,
          alternativesProposed: true,
          voucherIssued: cancelledBy === 'provider',
          message: 'Alternatives proposées. Remboursement uniquement si refus de toutes les options.'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 5. Mettre à jour le statut de la réservation (annulation effective)
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: `${reason}${refundReason ? ` [${refundReason}]` : ''}`,
        cancelled_by: cancelledBy
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    // 6. Si remboursement autorisé > 0, traiter le remboursement Stripe
    let refundResult = null;
    if (refundAmount > 0 && refundAuthorized && booking.payments?.[0]) {
      const payment = booking.payments[0];
      
      if (payment.stripe_payment_intent_id) {
        const { data: refundData, error: refundError } = await supabase.functions.invoke(
          'process-refund',
          {
            body: {
              paymentIntentId: payment.stripe_payment_intent_id,
              refundAmount: Math.round(refundAmount * 100),
              reason: `Cancellation [${refundReason}]: ${reason}`
            }
          }
        );

        if (refundError) {
          console.error('Refund error:', refundError);
          throw refundError;
        }

        refundResult = refundData;

        await supabase
          .from('payments')
          .update({
            status: 'remboursé',
            refund_amount: refundAmount,
            refund_date: new Date().toISOString(),
            admin_notes: `Remboursement: ${refundPercentage}% - ${refundReason} - ${reason}`
          })
          .eq('id', payment.id);
      }
    }

    // 7. Notifications client + prestataire
    const notifications = [];

    if (booking.client_id) {
      notifications.push(
        supabase.from('realtime_notifications').insert({
          user_id: booking.client_id,
          type: 'booking_cancelled',
          title: 'Réservation annulée',
          message: refundAmount > 0 && refundAuthorized
            ? `Votre réservation a été annulée. Remboursement: ${refundAmount.toFixed(2)}€`
            : `Votre réservation a été annulée.`,
          priority: 'high',
          data: { bookingId, refundAmount: refundAuthorized ? refundAmount : 0, refundPercentage }
        })
      );
    }

    if (booking.provider_id) {
      notifications.push(
        supabase.from('provider_notifications').insert({
          provider_id: booking.provider_id,
          booking_id: bookingId,
          type: 'booking_cancelled',
          title: 'Réservation annulée',
          message: cancelledBy === 'provider'
            ? 'Vous avez annulé cette réservation'
            : `Annulation: ${reason}`
        })
      );
    }

    await Promise.all(notifications);

    // 8. Email transactionnel (best-effort)
    try {
      const { data: clientData } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('user_id', booking.client_id)
        .single();

      const { data: serviceData } = await supabase
        .from('services')
        .select('name')
        .eq('id', booking.service_id)
        .single();

      if (clientData?.email) {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            type: 'cancellation',
            recipientEmail: clientData.email,
            recipientName: `${clientData.first_name} ${clientData.last_name}`,
            data: {
              clientName: clientData.first_name || 'Client',
              serviceName: serviceData?.name || 'Service',
              bookingDate: new Date(booking.booking_date).toLocaleDateString('fr-FR'),
              cancelledBy,
              reason,
              refundAmount: refundAuthorized ? refundAmount : 0,
              refundPercentage: refundAuthorized ? refundPercentage : 0
            }
          }
        });
      }
    } catch (emailErr) {
      console.warn('Email send failed:', emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        refundAmount: refundAuthorized ? refundAmount : 0,
        refundPercentage: refundAuthorized ? refundPercentage : 0,
        refundProcessed: !!refundResult,
        refundAuthorized,
        replacementFound: false
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in handle-cancellation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
