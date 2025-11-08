import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { type, title, message, data, priority = 'normal' } = await req.json();

    if (!type || !title || !message) {
      throw new Error("Missing required parameters");
    }

    // Récupérer tous les admins
    const { data: adminRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (rolesError) throw rolesError;

    if (!adminRoles || adminRoles.length === 0) {
      console.log('⚠️ Aucun admin trouvé pour la notification');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Aucun admin trouvé" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Créer une notification pour chaque admin
    const notifications = adminRoles.map(admin => ({
      user_id: admin.user_id,
      type,
      title,
      message,
      data: data || {},
      priority,
      is_read: false
    }));

    const { error: insertError } = await supabaseAdmin
      .from('realtime_notifications')
      .insert(notifications);

    if (insertError) throw insertError;

    console.log(`✅ ${notifications.length} notification(s) créée(s) pour les admins`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${notifications.length} notification(s) envoyée(s)`,
        admins_notified: notifications.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Erreur création notification admin:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
