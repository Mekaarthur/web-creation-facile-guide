import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { planId, serviceTitle } = await req.json();
    logStep("Request data received", { planId, serviceTitle });

    if (!planId) {
      throw new Error("Plan ID is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    // Get or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    // Define subscription plans
    const subscriptionPlans = {
      monthly: {
        price: 80000, // 800€ in cents
        interval: "month",
        title: "Formule Mensuelle - 40h"
      },
      yearly: {
        price: 70000, // 700€ in cents  
        interval: "month",
        interval_count: 1,
        title: "Formule Annuelle - 40h"
      },
      premium: {
        price: 140000, // 1400€ in cents
        interval: "month", 
        title: "Bika Plus Premium"
      }
    };

    const selectedPlan = subscriptionPlans[planId as keyof typeof subscriptionPlans];
    if (!selectedPlan) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    logStep("Plan selected", selectedPlan);

    // Create Stripe product and price
    const product = await stripe.products.create({
      name: `${selectedPlan.title} - ${serviceTitle || 'Bikawo Services'}`,
      description: `Abonnement ${selectedPlan.title} pour les services Bikawo`,
      metadata: {
        plan_id: planId,
        service_title: serviceTitle || 'Services Bikawo'
      }
    });

    const price = await stripe.prices.create({
      unit_amount: selectedPlan.price,
      currency: "eur",
      recurring: {
        interval: selectedPlan.interval as "month" | "year",
        interval_count: selectedPlan.interval_count || 1
      },
      product: product.id,
      metadata: {
        plan_id: planId,
        service_title: serviceTitle || 'Services Bikawo'
      }
    });

    logStep("Product and price created", { productId: product.id, priceId: price.id });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/espace-personnel?tab=abonnements&subscription=success`,
      cancel_url: `${req.headers.get("origin")}/services?subscription=cancel`,
      metadata: {
        plan_id: planId,
        service_title: serviceTitle || 'Services Bikawo',
        user_id: user.id
      },
      subscription_data: {
        metadata: {
          plan_id: planId,
          service_title: serviceTitle || 'Services Bikawo',
          user_id: user.id
        }
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});