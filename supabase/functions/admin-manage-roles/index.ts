import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManageRoleRequest {
  action: 'promote' | 'revoke' | 'list';
  targetUserId?: string;
  targetEmail?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[admin-manage-roles] ⛔ Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[admin-manage-roles] ⛔ Invalid token');
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin using the has_role function
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !isAdmin) {
      console.error(`[admin-manage-roles] ⛔ Access denied for user: ${user.id} (${user.email})`);
      return new Response(
        JSON.stringify({ error: 'Accès refusé - Droits administrateur requis' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ManageRoleRequest = await req.json();
    const { action, targetUserId, targetEmail } = body;

    console.log(`[admin-manage-roles] ✅ Admin ${user.email} - Action: ${action}`);

    // LIST ACTION - Get all admins
    if (action === 'list') {
      const { data: admins, error: listError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          created_at,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (listError) {
        console.error('[admin-manage-roles] ❌ Error listing admins:', listError);
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la récupération des admins' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[admin-manage-roles] 📋 Listed ${admins?.length || 0} admins`);
      return new Response(
        JSON.stringify({ admins }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PROMOTE or REVOKE - Need target user
    let targetUser: string = targetUserId || '';

    // If email provided, find user ID
    if (targetEmail && !targetUserId) {
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', targetEmail)
        .single();

      if (userError || !users) {
        console.error('[admin-manage-roles] ❌ User not found:', targetEmail);
        return new Response(
          JSON.stringify({ error: 'Utilisateur non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetUser = users.user_id;
    }

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: 'ID ou email utilisateur requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Protection: Cannot modify own role
    if (targetUser === user.id) {
      console.error(`[admin-manage-roles] ⛔ Self-modification attempt by ${user.email}`);
      return new Response(
        JSON.stringify({ error: 'Vous ne pouvez pas modifier votre propre rôle' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PROMOTE ACTION
    if (action === 'promote') {
      // Check if already admin
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', targetUser)
        .eq('role', 'admin')
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Cet utilisateur est déjà administrateur' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Promote to admin
      const { error: promoteError } = await supabase
        .from('user_roles')
        .insert({
          user_id: targetUser,
          role: 'admin'
        });

      if (promoteError) {
        console.error('[admin-manage-roles] ❌ Error promoting user:', promoteError);
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la promotion' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get target user info for logging
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('user_id', targetUser)
        .single();

      // Log the action in admin_actions_log
      await supabase
        .from('admin_actions_log')
        .insert({
          admin_user_id: user.id,
          entity_type: 'user_roles',
          entity_id: targetUser,
          action_type: 'promote_admin',
          old_data: { role: 'user' },
          new_data: { role: 'admin', email: targetProfile?.email },
          description: `Promoted ${targetProfile?.email} to admin role`,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent')
        });

      console.log(`[admin-manage-roles] 🎖️ PROMOTED - ${targetProfile?.email} to ADMIN by ${user.email}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${targetProfile?.email} a été promu administrateur`,
          targetUser: targetProfile
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // REVOKE ACTION
    if (action === 'revoke') {
      // Count remaining admins
      const { count: adminCount } = await supabase
        .from('user_roles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (adminCount && adminCount <= 1) {
        console.error('[admin-manage-roles] ⛔ Cannot revoke last admin');
        return new Response(
          JSON.stringify({ error: 'Impossible de révoquer le dernier administrateur' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Revoke admin role
      const { error: revokeError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', targetUser)
        .eq('role', 'admin');

      if (revokeError) {
        console.error('[admin-manage-roles] ❌ Error revoking admin:', revokeError);
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la révocation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get target user info for logging
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('user_id', targetUser)
        .single();

      // Log the action in admin_actions_log
      await supabase
        .from('admin_actions_log')
        .insert({
          admin_user_id: user.id,
          entity_type: 'user_roles',
          entity_id: targetUser,
          action_type: 'revoke_admin',
          old_data: { role: 'admin', email: targetProfile?.email },
          new_data: { role: 'user' },
          description: `Revoked admin role from ${targetProfile?.email}`,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent')
        });

      console.log(`[admin-manage-roles] ⬇️ REVOKED - ${targetProfile?.email} admin rights by ${user.email}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Les droits administrateur de ${targetProfile?.email} ont été révoqués`,
          targetUser: targetProfile
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Action non reconnue' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[admin-manage-roles] ❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
