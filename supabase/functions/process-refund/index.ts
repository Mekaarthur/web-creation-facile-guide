import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

// Validation schema
const refundSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment Intent ID required"),
  refundAmount: z.number().positive("Refund amount must be positive").max(1000000, "Amount too large"),
  reason: z.string().max(500, "Reason too long").optional()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validated = refundSchema.parse(body);
    const { paymentIntentId, refundAmount, reason } = validated;

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
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: "Validation error",
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
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
