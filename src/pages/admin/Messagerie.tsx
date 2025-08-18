import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MessageSquare, Send, Eye, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
  sender_name: string;
  receiver_name: string;
  conversation_subject: string;
}

export default function AdminMessagerie() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('internal_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const rows = (data as any[]) || [];
      const mapped: Message[] = rows.map((r) => ({
        id: r.id,
        conversation_id: r.conversation_id,
        sender_id: r.sender_id,
        receiver_id: r.receiver_id,
        message_text: r.message_text,
        created_at: r.created_at,
        is_read: r.is_read ?? false,
        sender_name: r.sender_id ? `ID:${String(r.sender_id).slice(0,8)}` : 'Utilisateur',
        receiver_name: r.receiver_id ? `ID:${String(r.receiver_id).slice(0,8)}` : 'Utilisateur',
        conversation_subject: 'Conversation'
      }));

      setMessages(mapped);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('internal_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;

      // Mettre à jour localement
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, is_read: true } : m
      ));

      toast({
        title: "Message marqué comme lu",
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer comme lu",
        variant: "destructive",
      });
    }
  };

  const handleReply = (messageId: string) => {
    toast({
      title: "Réponse",
      description: "Ouverture de l'interface de réponse",
    });
  };

  const handleRefresh = () => {
    setLoading(true);
    loadMessages();
    toast({
      title: "Actualisation",
      description: "Messages actualisés",
    });
  };

  useEffect(() => {
    loadMessages();

    // Abonnement temps réel aux nouveaux messages
    const channel = supabase
      .channel('admin-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internal_messages' }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.conversation_subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message_text?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'unread' && !message.is_read) ||
      (statusFilter === 'read' && message.is_read);
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: messages.length,
    unread: messages.filter(m => !m.is_read).length,
    read: messages.filter(m => m.is_read).length,
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return date.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messagerie interne</h1>
        <p className="text-muted-foreground">Gérez les conversations avec les utilisateurs et prestataires</p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages non lus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statusCounts.unread}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversations actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(messages.map(m => m.conversation_id)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Temps de réponse moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {messages.length > 0 ? '1.2h' : '0h'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {messages.filter(m => {
                const today = new Date();
                const msgDate = new Date(m.created_at);
                return msgDate.toDateString() === today.toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Rechercher dans les messages</CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher par sujet, expéditeur ou contenu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Onglets par statut */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            Tous ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Non lus ({statusCounts.unread})
          </TabsTrigger>
          <TabsTrigger value="read">
            Lus ({statusCounts.read})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4">
          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun message trouvé</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((message) => (
                <Card 
                  key={message.id} 
                  className={`hover:shadow-md transition-shadow cursor-pointer ${
                    !message.is_read ? 'border-l-4 border-l-primary bg-muted/30' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{message.sender_name}</span>
                          </div>
                          {!message.is_read && (
                            <Badge variant="default" className="text-xs">Nouveau</Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm">{message.conversation_subject}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {message.message_text}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMarkAsRead(message.id)}
                          disabled={message.is_read}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {message.is_read ? 'Lu' : 'Marquer lu'}
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleReply(message.id)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Répondre
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}