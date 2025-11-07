import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRoleRequest {
  role: 'admin' | 'provider' | 'client' | 'moderator' | 'user';
  userId?: string; // Optionnel, par défaut utilise l'utilisateur connecté
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase avec le JWT du user
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
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          hasRole: false,
          message: 'Utilisateur non authentifié'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Parser la requête
    const body: VerifyRoleRequest = await req.json();
    const targetUserId = body.userId || user.id;
    const requestedRole = body.role;

    console.log(`[verify-user-role] Checking role ${requestedRole} for user ${targetUserId}`);

    // Vérifier le rôle via la fonction Supabase
    const { data: roleCheck, error: roleError } = await supabaseClient
      .rpc('has_role', {
        _user_id: targetUserId,
        _role: requestedRole,
      });

    if (roleError) {
      console.error('[verify-user-role] Error checking role:', roleError);
      return new Response(
        JSON.stringify({ 
          error: 'Database error',
          hasRole: false,
          message: roleError.message 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Récupérer tous les rôles de l'utilisateur
    const { data: allRolesData, error: allRolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId);

    const allRoles = allRolesData?.map(r => r.role) || [];

    console.log(`[verify-user-role] User ${targetUserId} has roles:`, allRoles);
    console.log(`[verify-user-role] Has role ${requestedRole}:`, roleCheck);

    return new Response(
      JSON.stringify({
        hasRole: !!roleCheck,
        allRoles,
        requestedRole,
        userId: targetUserId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[verify-user-role] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        hasRole: false,
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});