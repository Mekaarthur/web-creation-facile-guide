import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

interface RefundRequest {
  paymentIntentId: string;
  refundAmount: number; // En centimes
  reason?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentIntentId, refundAmount, reason }: RefundRequest = await req.json();

    console.log('Processing refund:', { paymentIntentId, refundAmount, reason });

    // Créer le remboursement Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmount,
      reason: 'requested_by_customer',
      metadata: {
        reason: reason || 'Cancellation'
      }
    });

    console.log('Refund created:', refund.id);

    return new Response(
      JSON.stringify({
        success: true,
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in process-refund:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.type || 'unknown_error'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
