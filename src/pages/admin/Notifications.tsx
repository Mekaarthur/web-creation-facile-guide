import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search,
  Bell,
  User,
  Calendar,
  CreditCard,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Trash2,
  CheckCheck,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'resolved';
  created_at: string;
  user_id: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  high_priority: number;
  resolved_today: number;
}

async function fetchNotifications(typeFilter: string, priorityFilter: string): Promise<AdminNotification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('realtime_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (typeFilter !== 'all') query = query.eq('type', typeFilter);
  if (priorityFilter !== 'all') query = query.eq('priority', priorityFilter);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(n => {
    const validPriority = ['low', 'normal', 'high', 'urgent'].includes(n.priority)
      ? n.priority as 'low' | 'normal' | 'high' | 'urgent'
      : 'normal';
    return {
      ...n,
      priority: validPriority,
      status: n.is_read ? 'read' as const : 'unread' as const,
    };
  });
}

async function fetchNotificationStats(): Promise<NotificationStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total: 0, unread: 0, high_priority: 0, resolved_today: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [allNotifs, unreadNotifs, highPriorityNotifs, resolvedToday] = await Promise.all([
    supabase.from('realtime_notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('realtime_notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
    supabase.from('realtime_notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('priority', ['high', 'urgent']),
    supabase.from('realtime_notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', true).gte('updated_at', today.toISOString()),
  ]);

  return {
    total: allNotifs.count || 0,
    unread: unreadNotifs.count || 0,
    high_priority: highPriorityNotifs.count || 0,
    resolved_today: resolvedToday.count || 0,
  };
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'new_user':
    case 'new_client':
      return <User className="w-4 h-4 text-blue-600" />;
    case 'new_provider':
    case 'provider_application':
      return <UserCheck className="w-4 h-4 text-green-600" />;
    case 'booking':
    case 'booking_confirmed':
    case 'booking_cancelled':
      return <Calendar className="w-4 h-4 text-purple-600" />;
    case 'payment':
    case 'payment_success':
    case 'payment_failed':
      return <CreditCard className="w-4 h-4 text-emerald-600" />;
    case 'new_message':
    case 'conversation_alert':
      return <MessageSquare className="w-4 h-4 text-orange-600" />;
    case 'system':
    case 'emergency_escalated':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case 'moderation':
      return <ShieldAlert className="w-4 h-4 text-yellow-600" />;
    default:
      return <Bell className="w-4 h-4 text-gray-600" />;
  }
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'new_user': '🧍 Nouvel utilisateur',
    'new_client': '👩‍🦰 Nouveau client',
    'new_provider': '🧑‍💼 Nouveau prestataire',
    'provider_application': '📋 Candidature prestataire',
    'booking': '📅 Réservation',
    'booking_confirmed': '✅ Réservation confirmée',
    'booking_cancelled': '❌ Réservation annulée',
    'payment': '💳 Paiement',
    'payment_success': '💰 Paiement réussi',
    'payment_failed': '⚠️ Paiement échoué',
    'new_message': '📩 Nouveau message',
    'conversation_alert': '🚨 Alerte conversation',
    'system': '⚙️ Système',
    'emergency_escalated': '🚨 URGENCE',
    'moderation': '🛡️ Modération',
  };
  return labels[type] || type;
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return <Badge className="bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200">🔴 Urgent</Badge>;
    case 'high':
      return <Badge className="bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200">🟠 Important</Badge>;
    case 'normal':
      return <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">🔵 Normal</Badge>;
    case 'low':
      return <Badge variant="outline">⚪ Faible</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
};

const getStatusBadge = (_status: string, is_read: boolean) => {
  if (!is_read) {
    return <Badge className="bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200">🟡 Non lue</Badge>;
  }
  return <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">⚪ Lue</Badge>;
};

export default function AdminNotifications() {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading: loading, refetch } = useQuery<AdminNotification[]>({
    queryKey: ['admin-notifications', typeFilter, priorityFilter],
    queryFn: () => fetchNotifications(typeFilter, priorityFilter),
  });

  const { data: stats } = useQuery<NotificationStats>({
    queryKey: ['admin-notifications-stats'],
    queryFn: fetchNotificationStats,
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'realtime_notifications' }, () => {
        qc.invalidateQueries({ queryKey: ['admin-notifications'] });
        qc.invalidateQueries({ queryKey: ['admin-notifications-stats'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['admin-notifications'] });
    qc.invalidateQueries({ queryKey: ['admin-notifications-stats'] });
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('realtime_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
      invalidateAll();
    } catch {
      toast({ title: "Erreur", description: "Impossible de marquer comme lu", variant: "destructive" });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('realtime_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
      toast({ title: "Notifications marquées comme lues", description: "Toutes les notifications ont été marquées comme lues" });
      invalidateAll();
    } catch {
      toast({ title: "Erreur", description: "Impossible de marquer toutes comme lues", variant: "destructive" });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('realtime_notifications')
        .delete()
        .eq('id', notificationId);
      if (error) throw error;
      toast({ title: "Notification supprimée", description: "La notification a été supprimée avec succès" });
      invalidateAll();
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer la notification", variant: "destructive" });
    }
  };

  const handleNotificationClick = (notification: AdminNotification) => {
    if (!notification.is_read) markAsRead(notification.id);
    if (notification.data) {
      const { conversation_id, booking_id, user_id, payment_id } = notification.data;
      if (conversation_id) navigate(`/modern-admin/messages?conversation=${conversation_id}`);
      else if (booking_id) navigate(`/modern-admin/bookings?booking=${booking_id}`);
      else if (user_id) navigate(`/modern-admin/users?user=${user_id}`);
      else if (payment_id) navigate(`/modern-admin/payments?payment=${payment_id}`);
    }
  };

  const filteredNotifications = notifications
    .filter(n => statusFilter === 'all' || (statusFilter === 'unread' ? !n.is_read : n.is_read))
    .filter(n =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading && notifications.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">🔔 Notifications</h1>
        <p className="text-muted-foreground">Suivi des événements importants de la plateforme</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Notifications totales</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                Non lues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.unread}</div>
              <p className="text-xs text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                Prioritaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.high_priority}</div>
              <p className="text-xs text-muted-foreground">Haute priorité</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Traitées (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolved_today}</div>
              <p className="text-xs text-muted-foreground">Aujourd'hui</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recherche et filtres</CardTitle>
            <div className="flex items-center gap-2">
              {stats && stats.unread > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Tout marquer comme lu
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="new_user">Nouvel utilisateur</SelectItem>
                <SelectItem value="new_provider">Nouveau prestataire</SelectItem>
                <SelectItem value="provider_application">Candidature</SelectItem>
                <SelectItem value="booking">Réservation</SelectItem>
                <SelectItem value="payment">Paiement</SelectItem>
                <SelectItem value="new_message">Message</SelectItem>
                <SelectItem value="conversation_alert">Alerte conversation</SelectItem>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="moderation">Modération</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="unread">Non lues</SelectItem>
                <SelectItem value="read">Lues</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">Important</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Titre & Message</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune notification</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotifications.map((notification) => (
                  <TableRow
                    key={notification.id}
                    className={`cursor-pointer ${!notification.is_read ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <TableCell>{getNotificationIcon(notification.type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(notification.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(notification.priority)}</TableCell>
                    <TableCell>{getStatusBadge(notification.status, notification.is_read)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                            title="Marquer comme lu"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleNotificationClick(notification); }}
                          title="Voir les détails"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
