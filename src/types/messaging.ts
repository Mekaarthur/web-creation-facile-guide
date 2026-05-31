import type { Database } from '@/integrations/supabase/types'

type T = Database['public']['Tables']
type V = Database['public']['Views']

// Chat (client-provider)
export type ChatConversation = T['chat_conversations']['Row']
export type ChatConversationInsert = T['chat_conversations']['Insert']
export type ChatConversationUpdate = T['chat_conversations']['Update']

export type ChatMessage = T['chat_messages']['Row']
export type ChatMessageInsert = T['chat_messages']['Insert']
export type ChatMessageUpdate = T['chat_messages']['Update']

export type ChatSession = T['chat_sessions']['Row']
export type ChatSessionInsert = T['chat_sessions']['Insert']
export type ChatSessionUpdate = T['chat_sessions']['Update']

// Internal (admin) messaging
export type InternalConversation = T['internal_conversations']['Row']
export type InternalConversationInsert = T['internal_conversations']['Insert']
export type InternalConversationUpdate = T['internal_conversations']['Update']

export type InternalMessage = T['internal_messages']['Row']
export type InternalMessageInsert = T['internal_messages']['Insert']
export type InternalMessageUpdate = T['internal_messages']['Update']

// Communications log
export type Communication = T['communications']['Row']
export type CommunicationInsert = T['communications']['Insert']
export type CommunicationUpdate = T['communications']['Update']

// Chatbot
export type ChatbotConversation = T['chatbot_conversations']['Row']
export type ChatbotConversationInsert = T['chatbot_conversations']['Insert']
export type ChatbotConversationUpdate = T['chatbot_conversations']['Update']

export type ChatbotMessage = T['chatbot_messages']['Row']
export type ChatbotMessageInsert = T['chatbot_messages']['Insert']
export type ChatbotMessageUpdate = T['chatbot_messages']['Update']

// Views
export type ConversationWithDetails = V['conversations_with_details']['Row']
