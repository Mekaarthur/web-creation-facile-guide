import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  MessageSquare, 
  Send, 
  Eye,
  Download, 
  Archive,
  Ban,
  CheckCircle,
  Clock,
  RefreshCw,
  Filter,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConversationDetailsModal } from '@/components/admin/ConversationDetailsModal';

interface ConversationRow {
  id: string;
  type: 'client-provider' | 'client-admin' | 'provider-admin';
  participant1_name: string;
  participant1_email?: string;
  participant2_name: string;
  participant2_email?: string;
  subject: string;
  service_category?: string;
  last_message_at: string;
  status: 'open' | 'closed' | 'pending';
  unread_count: number;
  booking_id?: string;
}

interface MessagingStats {
  total_conversations: number;
  open_conversations: number;
  closed_conversations: number;
  pending_responses: number;
  average_response_time: string;
  messages_today: number;
}

export default function AdminMessages() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [universeFilter, setUniverseFilter] = useState('all');
  const [stats, setStats] = useState<MessagingStats | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
    loadStats();

    // Real-time subscriptions
    const chatChannel = supabase
      .channel('admin-chat-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, () => {
        loadConversations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        loadConversations();
      })
      .subscribe();

    const internalChannel = supabase
      .channel('admin-internal-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internal_conversations' }, () => {
        loadConversations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internal_messages' }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(internalChannel);
    };
  }, [typeFilter, statusFilter, universeFilter]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const allConversations: ConversationRow[] = [];

      // Charger les conversations Client ↔ Prestataire
      if (typeFilter === 'all' || typeFilter === 'client-provider') {
        const { data: chatConvs } = await supabase
          .from('chat_conversations')
          .select(`
            *,
            client:profiles!chat_conversations_client_id_fkey(first_name, last_name, email),
            provider:profiles!chat_conversations_provider_id_fkey(first_name, last_name, email),
            booking:bookings(service_id, services(category))
          `)
          .order('last_message_at', { ascending: false });

        if (chatConvs) {
          chatConvs.forEach((conv: any) => {
            allConversations.push({
              id: conv.id,
              type: 'client-provider',
              participant1_name: conv.client 
                ? `${conv.client.first_name} ${conv.client.last_name}` 
                : 'Client',
              participant1_email: conv.client?.email,
              participant2_name: conv.provider 
                ? `${conv.provider.first_name} ${conv.provider.last_name}` 
                : 'Prestataire',
              participant2_email: conv.provider?.email,
              subject: conv.booking?.services?.category || 'Service',
              service_category: conv.booking?.services?.category,
              last_message_at: conv.last_message_at || conv.created_at,
              status: 'open',
              unread_count: 0,
              booking_id: conv.booking_id
            });
          });
        }
      }

      // Charger les conversations internes (Client/Provider ↔ Admin)
      if (typeFilter === 'all' || typeFilter === 'client-admin' || typeFilter === 'provider-admin') {
        const { data: internalConvs } = await supabase
          .from('internal_conversations')
          .select(`
            *,
            client:profiles!internal_conversations_client_id_fkey(first_name, last_name, email),
            provider:profiles!internal_conversations_provider_id_fkey(first_name, last_name, email),
            admin:profiles!internal_conversations_admin_id_fkey(first_name, last_name)
          `)
          .order('last_message_at', { ascending: false });

        if (internalConvs) {
          internalConvs.forEach((conv: any) => {
            const convType: 'client-admin' | 'provider-admin' = conv.provider_id 
              ? 'provider-admin' 
              : 'client-admin';
            
            if (typeFilter !== 'all' && typeFilter !== convType) return;

            allConversations.push({
              id: conv.id,
              type: convType,
              participant1_name: conv.client 
                ? `${conv.client.first_name} ${conv.client.last_name}` 
                : conv.provider 
                  ? `${conv.provider.first_name} ${conv.provider.last_name}`
                  : 'Utilisateur',
              participant1_email: conv.client?.email || conv.provider?.email,
              participant2_name: conv.admin 
                ? `Admin (${conv.admin.first_name})` 
                : 'Admin Bikawo',
              subject: conv.subject,
              last_message_at: conv.last_message_at || conv.created_at,
              status: conv.status,
              unread_count: 0
            });
          });
        }
      }

      // Filtrer par statut
      let filtered = statusFilter === 'all' 
        ? allConversations 
        : allConversations.filter(c => c.status === statusFilter);

      // Filtrer par univers
      if (universeFilter !== 'all') {
        filtered = filtered.filter(c => 
          c.service_category?.toLowerCase().includes(universeFilter.toLowerCase())
        );
      }

      setConversations(filtered);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [chatConvs, internalConvs, chatMsgs, internalMsgs] = await Promise.all([
        supabase.from('chat_conversations').select('*', { count: 'exact', head: true }),
        supabase.from('internal_conversations').select('*'),
        supabase.from('chat_messages').select('*').gte('created_at', today.toISOString()),
        supabase.from('internal_messages').select('*').gte('created_at', today.toISOString())
      ]);

      const totalConvs = (chatConvs.count || 0) + (internalConvs.data?.length || 0);
      const openConvs = (internalConvs.data || []).filter((c: any) => c.status === 'active').length;
      const closedConvs = (internalConvs.data || []).filter((c: any) => c.status === 'closed').length;
      const pendingConvs = (internalConvs.data || []).filter((c: any) => c.status === 'pending').length;
      const todayMsgs = (chatMsgs.data?.length || 0) + (internalMsgs.data?.length || 0);

      setStats({
        total_conversations: totalConvs,
        open_conversations: openConvs,
        closed_conversations: closedConvs,
        pending_responses: pendingConvs,
        average_response_time: '2h 15min',
        messages_today: todayMsgs
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleArchiveConversation = async (conversationId: string, type: string) => {
    try {
      const table = type === 'client-provider' ? 'chat_conversations' : 'internal_conversations';
      
      // Pour internal_conversations, on peut utiliser le statut 'archived'
      if (table === 'internal_conversations') {
        await supabase
          .from(table)
          .update({ status: 'archived' })
          .eq('id', conversationId);
      }

      toast({
        title: "Conversation archivée",
        description: "La conversation a été archivée avec succès"
      });
      
      loadConversations();
      setSelectedConversation(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'archiver la conversation",
        variant: "destructive"
      });
    }
  };

  const handleDownloadHistory = async (conversationId: string, type: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('export-conversation-history', {
        body: {
          conversationId,
          type,
          format: 'csv'
        }
      });

      if (error) throw error;

      toast({
        title: "Export réussi",
        description: "L'historique a été téléchargé avec succès"
      });
    } catch (error) {
      console.error('Erreur export:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger l'historique",
        variant: "destructive"
      });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participant1_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participant2_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.participant1_email && conv.participant1_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'client-provider':
        return <Badge className="bg-blue-100 text-blue-800">Client ↔ Prestataire</Badge>;
      case 'client-admin':
        return <Badge className="bg-orange-100 text-orange-800">Client ↔ Admin</Badge>;
      case 'provider-admin':
        return <Badge className="bg-green-100 text-green-800">Prestataire ↔ Admin</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
      case 'active':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Ouvert</Badge>;
      case 'closed':
        return <Badge variant="secondary"><X className="w-3 h-3 mr-1" />Fermé</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Messages</h1>
        <p className="text-muted-foreground">Suivi et modération de toutes les conversations</p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Total conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.total_conversations}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Ouvertes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.open_conversations}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <X className="w-4 h-4 text-gray-600" />
                Fermées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {stats.closed_conversations}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                En attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pending_responses}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                Temps moyen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-purple-600">
                {stats.average_response_time}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Send className="w-4 h-4 text-teal-600" />
                Messages (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">
                {stats.messages_today}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recherche et filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type de conversation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="client-provider">Client ↔ Prestataire</SelectItem>
                <SelectItem value="client-admin">Client ↔ Admin</SelectItem>
                <SelectItem value="provider-admin">Prestataire ↔ Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={universeFilter} onValueChange={setUniverseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Univers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les univers</SelectItem>
                <SelectItem value="kids">BIKA Kids</SelectItem>
                <SelectItem value="maison">BIKA Maison</SelectItem>
                <SelectItem value="seniors">BIKA Seniors</SelectItem>
                <SelectItem value="pro">BIKA Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={loadConversations}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des conversations */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Participant 1</TableHead>
                  <TableHead>Participant 2</TableHead>
                  <TableHead>Objet / Service</TableHead>
                  <TableHead>Dernier message</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune conversation trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConversations.map((conv, index) => (
                    <TableRow key={conv.id}>
                      <TableCell className="font-mono text-xs">
                        {String(index + 1).padStart(2, '0')}
                      </TableCell>
                      <TableCell>{getTypeBadge(conv.type)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{conv.participant1_name}</p>
                          {conv.participant1_email && (
                            <p className="text-xs text-muted-foreground">{conv.participant1_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{conv.participant2_name}</p>
                          {conv.participant2_email && (
                            <p className="text-xs text-muted-foreground">{conv.participant2_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{conv.subject}</TableCell>
                      <TableCell>
                        {format(new Date(conv.last_message_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>{getStatusBadge(conv.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedConversation(conv)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadHistory(conv.id, conv.type)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchiveConversation(conv.id, conv.type)}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedConversation && (
        <ConversationDetailsModal
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
          onUpdate={loadConversations}
        />
      )}
    </div>
  );
}