import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Users, Calendar, MessageSquare, Bell, RefreshCw } from "lucide-react";

interface RealtimeEvent {
  id: string;
  type: 'booking' | 'message' | 'registration' | 'payment';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
}

const AdminRealtime = () => {
  const [events, setEvents] = useState<RealtimeEvent[]>([
    {
      id: '1',
      type: 'booking',
      title: 'Nouvelle réservation',
      description: 'Marie Dubois a réservé un service BikaKids',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      status: 'success'
    },
    {
      id: '2',
      type: 'message',
      title: 'Nouveau message',
      description: 'Conversation entre client et prestataire',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'info'
    },
    {
      id: '3',
      type: 'registration',
      title: 'Nouvelle inscription',
      description: 'Jean Martin s\'est inscrit comme prestataire',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      status: 'success'
    },
    {
      id: '4',
      type: 'payment',
      title: 'Paiement échoué',
      description: 'Problème de paiement pour la réservation #1234',
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      status: 'error'
    }
  ]);

  const [stats, setStats] = useState({
    activeUsers: 47,
    pendingBookings: 12,
    unreadMessages: 8,
    systemLoad: 78
  });

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
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "à l'instant";
    if (diffInMinutes < 60) return `il y a ${diffInMinutes}min`;
    return `il y a ${Math.floor(diffInMinutes / 60)}h`;
  };

  const refreshData = () => {
    // Simulation du rafraîchissement des données
    setStats({
      activeUsers: Math.floor(Math.random() * 50) + 30,
      pendingBookings: Math.floor(Math.random() * 20) + 5,
      unreadMessages: Math.floor(Math.random() * 15) + 3,
      systemLoad: Math.floor(Math.random() * 30) + 60
    });
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-muted-foreground">En ligne maintenant</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations en attente</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-xs text-muted-foreground">À traiter</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages non lus</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadMessages}</div>
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <span className="text-xs text-muted-foreground">Nécessitent attention</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Charge système</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemLoad}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
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