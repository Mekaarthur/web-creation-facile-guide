import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Trash2, Clock, User, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DeletionRequest {
  id: string;
  user_id: string;
  requested_at: string;
  scheduled_at: string;
  reason: string | null;
  first_name: string | null;
  last_name: string | null;
}

async function fetchDeletionRequests(): Promise<DeletionRequest[]> {
  const { data, error } = await supabase
    .from('pending_deletions' as any)
    .select('*');
  if (error) throw error;
  return (data as unknown as DeletionRequest[]) || [];
}

const REQUESTS_KEY = ['rgpd-deletion-requests'] as const;

const RgpdDeletions = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [processing, setProcessing] = useState<string | null>(null);

  const { data: requests = [], isLoading: loading } = useQuery<DeletionRequest[]>({
    queryKey: REQUESTS_KEY,
    queryFn: fetchDeletionRequests,
  });

  const executeErasure = async (userId: string, userName: string) => {
    if (!confirm(`Confirmer l'effacement définitif des données de ${userName} ?`)) return;
    setProcessing(userId);
    const { error } = await supabase.rpc('anonymize_and_delete_user' as any, { p_user_id: userId });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Compte anonymisé', description: `Les données de ${userName} ont été effacées.` });
      qc.invalidateQueries({ queryKey: REQUESTS_KEY });
    }
    setProcessing(null);
  };

  const daysUntilDeletion = (scheduledAt: string) =>
    differenceInDays(new Date(scheduledAt), new Date());

  const urgencyColor = (days: number) => {
    if (days <= 0) return 'destructive';
    if (days <= 7) return 'destructive';
    if (days <= 14) return 'secondary';
    return 'outline';
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Demandes de suppression RGPD</h1>
          <p className="text-sm text-muted-foreground">Article 17 — Droit à l'effacement</p>
        </div>
      </div>

      {/* Rappel légal */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-orange-800 space-y-1">
            <p className="font-medium">Obligation légale</p>
            <p>Chaque demande doit être traitée dans un délai maximum de <strong>30 jours</strong> à compter de la date de demande (RGPD Art. 12). Exécutez l'effacement dès que la date planifiée est atteinte.</p>
          </div>
        </CardContent>
      </Card>

      {/* Compteur */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary">{requests.length}</div>
            <div className="text-sm text-muted-foreground">En attente</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-destructive">
              {requests.filter(r => daysUntilDeletion(r.scheduled_at) <= 7).length}
            </div>
            <div className="text-sm text-muted-foreground">Urgentes (≤ 7 jours)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {requests.filter(r => daysUntilDeletion(r.scheduled_at) <= 0).length}
            </div>
            <div className="text-sm text-muted-foreground">À exécuter maintenant</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des demandes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Demandes en attente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune demande de suppression en attente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => {
                const days = daysUntilDeletion(req.scheduled_at);
                const name = [req.first_name, req.last_name].filter(Boolean).join(' ') || 'Utilisateur inconnu';
                const isOverdue = days <= 0;

                return (
                  <div
                    key={req.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{name}</span>
                          <Badge variant={urgencyColor(days) as any}>
                            {isOverdue ? '⚠ À exécuter' : `J-${days}`}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>Demandé le {format(new Date(req.requested_at), 'dd MMM yyyy à HH:mm', { locale: fr })}</div>
                          <div>Planifié le {format(new Date(req.scheduled_at), 'dd MMM yyyy', { locale: fr })}</div>
                          {req.reason && <div className="italic">"{req.reason}"</div>}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant={isOverdue ? 'destructive' : 'outline'}
                      size="sm"
                      disabled={processing === req.user_id}
                      onClick={() => executeErasure(req.user_id, name)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {processing === req.user_id ? 'Effacement...' : 'Effacer'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RgpdDeletions;
