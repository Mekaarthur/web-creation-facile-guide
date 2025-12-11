import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils';

interface PushNotificationPromptProps {
  variant?: 'banner' | 'card' | 'minimal';
  onDismiss?: () => void;
}

export const PushNotificationPrompt = ({ 
  variant = 'banner',
  onDismiss 
}: PushNotificationPromptProps) => {
  const { permission, isSupported, requestPermission, loading } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the prompt
    const hasDismissed = localStorage.getItem('push-notification-dismissed');
    if (hasDismissed) {
      setDismissed(true);
    } else {
      // Animate in after mount
      const timer = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      localStorage.setItem('push-notification-dismissed', 'true');
      setDismissed(true);
      onDismiss?.();
    }, 300);
  };

  const handleEnable = async () => {
    const success = await requestPermission();
    if (success) {
      setDismissed(true);
    }
  };

  // Don't show if not supported, already granted, denied, or dismissed
  if (!isSupported || permission !== 'default' || dismissed) {
    return null;
  }

  if (variant === 'minimal') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleEnable}
        disabled={loading}
        className="gap-2"
      >
        <Bell className="h-4 w-4" />
        Activer les notifications
      </Button>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 transition-all duration-300",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/20 rounded-full">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">Restez informé</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Activez les notifications pour être alerté de vos réservations et messages en temps réel.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleEnable} disabled={loading}>
                {loading ? 'Activation...' : 'Activer'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Plus tard
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Banner variant (default)
  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground py-3 px-4 shadow-lg transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"
      )}
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 animate-pulse" />
          <p className="text-sm font-medium">
            Activez les notifications pour ne manquer aucune réservation !
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleEnable}
            disabled={loading}
          >
            {loading ? 'Activation...' : 'Activer'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-primary-foreground hover:text-primary-foreground/80"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationPrompt;
