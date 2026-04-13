import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  diagnostics?: {
    error_stage: string;
    processing_time_ms: number;
  };
}

interface StripeStatusResponse {
  connected: boolean;
  onboarding_complete: boolean;
  details_submitted?: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
}

interface StripeOnboardingResponse {
  url: string;
  accountId?: string;
}

function respond<T>(ok: boolean, payload: Omit<ApiResponse<T>, "ok">): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: jsonHeaders,
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Erreur Stripe Connect";
}

function getErrorType(error: unknown): string {
  if (typeof error === "object" && error !== null && "type" in error) {
    return String((error as { type?: unknown }).type ?? "");
  }

  return "";
}

serve(async (req) => {
  const startTime = Date.now();

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return respond(false, {
        error: "Utilisateur non authentifié",
        diagnostics: {
          error_stage: "missing_authorization",
          processing_time_ms: Date.now() - startTime,
        },
      });
    }

    const stripeSecretKey = (Deno.env.get("STRIPE_SECRET_KEY") ?? "").trim();

    if (!stripeSecretKey) {
      return respond(false, {
        error: "Configuration Stripe manquante",
        diagnostics: {
          error_stage: "missing_stripe_secret",
          processing_time_ms: Date.now() - startTime,
        },
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return respond(false, {
        error: "Utilisateur non authentifié",
        diagnostics: {
          error_stage: "invalid_user",
          processing_time_ms: Date.now() - startTime,
        },
      });
    }

    const body = await req.json().catch(() => null);
    const action = body?.action;

    if (action !== "create_account" && action !== "check_status") {
      return respond(false, {
        error: "Action invalide",
        diagnostics: {
          error_stage: "invalid_action",
          processing_time_ms: Date.now() - startTime,
        },
      });
    }

    const origin = req.headers.get("origin") || "https://bikawo.lovable.app";

    const { data: provider, error: providerError } = await supabaseClient
      .from("providers")
      .select("id, stripe_account_id, stripe_onboarding_complete")
      .eq("user_id", user.id)
      .maybeSingle();

    if (providerError || !provider) {
      return respond(false, {
        error: "Profil prestataire introuvable",
        diagnostics: {
          error_stage: "provider_not_found",
          processing_time_ms: Date.now() - startTime,
        },
      });
    }

    if (action === "create_account") {
      if (provider.stripe_account_id) {
        const accountLink = await stripe.accountLinks.create({
          account: provider.stripe_account_id,
          refresh_url: `${origin}/provider/dashboard?stripe=refresh`,
          return_url: `${origin}/provider/dashboard?stripe=success`,
          type: "account_onboarding",
        });

        return respond<StripeOnboardingResponse>(true, {
          data: { url: accountLink.url },
          diagnostics: {
            error_stage: "existing_account_link_created",
            processing_time_ms: Date.now() - startTime,
          },
        });
      }

      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: "individual",
        business_profile: {
          mcc: "7299",
          url: "https://bikawo.lovable.app",
        },
      });

      console.log("Created Stripe Connect account:", account.id);

      await supabaseClient
        .from("providers")
        .update({ stripe_account_id: account.id })
        .eq("id", provider.id);

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${origin}/provider/dashboard?stripe=refresh`,
        return_url: `${origin}/provider/dashboard?stripe=success`,
        type: "account_onboarding",
      });

      return respond<StripeOnboardingResponse>(true, {
        data: {
          url: accountLink.url,
          accountId: account.id,
        },
        diagnostics: {
          error_stage: "new_account_created",
          processing_time_ms: Date.now() - startTime,
        },
      });
    }

    if (!provider.stripe_account_id) {
      return respond<StripeStatusResponse>(true, {
        data: {
          connected: false,
          onboarding_complete: false,
        },
        diagnostics: {
          error_stage: "no_connected_account",
          processing_time_ms: Date.now() - startTime,
        },
      });
    }

    const account = await stripe.accounts.retrieve(provider.stripe_account_id);
    const isComplete = Boolean(account.details_submitted && account.charges_enabled);

    if (isComplete !== provider.stripe_onboarding_complete) {
      await supabaseClient
        .from("providers")
        .update({ stripe_onboarding_complete: isComplete })
        .eq("id", provider.id);
    }

    return respond<StripeStatusResponse>(true, {
      data: {
        connected: true,
        onboarding_complete: isComplete,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      },
      diagnostics: {
        error_stage: "status_checked",
        processing_time_ms: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error("Stripe Connect error:", error);

    const errorMessage = getErrorMessage(error);
    const errorType = getErrorType(error);
    const isStripeAuthError =
      errorType === "StripeAuthenticationError" || /Invalid API Key/i.test(errorMessage);

    return respond(false, {
      error: isStripeAuthError
        ? "La clé Stripe configurée est invalide ou expirée. Vérifiez STRIPE_SECRET_KEY avec la Secret key Stripe (sk_test_... ou sk_live_...)."
        : errorMessage,
      diagnostics: {
        error_stage: isStripeAuthError ? "stripe_authentication_error" : "unhandled_error",
        processing_time_ms: Date.now() - startTime,
      },
    });
  }
});