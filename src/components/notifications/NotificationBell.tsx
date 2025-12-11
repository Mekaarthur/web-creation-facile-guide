import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Bell, BellRing } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import NotificationCenter from './NotificationCenter';
import { cn } from '@/lib/utils';

export const NotificationBell = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      subscribeToNotifications();
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setUnreadCount(count || 0);
  };

  const subscribeToNotifications = () => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-bell')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setUnreadCount(prev => prev + 1);
          setHasNewNotification(true);
          
          // Afficher une notification native si autorisé
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = payload.new as any;
            new Notification(notification.title || 'Nouvelle notification', {
              body: notification.message,
              icon: '/pwa-icon-192.png',
              tag: notification.id
            });
          }

          // Animation
          setTimeout(() => setHasNewNotification(false), 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setHasNewNotification(false);
    }
  };

  if (!user) return null;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            hasNewNotification && "animate-bounce"
          )}
        >
          {hasNewNotification ? (
            <BellRing className="h-5 w-5 text-primary" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          <NotificationCenter />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationBell;
