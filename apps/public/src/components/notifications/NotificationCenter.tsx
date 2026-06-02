import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  Calendar, 
  MessageSquare, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Trash2,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  booking_id?: string;
}

interface NotificationPreferences {
  missionReminders: boolean;
  newMessages: boolean;
  statusUpdates: boolean;
  promotions: boolean;
}

export const NotificationCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    missionReminders: true,
    newMessages: true,
    statusUpdates: true,
    promotions: false
  });

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
    loadNotifications();
    loadPreferences();
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = () => {
    const saved = localStorage.getItem('notification_preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  };

  const savePreferences = (newPrefs: NotificationPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('notification_preferences', JSON.stringify(newPrefs));
    toast({
      title: "Préférences sauvegardées",
      description: "Vos paramètres de notification ont été mis à jour"
    });
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Non supporté",
        description: "Les notifications ne sont pas supportées sur ce navigateur",
        variant: "destructive"
      });
      return;
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);

    if (permission === 'granted') {
      toast({
        title: "Notifications activées ! 🔔",
        description: "Vous recevrez désormais des alertes en temps réel"
      });
      
      // Envoyer une notification de test
      new Notification('Bikawo - Notifications activées', {
        body: 'Vous recevrez maintenant des rappels pour vos missions',
        icon: '/pwa-icon-192.png',
        tag: 'welcome'
      });
    } else {
      toast({
        title: "Notifications bloquées",
        description: "Vous pouvez les activer dans les paramètres de votre navigateur",
        variant: "destructive"
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({ title: "Toutes les notifications marquées comme lues" });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
      case 'mission':
        return <Calendar className="w-4 h-4 text-primary" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'alert':
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Centre de notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Gérez vos alertes et rappels</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status des notifications push */}
        <div className={cn(
          "p-4 rounded-lg flex items-center justify-between",
          permissionStatus === 'granted' 
            ? "bg-emerald-50 dark:bg-emerald-950/30" 
            : "bg-amber-50 dark:bg-amber-950/30"
        )}>
          <div className="flex items-center gap-3">
            {permissionStatus === 'granted' ? (
              <Bell className="w-5 h-5 text-emerald-600" />
            ) : (
              <BellOff className="w-5 h-5 text-amber-600" />
            )}
            <div>
              <p className="font-medium">
                {permissionStatus === 'granted' 
                  ? 'Notifications activées' 
                  : 'Notifications désactivées'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {permissionStatus === 'granted'
                  ? 'Vous recevez des alertes en temps réel'
                  : 'Activez pour ne rien manquer'
                }
              </p>
            </div>
          </div>
          {permissionStatus !== 'granted' && (
            <Button onClick={requestPermission} size="sm">
              Activer
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="unread">
              Non lues {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {notifications.length > 0 && (
              <div className="flex justify-end mb-3">
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Tout marquer comme lu
                </Button>
              </div>
            )}
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50",
                        !notification.is_read && "bg-primary/5 border-primary/20"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              "text-sm truncate",
                              !notification.is_read && "font-medium"
                            )}>
                              {notification.title}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="mt-4">
            <ScrollArea className="h-[400px]">
              {notifications.filter(n => !n.is_read).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Toutes les notifications sont lues</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.filter(n => !n.is_read).map(notification => (
                    <div
                      key={notification.id}
                      className="p-3 rounded-lg border bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Choisissez les types de notifications que vous souhaitez recevoir
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Rappels de missions</p>
                    <p className="text-xs text-muted-foreground">24h et 1h avant chaque mission</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.missionReminders}
                  onCheckedChange={(checked) => 
                    savePreferences({ ...preferences, missionReminders: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Nouveaux messages</p>
                    <p className="text-xs text-muted-foreground">Messages de vos prestataires/clients</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.newMessages}
                  onCheckedChange={(checked) => 
                    savePreferences({ ...preferences, newMessages: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="font-medium">Mises à jour de statut</p>
                    <p className="text-xs text-muted-foreground">Confirmations et changements de réservation</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.statusUpdates}
                  onCheckedChange={(checked) => 
                    savePreferences({ ...preferences, statusUpdates: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-medium">Promotions</p>
                    <p className="text-xs text-muted-foreground">Offres spéciales et actualités</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.promotions}
                  onCheckedChange={(checked) => 
                    savePreferences({ ...preferences, promotions: checked })
                  }
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
