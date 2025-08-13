import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare,
  Send,
  User,
  Clock,
  Check,
  Phone,
  Mail,
  FileText,
  Video
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InternalConversation {
  id: string;
  subject: string;
  client_id: string;
  provider_id: string | null;
  admin_id: string | null;
  status: string;
  last_message_at: string;
  created_at: string;
  client_request_id: string | null;
  job_application_id: string | null;
  booking_id: string | null;
}

interface InternalMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  message_type: string;
  file_url: string | null;
  is_read: boolean;
  created_at: string;
}

export const InternalMessaging = () => {
  const [conversations, setConversations] = useState<InternalConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<InternalConversation | null>(null);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      // Marquer les messages comme lus
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('internal_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('internal_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('internal_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user.id);
    } catch (error) {
      console.error('Erreur lors du marquage des messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Déterminer le destinataire
      let receiverId = selectedConversation.client_id;
      if (user.id === selectedConversation.client_id && selectedConversation.admin_id) {
        receiverId = selectedConversation.admin_id;
      } else if (selectedConversation.provider_id && user.id !== selectedConversation.provider_id) {
        receiverId = selectedConversation.provider_id;
      }

      const { error } = await supabase
        .from('internal_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          receiver_id: receiverId,
          message_text: newMessage,
          message_type: 'text'
        });

      if (error) throw error;

      // Mettre à jour la conversation
      await supabase
        .from('internal_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      setNewMessage('');
      fetchMessages(selectedConversation.id);
      fetchConversations();

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async (clientRequestId: string, subject: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Récupérer les infos de la demande client
      const { data: request } = await supabase
        .from('client_requests')
        .select('client_email')
        .eq('id', clientRequestId)
        .single();

      if (!request) throw new Error('Demande non trouvée');

      // Créer la conversation
      const { data, error } = await supabase
        .from('internal_conversations')
        .insert({
          client_request_id: clientRequestId,
          client_id: request.client_email, // Utiliser email comme identifiant temporaire
          admin_id: user.id,
          subject: subject || `Conversation - Demande ${clientRequestId.slice(0, 8)}`,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Conversation créée",
        description: "Une nouvelle conversation a été créée",
      });

      fetchConversations();
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation",
        variant: "destructive",
      });
    }
  };

  const getConversationStatus = (status: string) => {
    switch (status) {
      case 'active': return { color: 'default', label: 'Active' };
      case 'closed': return { color: 'outline', label: 'Fermée' };
      case 'archived': return { color: 'secondary', label: 'Archivée' };
      default: return { color: 'outline', label: status };
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Messagerie interne
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="conversations" className="space-y-4">
            <TabsList>
              <TabsTrigger value="conversations">Conversations</TabsTrigger>
              <TabsTrigger value="new">Nouvelle conversation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="conversations" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Liste des conversations */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Conversations</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {conversations.map((conversation) => {
                      const statusInfo = getConversationStatus(conversation.status);
                      return (
                        <Card 
                          key={conversation.id}
                          className={`cursor-pointer transition-colors ${
                            selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-sm">{conversation.subject}</h4>
                              <Badge variant={statusInfo.color as any} className="text-xs">
                                {statusInfo.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(conversation.last_message_at), 'dd MMM HH:mm', { locale: fr })}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Fenêtre de conversation */}
                <div className="lg:col-span-2">
                  {selectedConversation ? (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{selectedConversation.subject}</CardTitle>
                          <Badge variant={getConversationStatus(selectedConversation.status).color as any}>
                            {getConversationStatus(selectedConversation.status).label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Messages */}
                        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                          {messages.map((message) => (
                            <div 
                              key={message.id}
                              className={`flex ${message.sender_id === selectedConversation.admin_id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                                message.sender_id === selectedConversation.admin_id 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                <p className="text-sm">{message.message_text}</p>
                                <p className="text-xs opacity-75 mt-1">
                                  {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                                  {message.is_read && message.sender_id === selectedConversation.admin_id && (
                                    <Check className="w-3 h-3 inline ml-1" />
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Zone de saisie */}
                        <div className="flex gap-2">
                          <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Tapez votre message..."
                            className="flex-1 min-h-[60px]"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                          />
                          <Button 
                            onClick={sendMessage}
                            disabled={loading || !newMessage.trim()}
                            className="self-end"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="flex items-center justify-center h-64">
                        <div className="text-center text-muted-foreground">
                          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Sélectionnez une conversation pour commencer</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Créer une nouvelle conversation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sujet de la conversation</label>
                    <Input placeholder="Entrez le sujet..." />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type de conversation</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client_support">Support client</SelectItem>
                        <SelectItem value="provider_support">Support prestataire</SelectItem>
                        <SelectItem value="booking_issue">Problème de réservation</SelectItem>
                        <SelectItem value="payment_issue">Problème de paiement</SelectItem>
                        <SelectItem value="general">Général</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Message initial</label>
                    <Textarea 
                      placeholder="Tapez votre message initial..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <Button className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Créer la conversation
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};