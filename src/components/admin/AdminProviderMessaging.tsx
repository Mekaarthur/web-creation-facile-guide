import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Conversation {
  id: string;
  subject: string;
  status: string;
  last_message_at: string;
  client_id?: string;
  provider_id?: string;
  admin_id?: string;
  client?: {
    first_name: string;
    last_name: string;
    email?: string;
  };
}

interface Message {
  id: string;
  message_text: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
  };
}

interface AdminProviderMessagingProps {
  providerId: string;
}

const AdminProviderMessaging = ({ providerId }: AdminProviderMessagingProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      // Récupérer les conversations
      const { data: conversationsData, error } = await supabase
        .from('internal_conversations')
        .select('*')
        .eq('provider_id', providerId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Récupérer les profils clients
      const clientIds = [...new Set(conversationsData?.map(c => c.client_id).filter(Boolean))];
      const { data: clientsData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', clientIds);
      
      // Combiner les données
      const formattedConversations = conversationsData?.map(conv => ({
        ...conv,
        client: clientsData?.find(c => c.user_id === conv.client_id) || 
          { first_name: 'Client', last_name: 'Inconnu' }
      })) || [];
      
      setConversations(formattedConversations);
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      // Récupérer les messages
      const { data: messagesData, error } = await supabase
        .from('internal_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Récupérer les profils des expéditeurs
      const senderIds = [...new Set(messagesData?.map(m => m.sender_id).filter(Boolean))];
      const { data: sendersData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', senderIds);

      // Combiner les données
      const formattedMessages = messagesData?.map(msg => ({
        ...msg,
        sender: sendersData?.find(s => s.user_id === msg.sender_id) || 
          { first_name: 'Utilisateur', last_name: 'Inconnu' }
      })) || [];
      
      setMessages(formattedMessages);

      // Marquer les messages comme lus
      await supabase
        .from('internal_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', providerId);

    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('internal_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: selectedConversation.admin_id, // Admin qui répond
          receiver_id: selectedConversation.client_id,
          message_text: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedConversation.id);
      loadConversations();

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    }
  };

  const createNewConversation = async () => {
    // Cette fonction pourrait être développée pour créer de nouvelles conversations
    toast({
      title: "Fonctionnalité à venir",
      description: "La création de nouvelles conversations sera bientôt disponible",
    });
  };

  useEffect(() => {
    loadConversations();
  }, [providerId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'closed':
        return <Badge variant="secondary">Fermée</Badge>;
      case 'pending':
        return <Badge variant="outline">En attente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Messagerie du prestataire</h2>
        <Button onClick={createNewConversation}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Nouvelle conversation
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Liste des conversations */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                  <p>Aucune conversation</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {conversation.client?.first_name?.[0] || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {conversation.client?.first_name} {conversation.client?.last_name}
                            </p>
                            {getStatusBadge(conversation.status)}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {conversation.subject}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(conversation.last_message_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Zone de messagerie */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {selectedConversation.client?.first_name} {selectedConversation.client?.last_name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{selectedConversation.subject}</p>
              </CardHeader>
              
              <CardContent className="p-0 flex flex-col h-96">
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                      <p>Aucun message dans cette conversation</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === selectedConversation.admin_id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender_id === selectedConversation.admin_id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.message_text}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 opacity-70" />
                              <span className="text-xs opacity-70">
                                {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Tapez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                <p>Sélectionnez une conversation pour commencer</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminProviderMessaging;