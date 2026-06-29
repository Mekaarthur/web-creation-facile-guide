import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getAdminCorsHeaders } from '../_shared/cors.ts';

type SupabaseClient = ReturnType<typeof createClient>;

// Validation schema
const userActionSchema = z.object({
  action: z.enum(['list', 'examine', 'activate', 'suspend'], {
    errorMap: () => ({ message: "Invalid action" })
  }),
  userId: z.string().uuid().optional()
}).refine(
  (data: { action: string; userId?: string }) => {
    if (data.action !== 'list' && !data.userId) {
      return false;
    }
    return true;
  },
  { message: "userId required for this action" }
);

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getAdminCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();

    // Validate input
    const validated = userActionSchema.parse(body);
    const { action, userId } = validated;

    // Vérifier que l'utilisateur est admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Non autorisé');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Non autorisé');
    }

    // Vérifier le rôle admin
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some((role: { role: string }) => role.role === 'admin');
    if (!isAdmin) {
      throw new Error('Permissions insuffisantes');
    }

    let result;

    switch (action) {
      case 'list':
        result = await listUsers(supabaseAdmin);
        break;

      case 'examine':
        if (!userId) throw new Error('userId requis pour examine');
        result = await examineUser(supabaseAdmin, userId);
        break;

      case 'activate':
        if (!userId) throw new Error('userId requis pour activate');
        result = await activateUser(supabaseAdmin, userId);
        break;

      case 'suspend':
        if (!userId) throw new Error('userId requis pour suspend');
        result = await suspendUser(supabaseAdmin, userId);
        break;

      default:
        throw new Error('Action non supportée');
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Erreur dans admin-users-management:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: error.errors.map((e: { path: string[]; message: string }) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

async function listUsers(supabaseAdmin: SupabaseClient) {
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

  if (authError) {
    throw new Error(`Erreur auth: ${authError.message}`);
  }

  const userIds = authUsers.users.map((u: { id: string }) => u.id);
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .in('user_id', userIds);

  if (profilesError) {
    throw new Error(`Erreur profiles: ${profilesError.message}`);
  }

  const users = authUsers.users.map((authUser: { id: string; email?: string; created_at: string; banned_until?: string | null; email_confirmed_at?: string | null }) => {
    const profile = profiles?.find((p: { user_id: string }) => p.user_id === authUser.id);
    return {
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at,
      banned_until: authUser.banned_until,
      email_confirmed_at: authUser.email_confirmed_at,
      profiles: profile ? {
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url
      } : null
    };
  });

  return { users };
}

async function examineUser(supabaseAdmin: SupabaseClient, userId: string) {
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (authError) {
    throw new Error(`Erreur auth: ${authError.message}`);
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      status,
      booking_date,
      total_price,
      services (name)
    `)
    .eq('client_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    user: {
      id: authUser.user.id,
      email: authUser.user.email,
      created_at: authUser.user.created_at,
      banned_until: authUser.user.banned_until,
      email_confirmed_at: authUser.user.email_confirmed_at,
      profiles: profile,
      bookings: bookings || []
    }
  };
}

async function activateUser(supabaseAdmin: SupabaseClient, userId: string) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: 'none'
  });

  if (error) {
    throw new Error(`Erreur activation: ${error.message}`);
  }

  await supabaseAdmin
    .from('admin_actions_log')
    .insert({
      entity_type: 'user',
      entity_id: userId,
      action_type: 'activate',
      description: 'Utilisateur réactivé'
    });

  return { success: true, message: 'Utilisateur activé avec succès' };
}

async function suspendUser(supabaseAdmin: SupabaseClient, userId: string) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: '876000h' // 100 ans
  });

  if (error) {
    throw new Error(`Erreur suspension: ${error.message}`);
  }

  await supabaseAdmin
    .from('admin_actions_log')
    .insert({
      entity_type: 'user',
      entity_id: userId,
      action_type: 'suspend',
      description: 'Utilisateur suspendu'
    });

  return { success: true, message: 'Utilisateur suspendu avec succès' };
}

serve(handler);
