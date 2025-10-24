import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('[get-user-role] ⛔ Auth error - Unauthorized access attempt');
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[get-user-role] Fetching role for user: ${user.id} (${user.email})`);

    // Récupérer le rôle via la fonction SECURITY DEFINER (plus sécurisé)
    const { data: roleData, error: roleError } = await supabaseClient
      .rpc('get_current_user_role');

    if (roleError) {
      console.error('[get-user-role] Role fetch error:', roleError);
      // Continue même si erreur - l'utilisateur n'a peut-être pas encore de rôle
    }

    // Vérifier si l'utilisateur est un prestataire vérifié
    const { data: providerData, error: providerError } = await supabaseClient
      .from('providers')
      .select('id, is_verified, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (providerError && providerError.code !== 'PGRST116') {
      console.error('[get-user-role] Provider fetch error:', providerError);
    }

    const role = roleData || 'user';
    const isProvider = !!(providerData && providerData.is_verified);
    const isVerifiedProvider = providerData?.is_verified || false;

    // Logging d'audit pour traçabilité
    if (role === 'admin') {
      console.log(`[get-user-role] ✅ ADMIN ACCESS - User: ${user.id}, Email: ${user.email}`);
    } else if (isProvider) {
      console.log(`[get-user-role] 👷 PROVIDER ACCESS - User: ${user.id}, Email: ${user.email}, Status: ${providerData?.status}`);
    } else {
      console.log(`[get-user-role] 👤 USER ACCESS - User: ${user.id}, Role: ${role}`);
    }

    return new Response(
      JSON.stringify({ 
        role,
        isProvider,
        isVerifiedProvider,
        providerId: providerData?.id,
        providerStatus: providerData?.status
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[get-user-role] ❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur interne' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
