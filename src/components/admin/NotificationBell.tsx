import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const QUERY_KEY = (userId: string) => ['admin-notification-count', userId] as const;

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: QUERY_KEY(user?.id ?? ''),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('realtime_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!user) return;
    const qKey = QUERY_KEY(user.id);
    const channel = supabase
      .channel('admin-notification-bell')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'realtime_notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        qc.invalidateQueries({ queryKey: qKey });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate('/modern-admin/notifications')}
      className="relative"
      title="Voir les notifications"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-red-500 text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};
