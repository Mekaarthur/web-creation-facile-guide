import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Clock, 
  UserX, 
  MessageCircle,
  ArrowRight,
  Zap
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Alert {
  id: string;
  type: 'urgent_request' | 'inactive_provider' | 'waiting_client';
  title: string;
  description: string;
  count: number;
  urgency: 'high' | 'medium' | 'low';
  action?: () => void;
  data?: any;
}

export const AdminAlertsPanel = ({ onNavigate }: { onNavigate?: (tab: string) => void }) => {
  const handleNavigate = (route: string) => {
    // Navigation directe vers les routes du modern-admin
    window.location.href = route;
  };
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
    
    // Recharger les alertes toutes les 30 secondes
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      const alertsData: Alert[] = [];

      // 1. Demandes urgentes non attribuées (> 2h)
      const urgentCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2h ago
      const { data: urgentRequests, error: urgentError } = await supabase
        .from('client_requests')
        .select('*')
        .in('status', ['new', 'unmatched'])
        .lt('created_at', urgentCutoff.toISOString());

      if (!urgentError && urgentRequests?.length > 0) {
        alertsData.push({
          id: 'urgent_requests',
          type: 'urgent_request',
          title: 'Demandes urgentes',
          description: `${urgentRequests.length} demande(s) non attribuée(s) depuis plus de 2h`,
          count: urgentRequests.length,
          urgency: 'high',
          action: () => handleNavigate('/modern-admin/missions'),
          data: urgentRequests
        });
      }

      // 2. Prestataires inactifs depuis 7 jours
      const inactiveDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const { data: inactiveProviders, error: inactiveError } = await supabase
        .from('providers')
        .select('*')
        .eq('status', 'active')
        .or(`last_mission_date.is.null,last_mission_date.lt.${inactiveDate.toISOString()}`);

      if (!inactiveError && inactiveProviders?.length > 0) {
        alertsData.push({
          id: 'inactive_providers',
          type: 'inactive_provider',
          title: 'Prestataires inactifs',
          description: `${inactiveProviders.length} prestataire(s) sans mission depuis 7+ jours`,
          count: inactiveProviders.length,
          urgency: 'medium',
          action: () => handleNavigate('/modern-admin/prestataires'),
          data: inactiveProviders
        });
      }

      // 3. Clients en attente de réponse depuis > 24h
      const waitingCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago
      const { data: waitingClients, error: waitingError } = await supabase
        .from('client_requests')
        .select('*')
        .eq('status', 'assigned')
        .lt('updated_at', waitingCutoff.toISOString());

      if (!waitingError && waitingClients?.length > 0) {
        alertsData.push({
          id: 'waiting_clients',
          type: 'waiting_client',
          title: 'Clients en attente',
          description: `${waitingClients.length} client(s) sans réponse depuis 24h+`,
          count: waitingClients.length,
          urgency: 'medium',
          action: () => handleNavigate('/modern-admin/clients'),
          data: waitingClients
        });
      }

      // 4. Missions bloquées (en cours depuis > 48h)
      const blockedCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48h ago
      const { data: blockedMissions, error: blockedError } = await supabase
        .from('client_requests')
        .select('*')
        .eq('status', 'en_cours')
        .lt('started_at', blockedCutoff.toISOString());

      if (!blockedError && blockedMissions?.length > 0) {
        alertsData.push({
          id: 'blocked_missions',
          type: 'waiting_client',
          title: 'Missions bloquées',
          description: `${blockedMissions.length} mission(s) en cours depuis 48h+`,
          count: blockedMissions.length,
          urgency: 'high',
          action: () => handleNavigate('/modern-admin/missions'),
          data: blockedMissions
        });
      }

      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getUrgencyIcon = (type: string) => {
    switch (type) {
      case 'urgent_request': return <Zap className="w-4 h-4" />;
      case 'inactive_provider': return <UserX className="w-4 h-4" />;
      case 'waiting_client': return <Clock className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-800">Tout va bien !</h3>
              <p className="text-sm text-green-600">Aucune alerte critique détectée</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="w-5 h-5" />
          ⚠️ Alertes - Action requise
          <Badge variant="destructive" className="ml-auto">
            {alerts.reduce((sum, alert) => sum + alert.count, 0)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full bg-${getUrgencyColor(alert.urgency)}/10`}>
                {getUrgencyIcon(alert.type)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{alert.title}</h4>
                  <Badge variant={getUrgencyColor(alert.urgency) as any} className="text-xs">
                    {alert.count}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{alert.description}</p>
              </div>
            </div>
            
            {alert.action && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={alert.action}
                className="flex items-center gap-1"
              >
                Traiter
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
        
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Dernière mise à jour : {format(new Date(), 'HH:mm:ss', { locale: fr })} - 
            Actualisation automatique toutes les 30s
          </p>
        </div>
      </CardContent>
    </Card>
  );
};