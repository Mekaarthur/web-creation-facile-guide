import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Conversation {
  id: string;
  booking_id: string;
  client_id: string;
  provider_id: string;
  last_message_at: string;
  status: string;
  other_user_name: string;
  unread_count: number;
  last_message?: string;
}

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  embedded?: boolean;
}

async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*, bookings(id, services(name))')
    .or(`client_id.eq.${userId},provider_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (error) throw error;

  return Promise.all(
    (data || []).map(async (conv) => {
      const otherUserId = conv.client_id === userId ? conv.provider_id : conv.client_id;

      const [{ data: profile }, { count }, { data: lastMsg }] = await Promise.all([
        supabase.from('profiles').select('first_name, last_name').eq('user_id', otherUserId).single(),
        supabase.from('chat_messages').select('*', { count: 'exact', head: true })
          .eq('booking_id', conv.booking_id).eq('receiver_id', userId).eq('is_read', false),
        supabase.from('chat_messages').select('message').eq('booking_id', conv.booking_id)
          .order('created_at', { ascending: false }).limit(1).single(),
      ]);

      return {
        ...conv,
        other_user_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Utilisateur',
        unread_count: count || 0,
        last_message: lastMsg?.message,
      };
    })
  );
}

export const ConversationList = ({ onSelectConversation, embedded = false }: ConversationListProps) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations', user?.id],
    queryFn: () => fetchConversations(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('conversations-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' },
        () => qc.invalidateQueries({ queryKey: ['conversations', user.id] }))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => qc.invalidateQueries({ queryKey: ['conversations', user.id] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  if (isLoading) {
    return (
      <div className={`${embedded ? 'h-full' : 'h-96'} flex items-center justify-center`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const content = (
    <ScrollArea className={embedded ? 'h-full' : 'h-80'}>
      {conversations.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune conversation</p>
        </div>
      ) : (
        <div className="divide-y">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className="w-full p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {conv.other_user_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{conv.other_user_name}</p>
                    {conv.last_message_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(conv.last_message_at), 'HH:mm', { locale: fr })}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                  )}
                </div>
                {conv.unread_count > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center rounded-full text-xs">
                    {conv.unread_count}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </ScrollArea>
  );

  if (embedded) return content;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Mes conversations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">{content}</CardContent>
    </Card>
  );
};
