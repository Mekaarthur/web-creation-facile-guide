import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mots-clés à surveiller
const ALERT_KEYWORDS = [
  'problème',
  'retard',
  'remboursement',
  'annuler',
  'arnaque',
  'pas content',
  'mécontent',
  'insatisfait',
  'plainte',
  'réclamation',
  'urgent',
  'aide',
  'litige',
  'dispute',
  'conflit',
  'mauvais service',
  'pas venu',
  'absent'
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { messageId, messageText, conversationId } = await req.json();

    if (!messageText || !conversationId) {
      throw new Error("Missing required parameters");
    }

    // Vérifier si le message contient des mots-clés d'alerte
    const lowerMessage = messageText.toLowerCase();
    const detectedKeywords = ALERT_KEYWORDS.filter(keyword => 
      lowerMessage.includes(keyword)
    );

    if (detectedKeywords.length > 0) {
      console.log(`🚨 Mots-clés détectés dans conversation ${conversationId}:`, detectedKeywords);

      // Récupérer les admins
      const { data: adminRoles } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles && adminRoles.length > 0) {
        // Créer une notification pour chaque admin
        const notifications = adminRoles.map(admin => ({
          user_id: admin.user_id,
          type: 'conversation_alert',
          title: '⚠️ Alerte conversation',
          message: `Mots-clés détectés: "${detectedKeywords.join(', ')}" dans une conversation`,
          data: {
            conversation_id: conversationId,
            message_id: messageId,
            keywords: detectedKeywords
          },
          priority: 'high'
        }));

        await supabaseAdmin
          .from('realtime_notifications')
          .insert(notifications);

        // Marquer la conversation comme prioritaire
        const { data: conversation } = await supabaseAdmin
          .from('internal_conversations')
          .select('id')
          .eq('id', conversationId)
          .single();

        if (conversation) {
          await supabaseAdmin
            .from('internal_conversations')
            .update({ status: 'pending' })
            .eq('id', conversationId);
        }
      }

      return new Response(
        JSON.stringify({ 
          alert: true, 
          keywords: detectedKeywords,
          message: "Mots-clés détectés, admins notifiés"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ alert: false, message: "Aucun mot-clé d'alerte détecté" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erreur monitoring:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
