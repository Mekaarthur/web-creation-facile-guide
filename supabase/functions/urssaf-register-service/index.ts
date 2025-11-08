import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[URSSAF-REGISTER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { 
      clientInfo, 
      services, 
      totalAmount, 
      clientAmount, 
      stateAmount,
      preferredDate,
      preferredTime 
    } = await req.json();
    
    logStep("Request data received", { 
      clientEmail: clientInfo?.email, 
      totalAmount, 
      clientAmount, 
      stateAmount,
      servicesCount: services?.length 
    });

    // Validate required data
    if (!clientInfo?.email || !services || !totalAmount) {
      throw new Error("Missing required information for URSSAF registration");
    }

    // Get URSSAF API credentials from environment
    const urssafApiUrl = Deno.env.get("URSSAF_API_URL");
    const urssafClientId = Deno.env.get("URSSAF_CLIENT_ID");
    const urssafClientSecret = Deno.env.get("URSSAF_CLIENT_SECRET");
    const urssafSiret = Deno.env.get("URSSAF_SIRET");

    if (!urssafApiUrl || !urssafClientId || !urssafClientSecret || !urssafSiret) {
      logStep("URSSAF credentials not configured - simulation mode");
      
      // Simulation mode: Return success without actual API call
      return new Response(JSON.stringify({ 
        success: true,
        simulation: true,
        message: "URSSAF registration simulated (credentials not configured)",
        registrationId: `SIM-${Date.now()}`,
        clientAmount,
        stateAmount
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("URSSAF credentials found, proceeding with registration");

    // Step 1: Get OAuth token from URSSAF
    logStep("Requesting OAuth token from URSSAF");
    const tokenResponse = await fetch(`${urssafApiUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: urssafClientId,
        client_secret: urssafClientSecret,
        scope: "api_tiers_prestation"
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`URSSAF OAuth error: ${tokenResponse.statusText}`);
    }

    const { access_token } = await tokenResponse.json();
    logStep("OAuth token obtained");

    // Step 2: Register the service with URSSAF
    const urssafPayload = {
      siret: urssafSiret,
      client: {
        nom: clientInfo.lastName,
        prenom: clientInfo.firstName,
        email: clientInfo.email,
        telephone: clientInfo.phone,
        adresse: clientInfo.address
      },
      prestations: services.map((service: any) => ({
        designation: service.serviceName,
        montant: service.price * service.quantity,
        date_prestation: service.customBooking?.date || preferredDate,
        heure_debut: service.customBooking?.startTime || preferredTime,
        heure_fin: service.customBooking?.endTime,
        duree_heures: service.customBooking?.hours || service.quantity
      })),
      montant_total: totalAmount,
      montant_client: clientAmount,
      montant_etat: stateAmount,
      avance_immediate: true
    };

    logStep("Registering service with URSSAF", { siret: urssafSiret });

    const registrationResponse = await fetch(`${urssafApiUrl}/api/v1/tiers-prestation/declaration`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(urssafPayload)
    });

    if (!registrationResponse.ok) {
      const errorText = await registrationResponse.text();
      logStep("URSSAF registration failed", { status: registrationResponse.status, error: errorText });
      throw new Error(`URSSAF registration failed: ${errorText}`);
    }

    const registrationData = await registrationResponse.json();
    logStep("URSSAF registration successful", { registrationId: registrationData.id });

    // Store the registration in Supabase for tracking
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: dbError } = await supabaseClient
      .from("urssaf_registrations")
      .insert({
        registration_id: registrationData.id,
        client_email: clientInfo.email,
        client_name: `${clientInfo.firstName} ${clientInfo.lastName}`,
        total_amount: totalAmount,
        client_amount: clientAmount,
        state_amount: stateAmount,
        services: services,
        status: "registered",
        registration_date: new Date().toISOString()
      });

    if (dbError) {
      logStep("Warning: Failed to store registration in database", { error: dbError.message });
      // Don't fail the entire request if DB storage fails
    }

    return new Response(JSON.stringify({ 
      success: true,
      registrationId: registrationData.id,
      clientAmount,
      stateAmount,
      urssafReference: registrationData.reference
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in urssaf-register-service", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
