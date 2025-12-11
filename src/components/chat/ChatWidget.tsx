import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, ArrowLeft } from 'lucide-react';
import { RealtimeChat } from './RealtimeChat';
import { ConversationList } from './ConversationList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ChatWidgetProps {
  bookingId?: string;
  otherUserId?: string;
  otherUserName?: string;
}

interface SelectedConversation {
  bookingId: string;
  otherUserId: string;
  otherUserName: string;
}

interface Conversation {
  id: string;
  booking_id: string;
  client_id: string;
  provider_id: string;
  other_user_name: string;
}

export const ChatWidget = ({ bookingId, otherUserId, otherUserName }: ChatWidgetProps = {}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState<SelectedConversation | null>(
    bookingId && otherUserId && otherUserName 
      ? { bookingId, otherUserId, otherUserName } 
      : null
  );

  // If props are provided, use them directly
  const hasDirectConversation = bookingId && otherUserId && otherUserName;

  useEffect(() => {
    if (!user) return;

    loadUnreadCount();
    const cleanup = setupRealtimeSubscription();

    return () => {
      cleanup?.();
    };
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;

    const query = supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    const { count } = await query;
    setUnreadCount(count || 0);
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('chat-unread-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSelectConversation = (conv: Conversation) => {
    if (!user) return;
    const otherUserId = conv.client_id === user.id ? conv.provider_id : conv.client_id;
    setSelectedConversation({
      bookingId: conv.booking_id,
      otherUserId,
      otherUserName: conv.other_user_name
    });
  };

  const handleBack = () => {
    if (!hasDirectConversation) {
      setSelectedConversation(null);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-80 sm:w-96 h-[500px] z-50 shadow-2xl rounded-lg overflow-hidden bg-background border flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              {selectedConversation && !hasDirectConversation && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <h3 className="font-semibold">
                {selectedConversation ? selectedConversation.otherUserName : 'Messages'}
              </h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {selectedConversation ? (
              <RealtimeChat
                bookingId={selectedConversation.bookingId}
                otherUserId={selectedConversation.otherUserId}
                otherUserName={selectedConversation.otherUserName}
              />
            ) : (
              <ConversationList onSelectConversation={handleSelectConversation} embedded />
            )}
          </div>
        </div>
      )}
    </>
  );
};
