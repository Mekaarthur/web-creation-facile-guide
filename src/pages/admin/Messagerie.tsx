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
        .select(`
          *,
          internal_conversations (subject)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Simuler des données avec noms pour la démo
      const mockMessages: Message[] = [
        {
          id: '1',
          conversation_id: 'conv1',
          sender_id: 'user1',
          receiver_id: 'admin1',
          message_text: 'Bonjour, j\'ai un problème avec ma dernière mission.',
          created_at: new Date().toISOString(),
          is_read: false,
          sender_name: 'Marie Dupont',
          receiver_name: 'Admin',
          conversation_subject: 'Problème mission #123'
        },
        {
          id: '2',
          conversation_id: 'conv2',
          sender_id: 'provider1',
          receiver_id: 'admin1',
          message_text: 'Pouvez-vous valider mes nouveaux documents ?',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          is_read: true,
          sender_name: 'Jean Martin',
          receiver_name: 'Admin',
          conversation_subject: 'Validation documents'
        },
        {
          id: '3',
          conversation_id: 'conv3',
          sender_id: 'user2',
          receiver_id: 'admin1',
          message_text: 'Le prestataire n\'est pas venu au rendez-vous.',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          is_read: false,
          sender_name: 'Sophie Laurent',
          receiver_name: 'Admin',
          conversation_subject: 'Absence prestataire'
        },
      ];

      setMessages(mockMessages);
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

  useEffect(() => {
    loadMessages();
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
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Temps de réponse moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rechercher dans les messages</CardTitle>
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
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Voir
                        </Button>
                        <Button variant="default" size="sm">
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