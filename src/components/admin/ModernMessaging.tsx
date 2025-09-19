import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  MessageSquare, 
  Send, 
  User, 
  Clock, 
  Plus,
  ArrowLeft,
  MoreVertical,
  CheckCheck,
  Check,
  RefreshCw,
  Filter,
  Archive,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Conversation {
  id: string;
  subject: string;
  client_id: string;
  provider_id: string | null;
  admin_id: string | null;
  status: 'active' | 'closed' | 'archived';
  last_message_at: string;
  created_at: string;
  unread_count: number;
  client_name: string;
  provider_name: string | null;
  client_email: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  message_type: 'text' | 'file';
  file_url: string | null;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  is_admin: boolean;
}

interface MessagingStats {
  conversationsCreated: number;
  messagesTotal: number;
  adminMessages: number;
  resolvedConversations: number;
  averageResponseTime: string;
  resolutionRate: number;
}

export default function ModernMessaging() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<MessagingStats | null>(null);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [newConversationData, setNewConversationData] = useState({
    subject: '',
    clientId: '',
    initialMessage: ''
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
    loadStats();
    
    // Real-time subscriptions
    const conversationsChannel = supabase
      .channel('admin-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internal_conversations' }, () => {
        loadConversations();
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('admin-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internal_messages' }, () => {
        if (selectedConversation) {
          loadMessages(selectedConversation.id);
        }
        loadConversations(); // Update unread counts
      })
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markConversationAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const callAdminMessaging = async (action: string, data: any = {}) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('admin-messaging-unified', {
        body: { action, ...data }
      });
      
      if (error) throw error;
      if (!result.success) throw new Error(result.error);
      
      return result;
    } catch (error) {
      console.error(`Erreur ${action}:`, error);
      throw error;
    }
  };

  const loadConversations = async () => {
    try {
      const result = await callAdminMessaging('list_conversations', { 
        status: statusFilter === 'all' ? undefined : statusFilter 
      });
      setConversations(result.conversations || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive"
      });
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const result = await callAdminMessaging('get_conversation', { conversationId });
      setMessages(result.messages || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive"
      });
    }
  };

  const loadStats = async () => {
    try {
      const result = await callAdminMessaging('get_stats', { days: 7 });
      setStats(result.stats);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('internal_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const receiverId = selectedConversation.client_id !== user.id 
        ? selectedConversation.client_id 
        : selectedConversation.provider_id || selectedConversation.client_id;

      await callAdminMessaging('send_message', {
        conversationId: selectedConversation.id,
        senderId: user.id,
        receiverId,
        message: newMessage
      });

      setNewMessage('');
      loadMessages(selectedConversation.id);
      loadConversations();

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async () => {
    if (!newConversationData.subject || !newConversationData.clientId) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      await callAdminMessaging('create_conversation', {
        clientId: newConversationData.clientId,
        adminId: user.id,
        subject: newConversationData.subject,
        initialMessage: newConversationData.initialMessage
      });

      setIsNewConversationOpen(false);
      setNewConversationData({ subject: '', clientId: '', initialMessage: '' });
      loadConversations();

      toast({
        title: "Conversation créée",
        description: "La nouvelle conversation a été créée avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConversationStatus = async (conversationId: string, status: string) => {
    try {
      await supabase
        .from('internal_conversations')
        .update({ status })
        .eq('id', conversationId);

      loadConversations();
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation({ ...selectedConversation, status: status as any });
      }

      toast({
        title: "Statut mis à jour",
        description: `Conversation marquée comme ${status}`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.client_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default">Active</Badge>;
      case 'closed': return <Badge variant="outline">Fermée</Badge>;
      case 'archived': return <Badge variant="secondary">Archivée</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return format(date, 'dd/MM HH:mm', { locale: fr });
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header avec statistiques */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Messagerie Administrative</h1>
            <p className="text-muted-foreground">Communication centralisée avec clients et prestataires</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadConversations}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            
            <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle conversation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Sujet *</label>
                    <Input
                      value={newConversationData.subject}
                      onChange={(e) => setNewConversationData({
                        ...newConversationData,
                        subject: e.target.value
                      })}
                      placeholder="Sujet de la conversation"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">ID Client *</label>
                    <Input
                      value={newConversationData.clientId}
                      onChange={(e) => setNewConversationData({
                        ...newConversationData,
                        clientId: e.target.value
                      })}
                      placeholder="UUID du client"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Message initial</label>
                    <Textarea
                      value={newConversationData.initialMessage}
                      onChange={(e) => setNewConversationData({
                        ...newConversationData,
                        initialMessage: e.target.value
                      })}
                      placeholder="Message d'ouverture..."
                      rows={3}
                    />
                  </div>
                  
                  <Button onClick={createConversation} disabled={loading} className="w-full">
                    {loading ? 'Création...' : 'Créer la conversation'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats rapides */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">{stats.conversationsCreated}</div>
                <p className="text-xs text-muted-foreground">Conversations (7j)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.messagesTotal}</div>
                <p className="text-xs text-muted-foreground">Messages totaux</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.adminMessages}</div>
                <p className="text-xs text-muted-foreground">Réponses admin</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{conversations.filter(c => c.unread_count > 0).length}</div>
                <p className="text-xs text-muted-foreground">Non lues</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{stats.averageResponseTime}</div>
                <p className="text-xs text-muted-foreground">Temps moyen</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-teal-600">{stats.resolutionRate}%</div>
                <p className="text-xs text-muted-foreground">Taux résolution</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Interface principale */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Panel gauche - Liste conversations */}
        <div className="space-y-4">
          {/* Recherche et filtres */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="closed">Fermées</SelectItem>
                  <SelectItem value="archived">Archivées</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Liste des conversations */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <Card 
                key={conversation.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedConversation?.id === conversation.id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : conversation.unread_count > 0 
                      ? 'border-l-4 border-l-primary' 
                      : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm truncate">{conversation.subject}</h4>
                    {getStatusBadge(conversation.status)}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">
                      {conversation.client_name}
                    </span>
                    {conversation.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs px-1 py-0">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTime(conversation.last_message_at)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Panel principal - Chat */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-full flex flex-col">
              {/* Header conversation */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="lg:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                      <CardTitle className="text-lg">{selectedConversation.subject}</CardTitle>
                      <CardDescription>
                        {selectedConversation.client_name} • {selectedConversation.client_email}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedConversation.status)}
                    
                    <Select 
                      value={selectedConversation.status} 
                      onValueChange={(status) => updateConversationStatus(selectedConversation.id, status)}
                    >
                      <SelectTrigger className="w-auto">
                        <MoreVertical className="w-4 h-4" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Marquer active</SelectItem>
                        <SelectItem value="closed">Fermer</SelectItem>
                        <SelectItem value="archived">Archiver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex ${message.is_admin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.is_admin 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.message_text}</p>
                        <div className="flex items-center gap-1 mt-2 opacity-75">
                          <span className="text-xs">
                            {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                          </span>
                          {message.is_admin && (
                            message.is_read ? 
                              <CheckCheck className="w-3 h-3" /> : 
                              <Check className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Zone de saisie */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                    className="flex-1 min-h-[60px] resize-none"
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
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Sélectionnez une conversation</h3>
                <p className="text-muted-foreground">
                  Choisissez une conversation dans la liste pour commencer à échanger
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}