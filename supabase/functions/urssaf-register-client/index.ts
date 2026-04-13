import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[URSSAF-REGISTER-CLIENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { numeroFiscal, iban, dateNaissance } = await req.json();

    logStep("Request data received", { hasNumeroFiscal: !!numeroFiscal, hasIban: !!iban, hasDateNaissance: !!dateNaissance });

    // Validate required fields
    if (!numeroFiscal || !iban || !dateNaissance) {
      return new Response(JSON.stringify({
        success: false,
        error: "Tous les champs sont requis (numéro fiscal, IBAN, date de naissance)",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Validate numero fiscal format
    if (!/^\d{13}$/.test(numeroFiscal)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Le numéro fiscal doit contenir exactement 13 chiffres",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Validate IBAN format
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Format IBAN invalide",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get URSSAF API credentials
    const urssafApiUrl = Deno.env.get("URSSAF_API_URL");
    const urssafClientId = Deno.env.get("URSSAF_CLIENT_ID");
    const urssafClientSecret = Deno.env.get("URSSAF_CLIENT_SECRET");

    if (!urssafApiUrl || !urssafClientId || !urssafClientSecret) {
      logStep("URSSAF credentials not configured - returning simulation mode 503");

      return new Response(JSON.stringify({
        success: false,
        simulation: true,
        error: "Le service d'activation automatique de l'avance immédiate n'est pas encore disponible. Vos informations ont été enregistrées. Veuillez finaliser l'activation sur particulier.urssaf.fr.",
        message: "URSSAF API credentials not configured. Registration blocked.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 503,
      });
    }

    logStep("URSSAF credentials found, proceeding with client registration");

    // Step 1: Get OAuth token
    logStep("Requesting OAuth token from URSSAF");
    const tokenResponse = await fetch(`${urssafApiUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: urssafClientId,
        client_secret: urssafClientSecret,
        scope: "api_tiers_prestation",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`URSSAF OAuth error: ${tokenResponse.statusText}`);
    }

    const { access_token } = await tokenResponse.json();
    logStep("OAuth token obtained");

    // Step 2: Register the client with URSSAF
    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user info
    let userId = null;
    if (authHeader) {
      const { data: { user } } = await supabaseClient.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      userId = user?.id;
    }

    const registrationPayload = {
      numero_fiscal: numeroFiscal,
      iban: iban,
      date_naissance: dateNaissance,
    };

    logStep("Registering client with URSSAF");

    const registrationResponse = await fetch(`${urssafApiUrl}/api/v1/tiers-prestation/particulier`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrationPayload),
    });

    if (!registrationResponse.ok) {
      const errorText = await registrationResponse.text();
      logStep("URSSAF client registration failed", { status: registrationResponse.status, error: errorText });
      throw new Error(`URSSAF registration failed: ${errorText}`);
    }

    const registrationData = await registrationResponse.json();
    logStep("URSSAF client registration successful", { particulierId: registrationData.id });

    // Update profile with URSSAF data
    if (userId) {
      await supabaseClient
        .from("profiles")
        .update({
          urssaf_particulier_id: registrationData.id,
          avance_immediate_active: true,
          avance_immediate_pending: false,
          avance_immediate_activated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }

    return new Response(JSON.stringify({
      success: true,
      particulierId: registrationData.id,
      message: "Avance immédiate activée avec succès",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in urssaf-register-client", { message: errorMessage });
    return new Response(JSON.stringify({
      error: errorMessage,
      success: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
