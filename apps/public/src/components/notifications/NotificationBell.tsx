import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Bell, BellRing } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationCenter from './NotificationCenter';
import { cn } from '@/lib/utils';

export const NotificationBell = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const prevCountRef = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevCountRef.current && !isOpen) {
      setHasNewNotification(true);
      const t = setTimeout(() => setHasNewNotification(false), 3000);
      prevCountRef.current = unreadCount;
      return () => clearTimeout(t);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, isOpen]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) setHasNewNotification(false);
  };

  if (!user) return null;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', hasNewNotification && 'animate-bounce')}
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
