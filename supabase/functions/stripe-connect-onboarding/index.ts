import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { action } = await req.json();
    const origin = req.headers.get("origin") || "https://bikawo.lovable.app";

    // Get provider record
    const { data: provider, error: providerError } = await supabaseClient
      .from("providers")
      .select("id, stripe_account_id, stripe_onboarding_complete")
      .eq("user_id", user.id)
      .single();

    if (providerError || !provider) {
      throw new Error("Provider profile not found");
    }

    if (action === "create_account") {
      // Check if already has a Stripe Connect account
      if (provider.stripe_account_id) {
        // Generate new account link for existing account
        const accountLink = await stripe.accountLinks.create({
          account: provider.stripe_account_id,
          refresh_url: `${origin}/provider/dashboard?stripe=refresh`,
          return_url: `${origin}/provider/dashboard?stripe=success`,
          type: "account_onboarding",
        });

        return new Response(JSON.stringify({ url: accountLink.url }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create Express connected account
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: "individual",
        business_profile: {
          mcc: "7299", // Miscellaneous personal services
          url: "https://bikawo.lovable.app",
        },
      });

      console.log("Created Stripe Connect account:", account.id);

      // Save account ID to provider
      await supabaseClient
        .from("providers")
        .update({ stripe_account_id: account.id })
        .eq("id", provider.id);

      // Create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${origin}/provider/dashboard?stripe=refresh`,
        return_url: `${origin}/provider/dashboard?stripe=success`,
        type: "account_onboarding",
      });

      return new Response(JSON.stringify({ url: accountLink.url, accountId: account.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check_status") {
      if (!provider.stripe_account_id) {
        return new Response(JSON.stringify({ 
          connected: false, 
          onboarding_complete: false 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const account = await stripe.accounts.retrieve(provider.stripe_account_id);
      const isComplete = account.details_submitted && account.charges_enabled;

      // Update onboarding status if changed
      if (isComplete !== provider.stripe_onboarding_complete) {
        await supabaseClient
          .from("providers")
          .update({ stripe_onboarding_complete: isComplete })
          .eq("id", provider.id);
      }

      return new Response(JSON.stringify({
        connected: true,
        onboarding_complete: isComplete,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");

  } catch (error) {
    console.error("Stripe Connect error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
