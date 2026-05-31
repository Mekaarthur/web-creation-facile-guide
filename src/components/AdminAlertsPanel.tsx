import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Clock,
  UserX,
  ArrowRight,
  Zap
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AlertData {
  id: string;
  type: 'urgent_request' | 'inactive_provider' | 'waiting_client';
  title: string;
  description: string;
  count: number;
  urgency: 'high' | 'medium' | 'low';
  navigateTo?: string;
}

const ALERTS_KEY = ['admin-alerts'] as const;

async function fetchAlerts(): Promise<AlertData[]> {
  const alertsData: AlertData[] = [];

  const urgentCutoff  = new Date(Date.now() - 2  * 60 * 60 * 1000).toISOString();
  const inactiveDate  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString();
  const waitingCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const blockedCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const [
    { data: urgentRequests },
    { data: inactiveProviders },
    { data: waitingClients },
    { data: blockedMissions },
    { data: openComplaints },
    { data: failedPayments },
  ] = await Promise.all([
    supabase.from('client_requests').select('id').in('status', ['new', 'unmatched']).lt('created_at', urgentCutoff),
    supabase.from('providers').select('id').eq('status', 'active').or(`last_mission_date.is.null,last_mission_date.lt.${inactiveDate}`),
    supabase.from('client_requests').select('id').eq('status', 'assigned').lt('updated_at', waitingCutoff),
    supabase.from('client_requests').select('id').eq('status', 'en_cours').lt('started_at', blockedCutoff),
    supabase.from('complaints').select('id, priority').in('status', ['open', 'pending', 'in_progress']),
    supabase.from('financial_transactions').select('id').eq('payment_status', 'failed'),
  ]);

  if (urgentRequests?.length) {
    alertsData.push({
      id: 'urgent_requests', type: 'urgent_request',
      title: 'Demandes urgentes',
      description: `${urgentRequests.length} demande(s) non attribuée(s) depuis plus de 2h`,
      count: urgentRequests.length, urgency: 'high', navigateTo: '/modern-admin/missions',
    });
  }
  if (inactiveProviders?.length) {
    alertsData.push({
      id: 'inactive_providers', type: 'inactive_provider',
      title: 'Prestataires inactifs',
      description: `${inactiveProviders.length} prestataire(s) sans mission depuis 7+ jours`,
      count: inactiveProviders.length, urgency: 'medium', navigateTo: '/modern-admin/providers',
    });
  }
  if (waitingClients?.length) {
    alertsData.push({
      id: 'waiting_clients', type: 'waiting_client',
      title: 'Clients en attente',
      description: `${waitingClients.length} client(s) sans réponse depuis 24h+`,
      count: waitingClients.length, urgency: 'medium', navigateTo: '/modern-admin/clients',
    });
  }
  if (blockedMissions?.length) {
    alertsData.push({
      id: 'blocked_missions', type: 'waiting_client',
      title: 'Missions bloquées',
      description: `${blockedMissions.length} mission(s) en cours depuis 48h+`,
      count: blockedMissions.length, urgency: 'high', navigateTo: '/modern-admin/missions',
    });
  }
  if (openComplaints?.length) {
    const urgentCount = openComplaints.filter(c => c.priority === 'urgent' || c.priority === 'high').length;
    alertsData.push({
      id: 'open_complaints', type: 'urgent_request',
      title: 'Réclamations clients',
      description: `${openComplaints.length} réclamation(s) en cours${urgentCount > 0 ? ` dont ${urgentCount} urgente(s)` : ''}`,
      count: openComplaints.length, urgency: urgentCount > 0 ? 'high' : 'medium',
      navigateTo: '/modern-admin/reclamations',
    });
  }
  if (failedPayments?.length) {
    alertsData.push({
      id: 'failed_payments', type: 'urgent_request',
      title: 'Paiements échoués',
      description: `${failedPayments.length} paiement(s) en échec nécessitant une intervention`,
      count: failedPayments.length, urgency: 'high', navigateTo: '/modern-admin/payments',
    });
  }

  return alertsData;
}

export const AdminAlertsPanel = () => {
  const navigate = useNavigate();

  const { data: alerts = [], isLoading: loading } = useQuery<AlertData[]>({
    queryKey: ALERTS_KEY,
    queryFn: fetchAlerts,
    refetchInterval: 30000,
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':   return 'destructive';
      case 'medium': return 'warning';
      default:       return 'secondary';
    }
  };

  const getUrgencyIcon = (type: string) => {
    switch (type) {
      case 'urgent_request':   return <Zap className="w-4 h-4" />;
      case 'inactive_provider': return <UserX className="w-4 h-4" />;
      case 'waiting_client':   return <Clock className="w-4 h-4" />;
      default:                  return <AlertTriangle className="w-4 h-4" />;
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

            {alert.navigateTo && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(alert.navigateTo!)}
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
