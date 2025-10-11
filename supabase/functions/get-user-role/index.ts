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
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Fetching role for user:', user.id);

    // Récupérer le rôle de l'utilisateur depuis user_roles
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      console.error('Role fetch error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la récupération du rôle' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Vérifier si l'utilisateur est un prestataire
    const { data: providerData, error: providerError } = await supabaseClient
      .from('providers')
      .select('id, is_verified, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (providerError) {
      console.error('Provider fetch error:', providerError);
    }

    const role = roleData?.role || 'user';
    const isProvider = !!providerData;
    const isVerifiedProvider = providerData?.is_verified || false;

    console.log('User role:', role, 'isProvider:', isProvider, 'isVerified:', isVerifiedProvider);

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
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
