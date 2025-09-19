import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationWithDetails {
  id: string;
  subject: string;
  client_id: string;
  provider_id: string | null;
  admin_id: string | null;
  status: string;
  last_message_at: string;
  created_at: string;
  unread_count: number;
  client_name: string;
  provider_name: string | null;
  client_email: string;
}

interface MessageWithDetails {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  message_type: string;
  file_url: string | null;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  is_admin: boolean;
}

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
    console.log(`[Admin Messaging] Action: ${action}`, requestData);

    let result;
    
    switch (action) {
      case 'list_conversations':
        result = await listConversations(supabase, requestData);
        break;
      case 'get_conversation':
        result = await getConversation(supabase, requestData);
        break;
      case 'send_message':
        result = await sendMessage(supabase, requestData);
        break;
      case 'create_conversation':
        result = await createConversation(supabase, requestData);
        break;
      case 'get_stats':
        result = await getMessagingStats(supabase, requestData);
        break;
      default:
        throw new Error(`Action non reconnue: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Admin Messaging] Erreur:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function listConversations(supabase: any, { status, limit = 50, offset = 0 }: any): Promise<{ success: boolean; conversations: ConversationWithDetails[] }> {
  try {
    // Construire la requête de base
    let conversationsQuery = supabase
      .from('internal_conversations')
      .select(`
        *,
        client_profile:profiles!client_id(first_name, last_name, email)
      `)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      conversationsQuery = conversationsQuery.eq('status', status);
    }

    const { data: conversations, error: convError } = await conversationsQuery;
    
    if (convError) {
      throw new Error(`Erreur récupération conversations: ${convError.message}`);
    }

    if (!conversations || conversations.length === 0) {
      return { success: true, conversations: [] };
    }

    // Enrichir avec les données additionnelles
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv: any): Promise<ConversationWithDetails> => {
        // Compter les messages non lus pour les admins
        const { count: unreadCount } = await supabase
          .from('internal_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', conv.admin_id);

        // Récupérer le nom du prestataire si applicable
        let providerName = null;
        if (conv.provider_id) {
          const { data: provider } = await supabase
            .from('providers')
            .select('business_name')
            .eq('id', conv.provider_id)
            .single();
          
          providerName = provider?.business_name || null;
        }

        // Construire le nom du client
        const clientProfile = conv.client_profile;
        const clientName = clientProfile && clientProfile.first_name && clientProfile.last_name
          ? `${clientProfile.first_name} ${clientProfile.last_name}`
          : conv.client_id.slice(0, 8);

        const clientEmail = clientProfile?.email || 'email@inconnu.com';

        return {
          id: conv.id,
          subject: conv.subject || 'Conversation',
          client_id: conv.client_id,
          provider_id: conv.provider_id,
          admin_id: conv.admin_id,
          status: conv.status || 'active',
          last_message_at: conv.last_message_at || conv.created_at,
          created_at: conv.created_at,
          unread_count: unreadCount || 0,
          client_name: clientName,
          provider_name: providerName,
          client_email: clientEmail
        };
      })
    );

    return {
      success: true,
      conversations: enrichedConversations
    };

  } catch (error) {
    console.error('Erreur listConversations:', error);
    throw error;
  }
}

async function getConversation(supabase: any, { conversationId }: any): Promise<{ success: boolean; conversation: any; messages: MessageWithDetails[] }> {
  try {
    // Récupérer la conversation
    const { data: conversation, error: convError } = await supabase
      .from('internal_conversations')
      .select(`
        *,
        client_profile:profiles!client_id(first_name, last_name, email)
      `)
      .eq('id', conversationId)
      .single();

    if (convError) {
      throw new Error(`Conversation non trouvée: ${convError.message}`);
    }

    // Récupérer les messages
    const { data: messages, error: messagesError } = await supabase
      .from('internal_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw new Error(`Erreur messages: ${messagesError.message}`);
    }

    // Enrichir les messages avec les noms des expéditeurs
    const enrichedMessages: MessageWithDetails[] = await Promise.all(
      (messages || []).map(async (message: any): Promise<MessageWithDetails> => {
        let senderName = 'Utilisateur';
        let isAdmin = false;

        // Vérifier si c'est un admin
        if (message.sender_id === conversation.admin_id) {
          senderName = 'Équipe Bikawo';
          isAdmin = true;
        } else {
          // Essayer de récupérer le nom depuis les profils
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', message.sender_id)
            .single();

          if (profile && profile.first_name && profile.last_name) {
            senderName = `${profile.first_name} ${profile.last_name}`;
          } else {
            senderName = `Utilisateur ${message.sender_id.slice(0, 8)}`;
          }
        }

        return {
          id: message.id,
          conversation_id: message.conversation_id,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          message_text: message.message_text,
          message_type: message.message_type || 'text',
          file_url: message.file_url,
          is_read: message.is_read || false,
          created_at: message.created_at,
          sender_name: senderName,
          is_admin: isAdmin
        };
      })
    );

    return {
      success: true,
      conversation,
      messages: enrichedMessages
    };

  } catch (error) {
    console.error('Erreur getConversation:', error);
    throw error;
  }
}

async function sendMessage(supabase: any, { conversationId, senderId, receiverId, message, messageType = 'text' }: any): Promise<{ success: boolean; message: any; notification: string }> {
  try {
    // Créer le message
    const { data: newMessage, error: messageError } = await supabase
      .from('internal_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        message_text: message,
        message_type: messageType,
        is_read: false
      })
      .select()
      .single();

    if (messageError) {
      throw new Error(`Erreur création message: ${messageError.message}`);
    }

    // Mettre à jour la conversation
    const { error: updateError } = await supabase
      .from('internal_conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        status: 'active' // Réactiver la conversation si elle était fermée
      })
      .eq('id', conversationId);

    if (updateError) {
      console.warn('Erreur mise à jour conversation:', updateError);
    }

    // Créer une notification pour le destinataire
    const { error: notificationError } = await supabase
      .from('realtime_notifications')
      .insert({
        user_id: receiverId,
        type: 'new_message',
        title: 'Nouveau message',
        message: 'Vous avez reçu un nouveau message de l\'équipe Bikawo',
        data: { 
          conversation_id: conversationId,
          message_preview: message.substring(0, 100)
        },
        priority: 'normal'
      });

    if (notificationError) {
      console.warn('Erreur création notification:', notificationError);
    }

    return {
      success: true,
      message: newMessage,
      notification: 'Message envoyé avec succès'
    };

  } catch (error) {
    console.error('Erreur sendMessage:', error);
    throw error;
  }
}

async function createConversation(supabase: any, { clientId, providerId, adminId, subject, initialMessage }: any): Promise<{ success: boolean; conversation: any; message: string }> {
  try {
    // Créer la conversation
    const { data: conversation, error: convError } = await supabase
      .from('internal_conversations')
      .insert({
        client_id: clientId,
        provider_id: providerId,
        admin_id: adminId,
        subject: subject || 'Nouvelle conversation',
        status: 'active',
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    if (convError) {
      throw new Error(`Erreur création conversation: ${convError.message}`);
    }

    // Envoyer le message initial si fourni
    if (initialMessage && initialMessage.trim()) {
      const { error: messageError } = await supabase
        .from('internal_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: adminId,
          receiver_id: clientId,
          message_text: initialMessage,
          message_type: 'text',
          is_read: false
        });

      if (messageError) {
        console.warn('Erreur message initial:', messageError);
      }

      // Notifier le client
      const { error: notificationError } = await supabase
        .from('realtime_notifications')
        .insert({
          user_id: clientId,
          type: 'new_conversation',
          title: 'Nouvelle conversation',
          message: `Nouvelle conversation: ${subject}`,
          data: { 
            conversation_id: conversation.id,
            subject: subject
          },
          priority: 'high'
        });

      if (notificationError) {
        console.warn('Erreur notification:', notificationError);
      }
    }

    return {
      success: true,
      conversation,
      message: 'Conversation créée avec succès'
    };

  } catch (error) {
    console.error('Erreur createConversation:', error);
    throw error;
  }
}

async function getMessagingStats(supabase: any, { days = 7 }: any): Promise<{ success: boolean; stats: any }> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Conversations créées dans la période
    const { data: conversations } = await supabase
      .from('internal_conversations')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // Messages envoyés dans la période
    const { data: messages } = await supabase
      .from('internal_messages')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // Conversations résolues (fermées) dans la période
    const { data: resolvedConversations } = await supabase
      .from('internal_conversations')
      .select('*')
      .eq('status', 'closed')
      .gte('updated_at', startDate.toISOString());

    const conversationsCreated = conversations?.length || 0;
    const messagesTotal = messages?.length || 0;
    
    // Messages envoyés par les admins (approximation)
    const adminMessages = messages?.filter((m: any) => {
      // Chercher si le sender_id est un admin dans les conversations
      const conversation = conversations?.find((c: any) => c.id === m.conversation_id);
      return conversation && m.sender_id === conversation.admin_id;
    }).length || 0;

    const resolvedCount = resolvedConversations?.length || 0;

    // Calcul approximatif du temps de réponse moyen
    let averageResponseTime = '2h 15min'; // Mock pour l'instant
    
    // Taux de résolution
    const resolutionRate = conversationsCreated > 0 
      ? Math.round((resolvedCount / conversationsCreated) * 100) 
      : 0;

    return {
      success: true,
      stats: {
        conversationsCreated,
        messagesTotal,
        adminMessages,
        resolvedConversations: resolvedCount,
        averageResponseTime,
        resolutionRate
      }
    };

  } catch (error) {
    console.error('Erreur getMessagingStats:', error);
    throw error;
  }
}