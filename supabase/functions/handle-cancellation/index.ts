import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancellationRequest {
  bookingId: string;
  reason: string;
  cancelledBy: 'client' | 'provider';
  refundAmount: number;
  refundPercentage: number;
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
      refundPercentage
    }: CancellationRequest = await req.json();

    console.log('Processing cancellation:', { bookingId, cancelledBy, refundAmount });

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

    // 2. Mettre à jour le statut de la réservation
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        cancelled_by: cancelledBy
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    // 3. Si remboursement > 0, traiter le remboursement Stripe
    let refundResult = null;
    if (refundAmount > 0 && booking.payments?.[0]) {
      const payment = booking.payments[0];
      
      if (payment.stripe_payment_intent_id) {
        // Appeler l'edge function de remboursement
        const { data: refundData, error: refundError } = await supabase.functions.invoke(
          'process-refund',
          {
            body: {
              paymentIntentId: payment.stripe_payment_intent_id,
              refundAmount: Math.round(refundAmount * 100), // En centimes
              reason: `Cancellation: ${reason}`
            }
          }
        );

        if (refundError) {
          console.error('Refund error:', refundError);
          throw refundError;
        }

        refundResult = refundData;

        // Mettre à jour le paiement
        await supabase
          .from('payments')
          .update({
            status: 'remboursé',
            refund_amount: refundAmount,
            refund_date: new Date().toISOString(),
            admin_notes: `Remboursement automatique: ${refundPercentage}% - ${reason}`
          })
          .eq('id', payment.id);
      }
    }

    // 4. Créer des notifications
    const notifications = [];

    // Notification pour le client
    if (booking.client_id) {
      notifications.push(
        supabase.from('realtime_notifications').insert({
          user_id: booking.client_id,
          type: 'booking_cancelled',
          title: 'Réservation annulée',
          message: cancelledBy === 'client'
            ? `Votre réservation a été annulée. Remboursement: ${refundAmount.toFixed(2)}€`
            : `Le prestataire a annulé votre réservation. Remboursement intégral: ${booking.total_price.toFixed(2)}€`,
          priority: 'high',
          data: {
            bookingId,
            refundAmount: cancelledBy === 'provider' ? booking.total_price : refundAmount,
            refundPercentage: cancelledBy === 'provider' ? 100 : refundPercentage
          }
        })
      );
    }

    // Notification pour le prestataire
    if (booking.provider_id) {
      const { data: provider } = await supabase
        .from('providers')
        .select('user_id')
        .eq('id', booking.provider_id)
        .single();

      if (provider?.user_id) {
        notifications.push(
          supabase.from('provider_notifications').insert({
            provider_id: booking.provider_id,
            booking_id: bookingId,
            type: 'booking_cancelled',
            title: 'Réservation annulée',
            message: cancelledBy === 'provider'
              ? 'Vous avez annulé cette réservation'
              : `Le client a annulé la réservation. Raison: ${reason}`
          })
        );
      }
    }

    await Promise.all(notifications);

    // 5. Envoyer les emails de confirmation
    await supabase.functions.invoke('send-modern-notification', {
      body: {
        trigger: 'booking_cancelled',
        data: {
          bookingId,
          cancelledBy,
          reason,
          refundAmount,
          refundPercentage,
          clientId: booking.client_id,
          providerId: booking.provider_id
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        refundAmount,
        refundPercentage,
        refundProcessed: !!refundResult
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in handle-cancellation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
