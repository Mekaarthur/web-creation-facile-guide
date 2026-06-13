import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId est requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check if a provider record already exists for this user
    const { data: existing } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, provider_id: existing.id, created: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Fetch profile to pre-fill business_name
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", userId)
      .maybeSingle();

    const businessName = profile
      ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
      : "À compléter";

    const { data: provider, error } = await supabase
      .from("providers")
      .insert({
        user_id: userId,
        business_name: businessName || "À compléter",
        description: "",
        location: "À définir",
        status: "pending",
        is_verified: false,
        mandat_facturation_accepte: false,
        formation_completed: false,
        identity_verified: false,
        documents_submitted: false,
      })
      .select("id")
      .single();

    if (error) throw error;

    // Assign 'provider' role
    await supabase.from("user_roles").upsert(
      { user_id: userId, role: "provider" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );

    return new Response(
      JSON.stringify({ success: true, provider_id: provider.id, created: true }),
      { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("create-provider-profile error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
