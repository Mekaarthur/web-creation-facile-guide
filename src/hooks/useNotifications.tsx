import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'booking_request' | 'booking_accepted' | 'booking_rejected' | 'booking_cancelled' | 'payment_processed';
  is_read: boolean;
  created_at: string;
  booking_id?: string;
}

const QUERY_KEY = (userId: string) => ['notifications', userId] as const;

export const useNotifications = () => {
  const qc = useQueryClient();

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  };

  // Initial fetch via useQuery
  const { data: notifications = [], isLoading: loading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const userId = await getUserId();
      if (!userId) return [] as Notification[];

      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    staleTime: 60 * 1000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Realtime subscription — must stay in useEffect
  useEffect(() => {
    let channel: any;

    const setup = async () => {
      const userId = await getUserId();
      if (!userId) return;

      channel = supabase
        .channel('notifications-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload: any) => {
          qc.setQueryData<Notification[]>(['notifications'], prev => [payload.new as Notification, ...(prev ?? [])]);
          if ('Notification' in window && Notification.permission === 'granted') {
            const n = payload.new as Notification;
            new Notification(n.title, { body: n.message, icon: '/favicon.ico' });
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload: any) => {
          qc.setQueryData<Notification[]>(['notifications'], prev =>
            (prev ?? []).map(n => n.id === payload.new.id ? payload.new as Notification : n)
          );
        })
        .subscribe();
    };

    setup();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [qc]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await (supabase as any).from('notifications').update({ is_read: true }).eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: (_data, notificationId) => {
      qc.setQueryData<Notification[]>(['notifications'], prev =>
        (prev ?? []).map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const userId = await getUserId();
      if (!userId) return;
      const { error } = await (supabase as any).from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.setQueryData<Notification[]>(['notifications'], prev =>
        (prev ?? []).map(n => ({ ...n, is_read: true }))
      );
    },
  });

  const createNotification = async (userId: string, title: string, message: string, type: Notification['type'], bookingId?: string) => {
    const { error } = await (supabase as any).from('notifications').insert([{ user_id: userId, title, message, type, booking_id: bookingId }]);
    if (error) console.error('Erreur lors de la création de notification:', error);
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
    return false;
  };

  const showPushNotification = (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { icon: '/pwa-192x192.png', badge: '/pwa-192x192.png', ...options });
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    createNotification,
    requestNotificationPermission,
    loadNotifications: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    showPushNotification,
    isPushSupported: 'Notification' in window,
    pushPermission: 'Notification' in window ? Notification.permission : 'denied' as NotificationPermission,
  };
};
