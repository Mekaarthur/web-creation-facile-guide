import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LiveNotification {
  id: string;
  title: string;
  message: string;
  type: 'new_request' | 'urgent_request' | 'conversion';
  timestamp: string;
  data?: any;
}

export const LiveRequestNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Écouter les nouvelles demandes en temps réel
    const channel = supabase
      .channel('live-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_requests'
        },
        (payload) => {
          const newRequest = payload.new;
          const notification: LiveNotification = {
            id: newRequest.id,
            title: 'Nouvelle demande client',
            message: `${newRequest.client_name} recherche: ${newRequest.service_type} à ${newRequest.location}`,
            type: newRequest.urgency_level === 'urgent' ? 'urgent_request' : 'new_request',
            timestamp: new Date().toISOString(),
            data: newRequest
          };

          setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Garder max 5 notifications
          setIsVisible(true);

          // Toast pour les demandes urgentes
          if (newRequest.urgency_level === 'urgent') {
            toast({
              title: "🚨 Demande urgente",
              description: `${newRequest.client_name} - ${newRequest.service_type}`,
              duration: 10000,
            });
          }

          // Son de notification (optionnel)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Nouvelle demande Bikawô', {
              body: notification.message,
              icon: '/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png'
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'client_requests'
        },
        (payload) => {
          const updatedRequest = payload.new;
          if (updatedRequest.status === 'converted') {
            const notification: LiveNotification = {
              id: `conversion-${updatedRequest.id}`,
              title: 'Conversion réussie',
              message: `Demande de ${updatedRequest.client_name} convertie en mission`,
              type: 'conversion',
              timestamp: new Date().toISOString(),
              data: updatedRequest
            };

            setNotifications(prev => [notification, ...prev.slice(0, 4)]);
            setIsVisible(true);
          }
        }
      )
      .subscribe();

    // Demander la permission pour les notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleNotificationClick = (notification: LiveNotification) => {
    // Rediriger vers la page de gestion des demandes
    navigate('/gestion-demandes');
    removeNotification(notification.id);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notifications.length <= 1) {
      setIsVisible(false);
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'urgent_request':
        return 'border-l-4 border-l-red-500 bg-red-50';
      case 'conversion':
        return 'border-l-4 border-l-green-500 bg-green-50';
      default:
        return 'border-l-4 border-l-blue-500 bg-blue-50';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent_request':
        return '🚨';
      case 'conversion':
        return '✅';
      default:
        return '🔔';
    }
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 w-96 space-y-2">
      {notifications.map((notification) => (
        <Card 
          key={notification.id} 
          className={`animate-slide-in-right cursor-pointer hover:shadow-lg transition-all duration-300 ${getNotificationStyle(notification.type)}`}
          onClick={() => handleNotificationClick(notification)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <h4 className="font-semibold text-sm">{notification.title}</h4>
                  {notification.type === 'urgent_request' && (
                    <Badge variant="destructive" className="text-xs">URGENT</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.timestamp).toLocaleTimeString('fr-FR')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Voir
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {notifications.length > 1 && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-xs"
          >
            Masquer toutes ({notifications.length})
          </Button>
        </div>
      )}
    </div>
  );
};