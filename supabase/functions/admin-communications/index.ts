import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...requestData } = await req.json();

    switch (action) {
      case 'list_messages':
        const { data: messages } = await supabase.from('internal_messages').select(`
          *, internal_conversations(subject)
        `).order('created_at', { ascending: false }).limit(50);
        
        return new Response(JSON.stringify({ 
          success: true, 
          messages: messages || [] 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      case 'send_message':
        const { data: conversation, error: convError } = await supabase
          .from('internal_conversations')
          .insert({ 
            subject: requestData.subject,
            client_id: requestData.receiverId,
            admin_id: requestData.adminUserId
          })
          .select('id')
          .single();

        if (convError) throw convError;

        const { error: msgError } = await supabase
          .from('internal_messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: requestData.adminUserId,
            receiver_id: requestData.receiverId,
            message_text: requestData.message
          });

        if (msgError) throw msgError;
        return new Response(JSON.stringify({ success: true }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      default:
        throw new Error(`Action non reconnue: ${action}`);
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});