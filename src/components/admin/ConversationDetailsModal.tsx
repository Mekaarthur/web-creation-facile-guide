import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  User, 
  Clock,
  Download,
  Archive,
  Ban,
  X,
  CheckCircle,
  AlertCircle,
  Bell,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Message {
  id: string;
  sender_name: string;
  sender_role: 'client' | 'provider' | 'admin';
  message_text: string;
  created_at: string;
  is_read: boolean;
}

interface ConversationDetailsModalProps {
  conversation: {
    id: string;
    type: 'client-provider' | 'client-admin' | 'provider-admin';
    participant1_name: string;
    participant1_email?: string;
    participant2_name: string;
    participant2_email?: string;
    subject: string;
    service_category?: string;
    last_message_at: string;
    status: string;
    booking_id?: string;
  };
  onClose: () => void;
  onUpdate: () => void;
}

export const ConversationDetailsModal = ({ conversation, onClose, onUpdate }: ConversationDetailsModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();

    // Real-time message updates
    const channel = supabase
      .channel(`conversation-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: conversation.type === 'client-provider' ? 'chat_messages' : 'internal_messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      if (conversation.type === 'client-provider') {
        const { data, error } = await supabase
          .from('chat_messages')
          .select(`
            id,
            sender_id,
            message_text,
            created_at,
            is_read,
            sender:profiles!chat_messages_sender_id_fkey(first_name, last_name)
          `)
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const senderIds = [...new Set((data || []).map((m: any) => m.sender_id).filter(Boolean))];
        const roleMap: Record<string, 'client' | 'provider' | 'admin'> = {};

        if (senderIds.length > 0) {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('user_id', senderIds);

          const { data: providerUsers } = await supabase
            .from('providers')
            .select('user_id')
            .in('user_id', senderIds);

          const providerSet = new Set((providerUsers || []).map(p => p.user_id));

          (roles || []).forEach((r: any) => {
            if (r.role === 'admin' || r.role === 'moderator') roleMap[r.user_id] = 'admin';
          });

          senderIds.forEach(id => {
            if (!roleMap[id]) roleMap[id] = providerSet.has(id) ? 'provider' : 'client';
          });
        }

        const formattedMessages = (data || []).map((msg: any) => ({
          id: msg.id,
          sender_name: msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'Utilisateur',
          sender_role: roleMap[msg.sender_id] ?? 'client',
          message_text: msg.message_text,
          created_at: msg.created_at,
          is_read: msg.is_read
        }));

        setMessages(formattedMessages);
      } else {
        const { data, error } = await supabase
          .from('internal_messages')
          .select(`
            id,
            sender_id,
            message_text,
            created_at,
            is_read,
            sender:profiles!internal_messages_sender_id_fkey(first_name, last_name)
          `)
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const senderIds = [...new Set((data || []).map((m: any) => m.sender_id).filter(Boolean))];
        const roleMap: Record<string, 'client' | 'provider' | 'admin'> = {};

        if (senderIds.length > 0) {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('user_id', senderIds);

          (roles || []).forEach((r: any) => {
            if (r.role === 'admin' || r.role === 'moderator') roleMap[r.user_id] = 'admin';
            else if (r.role === 'provider') roleMap[r.user_id] = 'provider';
            else roleMap[r.user_id] = 'client';
          });
        }

        const formattedMessages = (data || []).map((msg: any) => ({
          id: msg.id,
          sender_name: msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'Utilisateur',
          sender_role: roleMap[msg.sender_id] ?? 'admin',
          message_text: msg.message_text,
          created_at: msg.created_at,
          is_read: msg.is_read
        }));

        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive"
      });
    }
  };

  const sendAdminMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      if (conversation.type === 'client-provider') {
        // Pour les conversations client-provider, l'admin ne peut pas directement envoyer
        // On doit créer une internal_conversation ou ajouter un système de modération
        toast({
          title: "Fonction non disponible",
          description: "L'intervention directe dans les conversations client-prestataire sera disponible prochainement",
          variant: "default"
        });
        return;
      }

      // Pour internal_messages
      const { error } = await supabase
        .from('internal_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          receiver_id: conversation.participant1_email === user.email 
            ? conversation.participant2_email 
            : conversation.participant1_email,
          message_text: newMessage,
          message_type: 'text',
          is_read: false
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages();

      await supabase.functions.invoke('monitor-conversation-keywords', {
        body: {
          messageText: newMessage,
          conversationId: conversation.id
        }
      });

      // Envoyer notification email au destinataire
      const receiverId = conversation.participant1_email === (await supabase.auth.getUser()).data.user?.email
        ? conversation.participant2_email
        : conversation.participant1_email;

      if (receiverId) {
        await supabase.functions.invoke('send-message-notification', {
          body: {
            userId: receiverId,
            conversationId: conversation.id,
            senderName: 'Admin Bikawo',
            messagePreview: newMessage.substring(0, 100)
          }
        });
      }

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès"
      });
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConversation = async () => {
    try {
      const table = conversation.type === 'client-provider' 
        ? 'chat_conversations' 
        : 'internal_conversations';
      
      await supabase
        .from(table)
        .update({ status: 'closed' })
        .eq('id', conversation.id);

      toast({
        title: "Conversation fermée",
        description: "La conversation a été fermée avec succès"
      });

      onUpdate();
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de fermer la conversation",
        variant: "destructive"
      });
    }
  };

  const handleArchiveConversation = async () => {
    try {
      if (conversation.type !== 'client-provider') {
        await supabase
          .from('internal_conversations')
          .update({ status: 'archived' })
          .eq('id', conversation.id);

        toast({
          title: "Conversation archivée",
          description: "La conversation a été archivée avec succès"
        });

        onUpdate();
        onClose();
      } else {
        toast({
          title: "Action non disponible",
          description: "L'archivage des conversations client-prestataire n'est pas encore disponible"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'archiver la conversation",
        variant: "destructive"
      });
    }
  };

  const handleDownloadHistory = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('export-conversation-history', {
        body: {
          conversationId: conversation.id,
          type: conversation.type,
          format: 'csv'
        }
      });

      if (error) throw error;

      toast({
        title: "Export réussi",
        description: "L'historique de la conversation a été téléchargé"
      });
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger l'historique",
        variant: "destructive"
      });
    }
  };

  const handleSendNotification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Créer une notification système
      const { error } = await supabase
        .from('realtime_notifications')
        .insert({
          user_id: conversation.participant1_email === user.email 
            ? conversation.participant2_email 
            : conversation.participant1_email,
          type: 'system',
          title: '📢 Notification Bikawo',
          message: 'Un administrateur souhaite attirer votre attention sur cette conversation',
          data: {
            conversation_id: conversation.id,
            from_admin: true
          },
          priority: 'high'
        });

      if (error) throw error;

      toast({
        title: "Notification envoyée",
        description: "L'utilisateur a été notifié"
      });
    } catch (error) {
      console.error('Erreur notification:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la notification",
        variant: "destructive"
      });
    }
  };

  const handleBlockUser = async () => {
    try {
      const userId = conversation.participant1_email; // ou participant2_email selon contexte
      
      // Créer un signalement
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('realtime_notifications')
        .insert({
          user_id: user.id,
          type: 'moderation',
          title: '🚫 Signalement utilisateur',
          message: `Utilisateur ${conversation.participant1_name} signalé pour abus dans conversation ${conversation.id}`,
          data: {
            conversation_id: conversation.id,
            reported_user: userId,
            reporter_admin: user.id
          },
          priority: 'urgent'
        });

      if (error) throw error;

      toast({
        title: "Utilisateur signalé",
        description: "Le signalement a été enregistré pour modération"
      });
    } catch (error) {
      console.error('Erreur signalement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de signaler l'utilisateur",
        variant: "destructive"
      });
    }
  };

  const getTypeBadge = () => {
    switch (conversation.type) {
      case 'client-provider':
        return <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800">Client ↔ Prestataire</Badge>;
      case 'client-admin':
        return <Badge className="bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800">Client ↔ Support</Badge>;
      case 'provider-admin':
        return <Badge className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">Prestataire ↔ Admin</Badge>;
    }
  };

  const getSenderBadge = (role: string) => {
    switch (role) {
      case 'client':
        return <Badge variant="outline" className="bg-blue-50">Client</Badge>;
      case 'provider':
        return <Badge variant="outline" className="bg-green-50">Prestataire</Badge>;
      case 'admin':
        return <Badge variant="default">Admin Bikawo</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Détails de la conversation</DialogTitle>
              <DialogDescription>
                {getTypeBadge()} • {conversation.subject}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSendNotification}
                title="Envoyer une notification système"
              >
                <Bell className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDownloadHistory}
                title="Télécharger l'historique"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBlockUser}
                title="Signaler un abus"
              >
                <ShieldAlert className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleArchiveConversation}
                title="Archiver"
              >
                <Archive className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCloseConversation}
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Info participants */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Participant 1</span>
              </div>
              <p className="font-semibold">{conversation.participant1_name}</p>
              {conversation.participant1_email && (
                <p className="text-sm text-muted-foreground">{conversation.participant1_email}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Participant 2</span>
              </div>
              <p className="font-semibold">{conversation.participant2_name}</p>
              {conversation.participant2_email && (
                <p className="text-sm text-muted-foreground">{conversation.participant2_email}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Aucun message pour le moment
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.sender_role === 'admin'
                      ? 'bg-primary text-primary-foreground'
                      : message.sender_role === 'provider'
                      ? 'bg-green-100 dark:bg-green-950'
                      : 'bg-blue-100 dark:bg-blue-950'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">{message.sender_name}</span>
                    {getSenderBadge(message.sender_role)}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3 h-3 opacity-70" />
                    <span className="text-xs opacity-70">
                      {format(new Date(message.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </span>
                    {message.is_read && (
                      <CheckCircle className="w-3 h-3 opacity-70" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone d'envoi de message */}
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Écrire un message en tant qu'Admin Bikawo..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendAdminMessage();
                }
              }}
              rows={3}
              disabled={loading}
            />
            <Button
              onClick={sendAdminMessage}
              disabled={loading || !newMessage.trim()}
              size="lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Vos messages apparaîtront avec le badge "Admin Bikawo"
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
