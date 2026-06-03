import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Users, Calendar, MessageSquare, Bell, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCounts } from "@/hooks/useAdminCounts";

interface RealtimeEvent {
  id: string;
  type: 'booking' | 'message' | 'registration' | 'payment';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface RealtimeData {
  stats: { activeUsers: number; pendingBookings: number; unreadMessages: number; systemLoad: number; };
  events: RealtimeEvent[];
}

async function fetchRealtimeData(): Promise<RealtimeData> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: activeUsers },
    { count: pendingBookings },
    { count: unreadMessages },
    { count: todayBookings },
    { data: recentBookings },
    { data: recentApplications },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('last_login', thirtyDaysAgo),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('internal_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_date', new Date().toISOString().split('T')[0]),
    supabase.from('bookings').select('id, created_at, status, client_id, profiles!bookings_client_id_fkey(first_name, last_name)').order('created_at', { ascending: false }).limit(3),
    supabase.from('job_applications').select('id, created_at, first_name, last_name, status').order('created_at', { ascending: false }).limit(2),
  ]);

  const events: RealtimeEvent[] = [];

  recentBookings?.forEach((booking: any) => {
    events.push({
      id: booking.id,
      type: 'booking',
      title: booking.status === 'pending' ? 'Nouvelle réservation' : 'Réservation mise à jour',
      description: booking.profiles ? `${booking.profiles.first_name || ''} ${booking.profiles.last_name || ''}`.trim() || 'Client' : 'Client',
      timestamp: new Date(booking.created_at),
      status: booking.status === 'pending' ? 'warning' : 'success',
    });
  });

  recentApplications?.forEach((app) => {
    events.push({
      id: app.id,
      type: 'registration',
      title: 'Nouvelle candidature',
      description: `${app.first_name} ${app.last_name} a postulé comme prestataire`,
      timestamp: new Date(app.created_at),
      status: app.status === 'pending' ? 'info' : 'success',
    });
  });

  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return {
    stats: {
      activeUsers: activeUsers || 0,
      pendingBookings: pendingBookings || 0,
      unreadMessages: unreadMessages || 0,
      systemLoad: Math.min(100, (todayBookings || 0) * 5),
    },
    events: events.slice(0, 5),
  };
}

const getEventIcon = (type: RealtimeEvent['type']) => {
  switch (type) {
    case 'booking': return Calendar;
    case 'message': return MessageSquare;
    case 'registration': return Users;
    case 'payment': return Activity;
    default: return Bell;
  }
};

const getStatusColor = (status: RealtimeEvent['status']) => {
  switch (status) {
    case 'success': return 'bg-green-500';
    case 'warning': return 'bg-yellow-500';
    case 'error': return 'bg-red-500';
    case 'info': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

const formatTime = (date: Date): string => {
  const diffInMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
  if (diffInMinutes < 1) return "à l'instant";
  if (diffInMinutes < 60) return `il y a ${diffInMinutes}min`;
  return `il y a ${Math.floor(diffInMinutes / 60)}h`;
};

const AdminRealtime = () => {
  const navigate = useNavigate();
  const { refetch: refetchCounts } = useAdminCounts();

  const { data, isLoading: loading, refetch } = useQuery<RealtimeData>({
    queryKey: ['admin-realtime'],
    queryFn: fetchRealtimeData,
  });

  const stats = data?.stats ?? { activeUsers: 0, pendingBookings: 0, unreadMessages: 0, systemLoad: 0 };
  const events = data?.events ?? [];

  const refreshData = () => {
    refetch();
    refetchCounts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Temps Réel</h1>
          <p className="text-muted-foreground">Monitoring en direct de l'activité</p>
        </div>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/admin/clients')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.activeUsers}</div>
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-muted-foreground">30 derniers jours</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/admin/missions')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations en attente</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.pendingBookings}</div>
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-xs text-muted-foreground">À traiter</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/admin/messages')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages non lus</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.unreadMessages}</div>
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <span className="text-xs text-muted-foreground">Nécessitent attention</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activité aujourd'hui</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : `${stats.systemLoad}%`}</div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.systemLoad}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activité en temps réel</CardTitle>
          <CardDescription>Événements récents sur la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => {
              const IconComponent = getEventIcon(event.type);
              return (
                <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(event.status)}`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <span className="text-xs text-muted-foreground">{formatTime(event.timestamp)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRealtime;
