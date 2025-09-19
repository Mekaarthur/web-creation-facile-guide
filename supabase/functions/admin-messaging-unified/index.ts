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
    console.log(`[Admin Messaging v2] Action: ${action}`, requestData);

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
    console.error('[Admin Messaging v2] Erreur:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============= FONCTIONS =============

async function listConversations(supabase: any, { status, limit = 50, offset = 0 }: any): Promise<{ success: boolean; conversations: ConversationWithDetails[] }> {
  try {
    console.log('[listConversations] Début récupération');
    
    // Requête simple sur internal_conversations
    let conversationsQuery = supabase
      .from('internal_conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      conversationsQuery = conversationsQuery.eq('status', status);
    }

    const { data: conversations, error: convError } = await conversationsQuery;
    
    if (convError) {
      console.error('Erreur conversations de base:', convError);
      throw new Error(`Erreur récupération conversations: ${convError.message}`);
    }

    console.log(`[listConversations] ${conversations?.length || 0} conversations trouvées`);

    if (!conversations || conversations.length === 0) {
      return { success: true, conversations: [] };
    }

    // Enrichir une par une pour éviter les erreurs de relation
    const enrichedConversations: ConversationWithDetails[] = [];
    
    for (const conv of conversations) {
      try {
        // Compter les messages non lus
        const { count: unreadCount } = await supabase
          .from('internal_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', conv.admin_id || 'none');

        // Récupérer le nom du client
        let clientName = `Client ${conv.client_id.slice(0, 8)}`;
        let clientEmail = 'email@inconnu.com';
        
        const { data: clientProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('user_id', conv.client_id)
          .single();

        if (clientProfile && clientProfile.first_name && clientProfile.last_name) {
          clientName = `${clientProfile.first_name} ${clientProfile.last_name}`;
          clientEmail = clientProfile.email || clientEmail;
        }

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

        enrichedConversations.push({
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
        });
      } catch (enrichError) {
        console.warn(`Erreur enrichissement conversation ${conv.id}:`, enrichError);
        
        // Ajouter version basique en cas d'erreur
        enrichedConversations.push({
          id: conv.id,
          subject: conv.subject || 'Conversation',
          client_id: conv.client_id,
          provider_id: conv.provider_id,
          admin_id: conv.admin_id,
          status: conv.status || 'active',
          last_message_at: conv.last_message_at || conv.created_at,
          created_at: conv.created_at,
          unread_count: 0,
          client_name: `Client ${conv.client_id.slice(0, 8)}`,
          provider_name: null,
          client_email: 'email@inconnu.com'
        });
      }
    }

    console.log(`[listConversations] ${enrichedConversations.length} conversations enrichies`);

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
    console.log(`[getConversation] Récupération conversation ${conversationId}`);
    
    // Récupérer la conversation de base
    const { data: conversation, error: convError } = await supabase
      .from('internal_conversations')
      .select('*')
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

    console.log(`[getConversation] ${messages?.length || 0} messages trouvés`);

    // Enrichir les messages avec les noms des expéditeurs
    const enrichedMessages: MessageWithDetails[] = [];
    
    for (const message of messages || []) {
      try {
        let senderName = 'Utilisateur';
        let isAdmin = false;

        // Vérifier si c'est un admin
        if (message.sender_id === conversation.admin_id) {
          senderName = 'Équipe Bikawo';
          isAdmin = true;
        } else {
          // Récupérer le nom depuis les profils
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

        enrichedMessages.push({
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
        });
      } catch (enrichError) {
        console.warn(`Erreur enrichissement message ${message.id}:`, enrichError);
        
        // Version basique en cas d'erreur
        enrichedMessages.push({
          id: message.id,
          conversation_id: message.conversation_id,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          message_text: message.message_text,
          message_type: message.message_type || 'text',
          file_url: message.file_url,
          is_read: message.is_read || false,
          created_at: message.created_at,
          sender_name: `Utilisateur ${message.sender_id.slice(0, 8)}`,
          is_admin: false
        });
      }
    }

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
    console.log(`[sendMessage] Envoi message dans conversation ${conversationId}`);
    
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
        status: 'active'
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

    console.log(`[sendMessage] Message envoyé avec succès`);

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
    console.log(`[createConversation] Création conversation pour client ${clientId}`);
    
    // Utiliser la fonction database pour créer la conversation
    const { data: conversationId, error: createError } = await supabase
      .rpc('create_internal_conversation', {
        p_client_id: clientId,
        p_provider_id: providerId,
        p_admin_id: adminId,
        p_subject: subject || 'Nouvelle conversation',
        p_initial_message: initialMessage
      });

    if (createError) {
      console.warn('Erreur fonction DB, fallback manuel:', createError);
      
      // Fallback manuel
      const { data: conversation, error: fallbackError } = await supabase
        .from('internal_conversations')
        .insert({
          client_id: clientId,
          provider_id: providerId,
          admin_id: adminId || null,
          subject: subject || 'Nouvelle conversation',
          status: 'active',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (fallbackError) {
        throw new Error(`Erreur création conversation: ${fallbackError.message}`);
      }

      // Ajouter le message initial si fourni
      if (initialMessage && initialMessage.trim()) {
        await supabase
          .from('internal_messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: adminId,
            receiver_id: clientId,
            message_text: initialMessage,
            message_type: 'text',
            is_read: false
          });
      }

      console.log(`[createConversation] Conversation ${conversation.id} créée (fallback)`);
      
      return {
        success: true,
        conversation,
        message: 'Conversation créée avec succès'
      };
    }

    // Récupérer la conversation créée
    const { data: createdConversation } = await supabase
      .from('internal_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    console.log(`[createConversation] Conversation ${conversationId} créée`);

    return {
      success: true,
      conversation: createdConversation,
      message: 'Conversation créée avec succès'
    };

  } catch (error) {
    console.error('Erreur createConversation:', error);
    throw error;
  }
}

async function getMessagingStats(supabase: any, { days = 7 }: any): Promise<{ success: boolean; stats: any }> {
  try {
    console.log(`[getMessagingStats] Calcul stats sur ${days} jours`);
    
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
    
    // Messages envoyés par les admins (approximation basée sur admin_id)
    const adminMessages = messages?.filter((m: any) => {
      const conversation = conversations?.find((c: any) => c.id === m.conversation_id);
      return conversation && m.sender_id === conversation.admin_id;
    }).length || 0;

    const resolvedCount = resolvedConversations?.length || 0;
    
    // Taux de résolution
    const resolutionRate = conversationsCreated > 0 
      ? Math.round((resolvedCount / conversationsCreated) * 100) 
      : 0;

    const stats = {
      conversationsCreated,
      messagesTotal,
      adminMessages,
      resolvedConversations: resolvedCount,
      averageResponseTime: '2h 15min', // Mock pour l'instant
      resolutionRate
    };

    console.log(`[getMessagingStats] Stats calculées:`, stats);

    return {
      success: true,
      stats
    };

  } catch (error) {
    console.error('Erreur getMessagingStats:', error);
    throw error;
  }
}