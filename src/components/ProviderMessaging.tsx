import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare,
  Send,
  Phone,
  Video,
  MoreVertical,
  Search,
  Paperclip,
  Smile,
  CheckCheck,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  sender_profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  } | null;
}

interface Conversation {
  id: string;
  client_id: string;
  booking_id?: string;
  last_message_at: string;
  client_profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  booking?: {
    services?: { name: string };
    booking_date: string;
    status: string;
  };
  unread_count: number;
}

const ProviderMessaging = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedConversation) {
      // Real-time subscription for messages
      const channel = supabase
        .channel('conversation-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages(prev => [...prev, newMessage]);
            
            // Mark as read if we're the receiver
            if (newMessage.receiver_id === user?.id) {
              markMessagesAsRead(selectedConversation.id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation, user?.id]);

  const loadConversations = async () => {
    try {
      // Get provider data
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (providerData) {
        setProvider(providerData);

        // Load conversations where the provider is involved
        const { data: conversationsData } = await supabase
          .from('chat_conversations')
          .select(`
            *,
            client_profile:profiles!chat_conversations_client_id_fkey(first_name, last_name, avatar_url),
            booking:bookings(
              services(name),
              booking_date,
              status
            )
          `)
          .eq('provider_id', user?.id)
          .order('last_message_at', { ascending: false });

        if (conversationsData) {
          // Get unread count for each conversation
          const conversationsWithUnreadCount = await Promise.all(
            conversationsData.map(async (conv: any) => {
              const { count } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .eq('receiver_id', user?.id)
                .eq('is_read', false);

              return {
                ...conv,
                client_profile: conv.client_profile || { first_name: 'Client', last_name: '', avatar_url: null },
                booking: conv.booking || { services: { name: 'Service général' }, booking_date: '', status: '' },
                unread_count: count || 0
              };
            })
          );

          setConversations(conversationsWithUnreadCount);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data: messagesData } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender_profile:profiles!chat_messages_sender_id_fkey(first_name, last_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages((messagesData || []).map((msg: any) => ({
        ...msg,
        sender_profile: msg.sender_profile || { first_name: 'User', last_name: '', avatar_url: null }
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user?.id);

      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user?.id,
          receiver_id: selectedConversation.client_id,
          message: newMessage.trim(),
          is_read: false,
          booking_id: selectedConversation.booking_id || ''
        });

      if (error) throw error;

      setNewMessage('');
      
      // Update conversation timestamp
      await supabase
        .from('chat_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv => 
    searchTerm === '' ||
    conv.client_profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.client_profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.booking?.services?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'C';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Messagerie Sécurisée
          </h2>
          <p className="text-muted-foreground">Communication directe avec vos clients</p>
        </div>
        
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          <MessageSquare className="h-3 w-3 mr-1" />
          Chiffrement de bout en bout
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[480px]">
              {filteredConversations.length > 0 ? (
                <div className="space-y-1 p-3">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                        selectedConversation?.id === conversation.id && "bg-primary/10 border border-primary/20"
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.client_profile?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                          {getInitials(conversation.client_profile?.first_name, conversation.client_profile?.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm truncate">
                            {conversation.client_profile?.first_name} {conversation.client_profile?.last_name}
                          </h4>
                          {conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.booking?.services?.name || 'Service général'}
                        </p>
                        
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(conversation.last_message_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                  <h3 className="font-semibold mb-2">Aucune conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    Les conversations avec vos clients s'afficheront ici
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 border-0 shadow-lg flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-secondary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.client_profile?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                        {getInitials(selectedConversation.client_profile?.first_name, selectedConversation.client_profile?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {selectedConversation.client_profile?.first_name} {selectedConversation.client_profile?.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.booking?.services?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[380px] p-4">
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwnMessage = message.sender_id === user?.id;
                      
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-3",
                            isOwnMessage && "justify-end"
                          )}
                        >
                          {!isOwnMessage && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.sender_profile?.avatar_url} />
                              <AvatarFallback className="bg-muted text-xs">
                                {getInitials(message.sender_profile?.first_name, message.sender_profile?.last_name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div
                            className={cn(
                              "max-w-[70%] rounded-2xl px-4 py-2 break-words",
                              isOwnMessage
                                ? "bg-gradient-to-r from-primary to-secondary text-white"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-sm">{message.message}</p>
                            <div className={cn(
                              "flex items-center gap-1 mt-1 text-xs",
                              isOwnMessage ? "text-white/70" : "text-muted-foreground"
                            )}>
                              <span>
                                {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                              </span>
                              {isOwnMessage && (
                                message.is_read ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Clock className="h-3 w-3" />
                                )
                              )}
                            </div>
                          </div>
                          
                          {isOwnMessage && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs">
                                P
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  
                  <Input
                    placeholder="Tapez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendingMessage}
                    className="flex-1"
                  />
                  
                  <Button variant="outline" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4 opacity-50 mx-auto" />
                <h3 className="text-lg font-semibold mb-2">Sélectionnez une conversation</h3>
                <p className="text-muted-foreground">
                  Choisissez une conversation pour commencer à échanger
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProviderMessaging;