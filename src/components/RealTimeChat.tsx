import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Phone, Video, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AnimatedCard } from '@/components/ui/animated-card';

interface Message {
  id: string;
  message: string;
  sender_id: string;
  receiver_id: string;
  message_type: string;
  file_url?: string;
  is_read: boolean;
  created_at: string;
  conversation_id: string;
  status: string;
  reply_to_id?: string;
}

interface Conversation {
  id: string;
  booking_id: string;
  client_id: string;
  provider_id: string;
  status: string;
  last_message_at: string;
  bookings?: {
    service_id: string;
    booking_date: string;
    services?: {
      name: string;
    };
  };
}

interface RealTimeChatProps {
  conversationId?: string;
  otherUserId?: string;
  bookingId?: string;
  onClose?: () => void;
}

export const RealTimeChat: React.FC<RealTimeChatProps> = ({
  conversationId,
  otherUserId,
  bookingId,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(conversationId || null);
  const [loading, setLoading] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadConversations();
      setupPresence();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupPresence = async () => {
    if (!user) return;

    // Mettre à jour le statut de présence
    await supabase
      .from('user_presence')
      .upsert({
        user_id: user.id,
        status: 'online',
        last_seen: new Date().toISOString(),
        current_page: window.location.pathname
      });

    // Écouter les changements de présence
    const presenceChannel = supabase.channel('user-presence')
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState();
        const online = new Set(Object.keys(presenceState));
        setOnlineUsers(online);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      })
      .subscribe();

    // S'enregistrer comme présent
    await presenceChannel.track({
      user_id: user.id,
      online_at: new Date().toISOString()
    });

    return () => {
      presenceChannel.unsubscribe();
    };
  };

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    // Écouter les nouveaux messages
    const messagesChannel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Notification sonore pour les nouveaux messages
          if (newMessage.sender_id !== user.id) {
            playNotificationSound();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe();

    // Écouter les conversations
    const conversationsChannel = supabase
      .channel('chat-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
          filter: `client_id=eq.${user.id},provider_id=eq.${user.id}`
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      messagesChannel.unsubscribe();
      conversationsChannel.unsubscribe();
    };
  };

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          bookings (
            service_id,
            booking_date,
            services (name)
          )
        `)
        .or(`client_id.eq.${user.id},provider_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);

    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les conversations"
      });
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Marquer les messages comme lus
      await markMessagesAsRead(conversationId);

    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les messages"
      });
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

    } catch (error) {
      console.error('Erreur lors du marquage des messages comme lus:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !user) return;

    try {
      const conversation = conversations.find(c => c.id === activeConversation);
      if (!conversation) return;

      const receiverId = conversation.client_id === user.id 
        ? conversation.provider_id 
        : conversation.client_id;

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          booking_id: conversation.booking_id,
          conversation_id: activeConversation,
          sender_id: user.id,
          receiver_id: receiverId,
          message: newMessage.trim(),
          message_type: 'text',
          is_read: false,
          status: 'sent'
        });

      if (error) throw error;

      setNewMessage('');

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer le message"
      });
    }
  };

  const playNotificationSound = () => {
    // Son de notification simple
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D0u2AeEDuW3PLEfy8HTX7K8+OCNwgjdLrk6pFNFBNVr+Lyv2AOBziS3Aa3ciUaOH...'); // Base64 minimal
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Ignorer les erreurs si pas autorisé
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOtherUser = (conversation: Conversation) => {
    return conversation.client_id === user?.id 
      ? conversation.provider_id 
      : conversation.client_id;
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
  };

  return (
    <div className="flex h-[600px] bg-background border rounded-lg overflow-hidden">
      {/* Liste des conversations */}
      <div className="w-1/3 border-r bg-muted/30">
        <div className="p-4 border-b bg-background">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </h3>
        </div>
        
        <ScrollArea className="h-[calc(100%-65px)]">
          <div className="p-2 space-y-2">
            {conversations.map((conversation) => {
              const otherUserId = getOtherUser(conversation);
              const isOnline = isUserOnline(otherUserId);
              
              return (
                <Card
                  key={conversation.id}
                  className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    activeConversation === conversation.id ? 'bg-primary/10 border-primary' : ''
                  }`}
                  onClick={() => setActiveConversation(conversation.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {conversation.client_id === user?.id ? 'P' : 'C'}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">
                          {conversation.bookings?.services?.name || 'Conversation'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(conversation.last_message_at)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {conversation.client_id === user?.id ? 'Prestataire' : 'Client'}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Zone de chat */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* En-tête du chat */}
            <div className="p-4 border-b bg-background flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    {conversations.find(c => c.id === activeConversation)?.bookings?.services?.name}
                  </p>
                  {otherUserTyping && (
                    <p className="text-xs text-muted-foreground">En train d'écrire...</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs opacity-70">
                          {formatTime(message.created_at)}
                        </p>
                        {message.sender_id === user?.id && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                          >
                            {message.is_read ? 'Lu' : 'Envoyé'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Saisie de message */}
            <div className="p-4 border-t bg-background">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Smile className="h-4 w-4" />
                </Button>
                
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1"
                />
                
                <Button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Sélectionnez une conversation pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};