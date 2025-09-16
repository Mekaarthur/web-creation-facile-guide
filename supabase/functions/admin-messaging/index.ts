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
      case 'list_conversations':
        return new Response(JSON.stringify(await listConversations(supabase, requestData)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'get_conversation':
        return new Response(JSON.stringify(await getConversation(supabase, requestData)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'send_message':
        return new Response(JSON.stringify(await sendMessage(supabase, requestData)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'create_conversation':
        return new Response(JSON.stringify(await createConversation(supabase, requestData)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      case 'get_stats':
        return new Response(JSON.stringify(await getMessagingStats(supabase, requestData)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      default:
        throw new Error(`Action non reconnue: ${action}`);
    }
  } catch (error) {
    console.error('Erreur dans admin-messaging:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function listConversations(supabase: any, { status, limit = 50, offset = 0 }: any) {
  let query = supabase
    .from('internal_conversations')
    .select(`
      *,
      profiles!client_id(first_name, last_name, email),
      providers(business_name)
    `)
    .order('last_message_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: conversations, error } = await query;

  if (error) {
    throw new Error(`Erreur récupération conversations: ${error.message}`);
  }

  // Enrichir avec le nombre de messages non lus
  const enrichedConversations = await Promise.all(
    (conversations || []).map(async (conv: any) => {
      const { data: unreadCount } = await supabase
        .from('internal_messages')
        .select('id', { count: 'exact' })
        .eq('conversation_id', conv.id)
        .eq('is_read', false)
        .neq('sender_id', conv.admin_id); // Messages non lus par l'admin

      return {
        ...conv,
        unread_count: unreadCount?.length || 0,
        client_name: conv.profiles ? `${conv.profiles.first_name} ${conv.profiles.last_name}` : 'Client inconnu',
        provider_name: conv.providers?.business_name || null
      };
    })
  );

  return {
    success: true,
    conversations: enrichedConversations
  };
}

async function getConversation(supabase: any, { conversationId }: any) {
  // Récupérer la conversation
  const { data: conversation, error: convError } = await supabase
    .from('internal_conversations')
    .select(`
      *,
      profiles!client_id(first_name, last_name, email),
      providers(business_name)
    `)
    .eq('id', conversationId)
    .single();

  if (convError) {
    throw new Error(`Erreur récupération conversation: ${convError.message}`);
  }

  // Récupérer les messages
  const { data: messages, error: messagesError } = await supabase
    .from('internal_messages')
    .select(`
      *,
      sender:profiles!sender_id(first_name, last_name),
      receiver:profiles!receiver_id(first_name, last_name)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    throw new Error(`Erreur récupération messages: ${messagesError.message}`);
  }

  return {
    success: true,
    conversation: {
      ...conversation,
      client_name: conversation.profiles ? `${conversation.profiles.first_name} ${conversation.profiles.last_name}` : 'Client inconnu',
      provider_name: conversation.providers?.business_name || null
    },
    messages: messages || []
  };
}

async function sendMessage(supabase: any, { conversationId, senderId, receiverId, message, messageType = 'text' }: any) {
  // Créer le message
  const { data: newMessage, error: messageError } = await supabase
    .from('internal_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      message_text: message,
      message_type: messageType
    })
    .select()
    .single();

  if (messageError) {
    throw new Error(`Erreur envoi message: ${messageError.message}`);
  }

  // Mettre à jour la conversation
  await supabase
    .from('internal_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  // Créer une notification pour le destinataire
  await supabase
    .from('realtime_notifications')
    .insert({
      user_id: receiverId,
      type: 'new_message',
      title: 'Nouveau message',
      message: 'Vous avez reçu un nouveau message de l\'équipe Bikawo',
      data: { conversation_id: conversationId }
    });

  return {
    success: true,
    message: newMessage,
    notification: 'Message envoyé avec succès'
  };
}

async function createConversation(supabase: any, { clientId, providerId, adminId, subject, initialMessage }: any) {
  // Créer la conversation
  const { data: conversation, error: convError } = await supabase
    .from('internal_conversations')
    .insert({
      client_id: clientId,
      provider_id: providerId,
      admin_id: adminId,
      subject,
      status: 'active'
    })
    .select()
    .single();

  if (convError) {
    throw new Error(`Erreur création conversation: ${convError.message}`);
  }

  // Envoyer le message initial si fourni
  if (initialMessage) {
    await supabase
      .from('internal_messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: adminId,
        receiver_id: clientId,
        message_text: initialMessage,
        message_type: 'text'
      });

    // Notifier le client
    await supabase
      .from('realtime_notifications')
      .insert({
        user_id: clientId,
        type: 'new_conversation',
        title: 'Nouvelle conversation',
        message: `Nouvelle conversation: ${subject}`,
        data: { conversation_id: conversation.id }
      });
  }

  return {
    success: true,
    conversation,
    message: 'Conversation créée avec succès'
  };
}

async function getMessagingStats(supabase: any, { days = 7 }: any) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Conversations actives
  const { data: conversations } = await supabase
    .from('internal_conversations')
    .select('*')
    .gte('created_at', startDate.toISOString());

  // Messages envoyés
  const { data: messages } = await supabase
    .from('internal_messages')
    .select('*')
    .gte('created_at', startDate.toISOString());

  // Temps de réponse moyen (approximation)
  const { data: responseTimeData } = await supabase
    .from('internal_messages')
    .select('created_at, conversation_id')
    .gte('created_at', startDate.toISOString())
    .order('created_at');

  const conversationsCreated = conversations?.length || 0;
  const messagesTotal = messages?.length || 0;
  const adminMessages = messages?.filter((m: any) => 
    m.sender_id && m.sender_id !== m.receiver_id // Messages d'admin
  ).length || 0;

  // Conversations résolues (statut closed)
  const { data: resolvedConversations } = await supabase
    .from('internal_conversations')
    .select('*')
    .eq('status', 'closed')
    .gte('updated_at', startDate.toISOString());

  const resolvedCount = resolvedConversations?.length || 0;

  return {
    success: true,
    stats: {
      conversationsCreated,
      messagesTotal,
      adminMessages,
      resolvedConversations: resolvedCount,
      averageResponseTime: '2h 15min', // Mock pour l'instant
      resolutionRate: conversationsCreated > 0 ? Math.round((resolvedCount / conversationsCreated) * 100) : 0,
      dailyStats: generateDailyStats(conversations, messages, days)
    }
  };
}

function generateDailyStats(conversations: any[], messages: any[], days: number) {
  const stats = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayConversations = conversations?.filter((c: any) => 
      c.created_at.startsWith(dateStr)
    ).length || 0;

    const dayMessages = messages?.filter((m: any) => 
      m.created_at.startsWith(dateStr)
    ).length || 0;

    stats.push({
      date: dateStr,
      conversations: dayConversations,
      messages: dayMessages
    });
  }

  return stats;
}