import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const logAdminAction = async (adminUserId: string, actionType: string, entityType: string, entityId: string, oldData?: any, newData?: any, description?: string) => {
  await supabaseClient.from("admin_actions_log").insert({
    admin_user_id: adminUserId,
    action_type: actionType,
    entity_type: entityType,
    entity_id: entityId,
    old_data: oldData,
    new_data: newData,
    description: description
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization header required");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Vérifier les permissions admin
    const { data: hasAdminRole } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      throw new Error("Access denied: Admin role required");
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === "GET") {
      // Lister toutes les communications avec filtres
      const type = url.searchParams.get('type');
      const status = url.searchParams.get('status');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let query = supabaseClient
        .from('communications')
        .select(`
          *,
          profiles!communications_destinataire_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) query = query.eq('type', type);
      if (status) query = query.eq('status', status);

      const { data: communications, error } = await query;
      if (error) throw error;

      // Compter le total
      let countQuery = supabaseClient
        .from('communications')
        .select('*', { count: 'exact', head: true });

      if (type) countQuery = countQuery.eq('type', type);
      if (status) countQuery = countQuery.eq('status', status);

      const { count } = await countQuery;

      // Calculer les statistiques
      const { data: stats } = await supabaseClient
        .from('communications')
        .select('type, status');

      const statistics = {
        total: stats?.length || 0,
        by_type: {
          email: stats?.filter(c => c.type === 'email').length || 0,
          sms: stats?.filter(c => c.type === 'sms').length || 0,
          notification_push: stats?.filter(c => c.type === 'notification_push').length || 0,
          notification_interne: stats?.filter(c => c.type === 'notification_interne').length || 0,
        },
        by_status: {
          en_attente: stats?.filter(c => c.status === 'en_attente').length || 0,
          envoyé: stats?.filter(c => c.status === 'envoyé').length || 0,
          échoué: stats?.filter(c => c.status === 'échoué').length || 0,
          lu: stats?.filter(c => c.status === 'lu').length || 0,
        }
      };

      return new Response(JSON.stringify({ 
        communications, 
        statistics,
        pagination: { 
          page, 
          limit, 
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (req.method === "POST") {
      const body = await req.json();

      if (action === "send") {
        // Envoyer une nouvelle communication
        const { type, destinataire_email, destinataire_id, sujet, contenu, template_name } = body;

        if (!type || !contenu) {
          throw new Error("Type and content are required");
        }

        // Créer l'entrée dans la base
        const { data: communication, error: createError } = await supabaseClient
          .from('communications')
          .insert({
            type,
            template_name,
            destinataire_id,
            destinataire_email,
            sujet,
            contenu,
            status: 'en_attente'
          })
          .select()
          .single();

        if (createError) throw createError;

        let sendResult = null;

        // Envoyer selon le type
        if (type === 'email' && destinataire_email) {
          try {
            const emailResponse = await resend.emails.send({
              from: "System <noreply@votre-domaine.com>",
              to: [destinataire_email],
              subject: sujet || "Notification",
              html: contenu,
            });

            sendResult = emailResponse;

            // Mettre à jour le statut
            await supabaseClient
              .from('communications')
              .update({ 
                status: 'envoyé', 
                sent_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', communication.id);

          } catch (emailError) {
            // Marquer comme échoué
            await supabaseClient
              .from('communications')
              .update({ 
                status: 'échoué', 
                error_message: emailError.message,
                updated_at: new Date().toISOString()
              })
              .eq('id', communication.id);

            throw emailError;
          }
        }

        // Logger l'action admin
        await logAdminAction(
          user.id,
          'send_communication',
          'communication',
          communication.id,
          null,
          { type, destinataire_email, sujet },
          `Communication ${type} envoyée`
        );

        return new Response(JSON.stringify({ 
          communication,
          send_result: sendResult
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (action === "retry") {
        // Relancer une communication échouée
        const { communicationId } = body;
        if (!communicationId) throw new Error("Communication ID required");

        const { data: communication, error: fetchError } = await supabaseClient
          .from('communications')
          .select('*')
          .eq('id', communicationId)
          .single();

        if (fetchError) throw fetchError;

        if (communication.status !== 'échoué') {
          throw new Error("Only failed communications can be retried");
        }

        // Réinitialiser et relancer
        await supabaseClient
          .from('communications')
          .update({ 
            status: 'en_attente',
            retry_count: (communication.retry_count || 0) + 1,
            error_message: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', communicationId);

        // Tenter de renvoyer
        let sendResult = null;
        if (communication.type === 'email' && communication.destinataire_email) {
          try {
            const emailResponse = await resend.emails.send({
              from: "System <noreply@votre-domaine.com>",
              to: [communication.destinataire_email],
              subject: communication.sujet || "Notification",
              html: communication.contenu,
            });

            sendResult = emailResponse;

            await supabaseClient
              .from('communications')
              .update({ 
                status: 'envoyé', 
                sent_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', communicationId);

          } catch (emailError) {
            await supabaseClient
              .from('communications')
              .update({ 
                status: 'échoué', 
                error_message: emailError.message,
                updated_at: new Date().toISOString()
              })
              .eq('id', communicationId);

            throw emailError;
          }
        }

        // Logger l'action admin
        await logAdminAction(
          user.id,
          'retry_communication',
          'communication',
          communicationId,
          { status: 'échoué' },
          { status: 'en_attente', retry_count: (communication.retry_count || 0) + 1 },
          'Communication relancée par admin'
        );

        return new Response(JSON.stringify({ 
          communication,
          send_result: sendResult
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    throw new Error("Invalid request");

  } catch (error) {
    console.error("Error in admin-communications function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});