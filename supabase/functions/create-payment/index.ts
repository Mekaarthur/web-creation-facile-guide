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
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { amount, bookingId, description, serviceName, metadata, guestEmail } = await req.json();
    logStep("Request data received", { amount, bookingId, description, serviceName, hasMetadata: !!metadata, hasGuestEmail: !!guestEmail });
    
    if (!amount || amount <= 0) {
      throw new Error("Valid amount is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    let user: any = null;
    if (authHeader) {
      try {
        logStep("Authorization header found");
        const token = authHeader.replace("Bearer ", "");
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
        if (token && token !== anonKey) {
          const { data, error: userError } = await supabaseClient.auth.getUser(token);
          if (!userError) {
            user = data.user;
            logStep("User authenticated", { userId: user?.id, email: user?.email });
          } else {
            logStep("Invalid session token (not logged in), proceeding as guest", { userError: userError.message });
          }
        } else {
          logStep("Authorization token is anon key or empty, proceeding as guest");
        }
      } catch (e) {
        logStep("Failed to resolve user from token, proceeding as guest", { error: String(e) });
      }
    } else {
      logStep("No authorization header provided, proceeding as guest");
    }

    // Determine email: user email if logged in, else guestEmail or metadata.clientInfo.email
    let resolvedEmail: string | undefined = user?.email || guestEmail;
    if (!resolvedEmail && metadata?.clientInfo) {
      try {
        const ci = typeof metadata.clientInfo === 'string' ? JSON.parse(metadata.clientInfo) : metadata.clientInfo;
        resolvedEmail = ci?.email;
      } catch (_) {
        // ignore JSON parse errors
      }
    }

    if (!resolvedEmail) {
      throw new Error("Email is required to create a payment session");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get or create Stripe customer only for authenticated users
    let customerId: string | undefined;
    if (user?.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
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
    } else {
      logStep("Guest checkout - using customer_email only");
    }

    // Create payment session
    const baseParams: any = {
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { 
              name: serviceName || "Service Bikawo",
              description: description || "Paiement pour service Bikawo"
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        booking_id: bookingId || "",
        user_id: user?.id || "guest",
        service_name: serviceName || "Service Bikawo",
        amount: amount.toString(),
        ...(metadata || {})
      },
      payment_intent_data: {
        metadata: {
          booking_id: bookingId || "",
          user_id: user?.id || "guest",
          service_name: serviceName || "Service Bikawo",
          ...(metadata || {})
        }
      }
    };

    if (customerId) baseParams.customer = customerId;
    else baseParams.customer_email = resolvedEmail;

    const session = await stripe.checkout.sessions.create(baseParams);


    logStep("Payment session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});