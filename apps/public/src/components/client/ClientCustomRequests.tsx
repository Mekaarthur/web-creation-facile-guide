import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, MapPin, Calendar, Clock, Euro, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CustomRequest {
  id: string;
  service_description: string;
  location: string;
  preferred_date: string | null;
  preferred_time: string | null;
  budget_range: string | null;
  urgency_level: string | null;
  additional_notes: string | null;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new:         { label: 'Nouveau',          className: 'bg-red-100 text-red-700 border-red-200' },
  in_progress: { label: 'En cours',         className: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed:   { label: 'Traité',           className: 'bg-green-100 text-green-700 border-green-200' },
  cancelled:   { label: 'Annulé',           className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const URGENCY_LABEL: Record<string, string> = {
  low:       'Pas pressé',
  normal:    'Normal',
  high:      'Urgent',
  very_high: 'Très urgent',
};

async function fetchCustomRequests(): Promise<CustomRequest[]> {
  const { data, error } = await supabase
    .from('custom_requests')
    .select('id, service_description, location, preferred_date, preferred_time, budget_range, urgency_level, additional_notes, status, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export const ClientCustomRequests = () => {
  const { user } = useAuth();

  const { data: requests = [], isLoading, isError, refetch } = useQuery<CustomRequest[]>({
    queryKey: ['custom-requests', user?.id],
    queryFn: fetchCustomRequests,
    enabled: !!user,
  });

  const adminNote = (notes: string | null) => {
    if (!notes) return null;
    const lines = notes.split('\n').filter(l => l.startsWith('[Admin]'));
    return lines.length ? lines[lines.length - 1].replace('[Admin] ', '') : null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">Impossible de charger vos demandes.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
        </Button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto" />
        <p className="text-muted-foreground font-medium">Vous n'avez pas encore soumis de demande personnalisée.</p>
        <p className="text-sm text-muted-foreground">
          Utilisez le formulaire de demande pour décrire votre besoin, notre équipe vous répondra rapidement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Mes demandes personnalisées
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{requests.length} demande{requests.length > 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className="w-4 h-4 mr-2" /> Actualiser
        </Button>
      </div>

      {requests.map((req) => {
        const status = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.new;
        const note = adminNote(req.additional_notes);
        return (
          <Card key={req.id} className="border shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-base leading-snug line-clamp-2">{req.service_description}</p>
                <Badge className={`shrink-0 text-xs border ${status.className}`}>{status.label}</Badge>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(req.created_at), 'd MMM yyyy', { locale: fr })}
                </span>
                {req.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {req.location}
                  </span>
                )}
                {req.preferred_date && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Souhaité le {format(new Date(req.preferred_date), 'd MMM yyyy', { locale: fr })}
                    {req.preferred_time && ` à ${req.preferred_time}`}
                  </span>
                )}
                {req.budget_range && (
                  <span className="flex items-center gap-1">
                    <Euro className="w-3.5 h-3.5" />
                    {req.budget_range}
                  </span>
                )}
                {req.urgency_level && req.urgency_level !== 'normal' && (
                  <span className="text-orange-600 font-medium">
                    {URGENCY_LABEL[req.urgency_level] ?? req.urgency_level}
                  </span>
                )}
              </div>

              {note && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
                  <span className="font-semibold text-amber-800">Message de l'équipe : </span>
                  <span className="text-amber-900">{note}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
