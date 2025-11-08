import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

// Calculate refund based on cancellation policy
function calculateRefund(bookingDate: string, startTime: string, totalAmount: number) {
  const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
  const now = new Date();
  const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  let refundPercentage = 0;
  let refundReason = '';

  if (hoursUntilBooking > 24) {
    // Plus de 24h avant : Remboursement complet
    refundPercentage = 100;
    refundReason = 'Annulation plus de 24h avant - Remboursement complet';
  } else if (hoursUntilBooking >= 2 && hoursUntilBooking <= 24) {
    // Entre 2h et 24h : Remboursement partiel (70%)
    refundPercentage = 70;
    refundReason = 'Annulation entre 2h et 24h - Remboursement partiel (70%)';
  } else {
    // Moins de 2h : Compensation prestataire (30% au client)
    refundPercentage = 30;
    refundReason = 'Annulation moins de 2h avant - Compensation prestataire (30% au client)';
  }

  return {
    refundAmount: Math.round(totalAmount * refundPercentage / 100),
    refundPercentage,
    refundReason
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { bookingId, paymentIntentId, reason } = await req.json();

    console.log('Processing refund for booking:', { bookingId, paymentIntentId, reason });

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('booking_date, start_time, total_price')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Calculate refund amount based on policy
    const { refundAmount, refundPercentage, refundReason } = calculateRefund(
      booking.booking_date,
      booking.start_time,
      booking.total_price
    );

    console.log('Refund calculation:', { refundAmount, refundPercentage, refundReason });

    // Process Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        booking_id: bookingId,
        refund_percentage: refundPercentage.toString(),
        policy_reason: refundReason,
        user_reason: reason || ''
      }
    });

    console.log('Stripe refund created:', refund.id);

    // Update booking status
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: `${reason || 'Annulation'} - ${refundReason}`
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        refund,
        refundAmount,
        refundPercentage,
        refundReason
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing refund:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
