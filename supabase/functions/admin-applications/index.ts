import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApplicationRequest {
  action: 'list' | 'get' | 'update_status' | 'approve' | 'reject' | 'get_stats';
  applicationId?: string;
  status?: string;
  searchTerm?: string;
  limit?: number;
  newStatus?: string;
  adminComments?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérifier authentification admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Vérifier rôle admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    const body: ApplicationRequest = await req.json();
    console.log('Admin applications action:', body.action);

    // **ACTION: list** - Liste des candidatures avec filtres
    if (body.action === 'list') {
      let query = supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (body.status) {
        query = query.eq('status', body.status);
      }

      if (body.searchTerm) {
        query = query.or(`first_name.ilike.%${body.searchTerm}%,last_name.ilike.%${body.searchTerm}%,email.ilike.%${body.searchTerm}%`);
      }

      if (body.limit) {
        query = query.limit(body.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(JSON.stringify({ applications: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // **ACTION: get** - Détails d'une candidature
    if (body.action === 'get') {
      if (!body.applicationId) {
        throw new Error('applicationId required');
      }

      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('id', body.applicationId)
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ application: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // **ACTION: get_stats** - Statistiques candidatures
    if (body.action === 'get_stats') {
      const { data: applications } = await supabase
        .from('job_applications')
        .select('status');

      const stats = {
        total: applications?.length || 0,
        pending: applications?.filter(a => a.status === 'pending').length || 0,
        approved: applications?.filter(a => a.status === 'approved').length || 0,
        rejected: applications?.filter(a => a.status === 'rejected').length || 0,
        documents_pending: applications?.filter(a => a.status === 'documents_pending').length || 0,
      };

      return new Response(JSON.stringify({ stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // **ACTION: update_status** - Mettre à jour statut
    if (body.action === 'update_status') {
      if (!body.applicationId || !body.newStatus) {
        throw new Error('applicationId and newStatus required');
      }

      const updateData: any = {
        status: body.newStatus,
        updated_at: new Date().toISOString(),
      };

      if (body.adminComments) {
        updateData.admin_comments = body.adminComments;
      }

      const { error } = await supabase
        .from('job_applications')
        .update(updateData)
        .eq('id', body.applicationId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // **ACTION: approve** - Approuver candidature et créer prestataire
    if (body.action === 'approve') {
      if (!body.applicationId) {
        throw new Error('applicationId required');
      }

      // Récupérer la candidature
      const { data: application, error: fetchError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('id', body.applicationId)
        .single();

      if (fetchError) throw fetchError;

      // Vérifier si un compte existe déjà
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', application.email)
        .single();

      let userId = existingProfile?.user_id;

      // Si pas de compte, créer un profil temporaire
      if (!userId) {
        // Générer un UUID temporaire
        const tempUserId = crypto.randomUUID();
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: tempUserId,
            first_name: application.first_name,
            last_name: application.last_name,
            email: application.email,
            phone_number: application.phone,
          });

        if (profileError) throw profileError;
        userId = tempUserId;
      }

      // Créer le prestataire avec statut pending_onboarding
      const { data: provider, error: providerError } = await supabase
        .from('providers')
        .insert({
          user_id: userId,
          business_name: `${application.first_name} ${application.last_name}`,
          description: application.motivation || '',
          location: application.city || 'À définir',
          status: 'pending_onboarding',
          is_verified: false,
          mandat_facturation_accepte: false,
          formation_completed: false,
          identity_verified: false,
          documents_submitted: application.documents_complete || false,
        })
        .select()
        .single();

      if (providerError) throw providerError;

      // Assigner rôle provider
      await supabase.rpc('add_user_role', {
        target_user_id: userId,
        new_role: 'provider',
      });

      // Mettre à jour la candidature
      await supabase
        .from('job_applications')
        .update({
          status: 'approved',
          admin_comments: body.adminComments || 'Candidature approuvée - Compte prestataire créé',
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.applicationId);

      // Logger l'action
      await supabase
        .from('admin_actions_log')
        .insert({
          admin_user_id: user.id,
          entity_type: 'job_application',
          entity_id: body.applicationId,
          action_type: 'approved_and_converted',
          new_data: {
            status: 'approved',
            provider_id: provider.id,
            user_id: userId,
          },
          description: `Candidature approuvée et prestataire créé: ${application.first_name} ${application.last_name}`,
        });

      console.log('Application approved, provider created:', provider.id);

      return new Response(JSON.stringify({ 
        success: true, 
        providerId: provider.id,
        userId: userId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // **ACTION: reject** - Rejeter candidature
    if (body.action === 'reject') {
      if (!body.applicationId) {
        throw new Error('applicationId required');
      }

      const { error } = await supabase
        .from('job_applications')
        .update({
          status: 'rejected',
          admin_comments: body.adminComments || 'Candidature rejetée',
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.applicationId);

      if (error) throw error;

      // Logger l'action
      await supabase
        .from('admin_actions_log')
        .insert({
          admin_user_id: user.id,
          entity_type: 'job_application',
          entity_id: body.applicationId,
          action_type: 'rejected',
          new_data: { status: 'rejected' },
          description: body.adminComments || 'Candidature rejetée',
        });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in admin-applications:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
