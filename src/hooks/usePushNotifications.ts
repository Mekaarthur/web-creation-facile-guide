import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supported = 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Non supporté",
        description: "Votre navigateur ne supporte pas les notifications push",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Notifications activées",
          description: "Vous recevrez désormais des notifications en temps réel"
        });
        return true;
      } else if (result === 'denied') {
        toast({
          title: "Notifications refusées",
          description: "Vous pouvez les réactiver dans les paramètres de votre navigateur",
          variant: "destructive"
        });
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      return;
    }

    try {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [permission]);

  return {
    permission,
    isSupported,
    loading,
    requestPermission,
    showNotification,
    isEnabled: permission === 'granted'
  };
};
