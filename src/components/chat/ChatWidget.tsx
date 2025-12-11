import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X } from 'lucide-react';
import { RealtimeChat } from './RealtimeChat';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ChatWidgetProps {
  bookingId: string;
  otherUserId: string;
  otherUserName: string;
}

export const ChatWidget = ({ bookingId, otherUserId, otherUserName }: ChatWidgetProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    loadUnreadCount();
    const cleanup = setupRealtimeSubscription();

    return () => {
      cleanup?.();
    };
  }, [user, bookingId]);

  const loadUnreadCount = async () => {
    if (!user) return;

    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('booking_id', bookingId)
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    setUnreadCount(count || 0);
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel(`chat-unread-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `booking_id=eq.${bookingId}`
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
        <div className="fixed bottom-4 right-4 w-80 sm:w-96 z-50 shadow-2xl rounded-lg overflow-hidden">
          <RealtimeChat
            bookingId={bookingId}
            otherUserId={otherUserId}
            otherUserName={otherUserName}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  );
};
