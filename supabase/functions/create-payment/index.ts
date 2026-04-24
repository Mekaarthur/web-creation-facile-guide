import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  PRICING,
  calculateMissionSplit,
  calculateWithAvanceImmediate,
  type ServiceType,
} from "../_shared/pricing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const {
      amount,
      bookingId,
      description,
      serviceName,
      metadata,
      guestEmail,
      // Nouveaux paramètres pour le calcul du split
      serviceType,
      hours,
      avanceImmediateActive = false,
    } = await req.json();

    if (!amount || amount <= 0) {
      throw new Error("Valid amount is required");
    }

    // Calcul du split si serviceType + hours fournis
    let splitData: Record<string, string> = {};
    if (serviceType && hours && serviceType in PRICING) {
      const split = avanceImmediateActive
        ? calculateWithAvanceImmediate(serviceType as ServiceType, hours)
        : calculateMissionSplit(serviceType as ServiceType, hours);

      splitData = {
        service_type:      serviceType,
        hours:             String(hours),
        total_amount:      String(split.totalAmount),
        provider_amount:   String(split.providerAmount),
        stripe_commission: String(split.stripeComm),
        bikawo_net:        String(split.bikawoNet),
        avance_immediate:  String(avanceImmediateActive),
        urssaf_amount:     avanceImmediateActive
          ? String((split as any).urssafPays ?? 0)
          : "0",
      };

      logStep("Split calculé", splitData);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Résolution de l'utilisateur (authentifié ou guest)
    const authHeader = req.headers.get("Authorization");
    let user: any = null;
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
        if (token && token !== anonKey) {
          const { data, error: userError } = await supabaseClient.auth.getUser(token);
          if (!userError) {
            user = data.user;
            logStep("User authenticated", { userId: user?.id, email: user?.email });
          } else {
            logStep("Invalid session token, proceeding as guest");
          }
        }
      } catch (e) {
        logStep("Failed to resolve user, proceeding as guest", { error: String(e) });
      }
    }

    // Email : utilisateur connecté > guestEmail > clientInfo dans metadata
    let resolvedEmail: string | undefined = user?.email || guestEmail;
    if (!resolvedEmail && metadata?.clientInfo) {
      try {
        const ci =
          typeof metadata.clientInfo === "string"
            ? JSON.parse(metadata.clientInfo)
            : metadata.clientInfo;
        resolvedEmail = ci?.email;
      } catch (_) {}
    }
    if (!resolvedEmail) {
      throw new Error("Email is required to create a payment session");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Client Stripe (uniquement pour les utilisateurs authentifiés)
    let customerId: string | undefined;
    if (user?.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing customer", { customerId });
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: user.id },
        });
        customerId = customer.id;
        logStep("Created new customer", { customerId });
      }
    }

    // Montant facturé au client
    // Si avance immédiate : le client paie seulement 50 % via Stripe
    const chargedAmount = avanceImmediateActive && splitData.urssaf_amount
      ? Math.round(amount * 100 / 2)   // 50 % en centimes
      : Math.round(amount * 100);       // 100 % en centimes

    const sessionMetadata: Record<string, string> = {
      booking_id:   bookingId  || "",
      user_id:      user?.id   || "guest",
      service_name: serviceName || "Service Bikawo",
      amount:       String(amount),
      ...splitData,
      ...(metadata || {}),
    };

    const baseParams: any = {
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name:        serviceName  || "Service Bikawo",
              description: description || "Paiement pour service Bikawo",
            },
            unit_amount: chargedAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${req.headers.get("origin")}/payment-canceled`,
      metadata: sessionMetadata,
      payment_intent_data: { metadata: sessionMetadata },
    };

    if (customerId) baseParams.customer        = customerId;
    else            baseParams.customer_email  = resolvedEmail;

    const session = await stripe.checkout.sessions.create(baseParams);
    logStep("Payment session created", { sessionId: session.id, chargedAmount });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
