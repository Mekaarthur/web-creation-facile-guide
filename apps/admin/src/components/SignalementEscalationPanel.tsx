import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Flag, CheckCircle2, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

async function callMO(action: string, payload?: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('admin-moderateur', {
    body: { action, ...payload },
  });
  if (error) throw error;
  return data;
}

export function SignalementEscalationPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'reviewed' | 'dismissed'>('reviewed');

  const { data, isLoading } = useQuery({
    queryKey: ['signalement-escalations'],
    queryFn: () => callMO('list_escalations'),
  });

  const review = useMutation({
    mutationFn: ({ escalationId, status, notes }: { escalationId: string; status: string; notes: string }) =>
      callMO('review_escalation', { escalationId, status, notes }),
    onSuccess: () => {
      toast({ title: 'Escalade traitee' });
      setReviewingId(null);
      setReviewNotes('');
      qc.invalidateQueries({ queryKey: ['signalement-escalations'] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  });

  const escalations = data?.escalations || [];
  const pending = escalations.filter((e: any) => e.status === 'pending');

  return (
    <Card className={pending.length > 0 ? 'border-red-300 dark:border-red-700' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-red-500" />
          Signalements urgents (R-MO-04)
          {pending.length > 0 && (
            <Badge variant="destructive" className="ml-auto">{pending.length} en attente</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : escalations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun signalement urgent a traiter.</p>
        ) : (
          <div className="space-y-3">
            {escalations.map((esc: any) => (
              <div
                key={esc.id}
                className={`p-3 rounded-lg border ${esc.status === 'pending' ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={esc.priority === 'urgent' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {esc.priority === 'urgent' ? 'URGENT' : 'HAUTE'}
                      </Badge>
                      <Badge
                        variant={esc.status === 'pending' ? 'destructive' : 'outline'}
                        className="text-xs"
                      >
                        {esc.status === 'pending' ? 'En attente' : esc.status === 'reviewed' ? 'Traite' : 'Rejete'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(esc.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <p className="text-sm font-medium">Signalement : {esc.report_id?.slice(0, 8)}…</p>
                    <p className="text-sm text-muted-foreground">Motif : {esc.reason}</p>
                    {esc.review_notes && (
                      <p className="text-xs text-muted-foreground">Note : {esc.review_notes}</p>
                    )}
                  </div>

                  {esc.status === 'pending' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => { setReviewingId(esc.id); setReviewStatus('reviewed'); setReviewNotes(''); }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Traiter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setReviewingId(esc.id); setReviewStatus('dismissed'); setReviewNotes(''); }}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />Rejeter
                      </Button>
                    </div>
                  )}
                </div>

                {reviewingId === esc.id && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder={reviewStatus === 'reviewed' ? 'Note de traitement (optionnelle)' : 'Motif du rejet (optionnel)'}
                      value={reviewNotes}
                      onChange={e => setReviewNotes(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={reviewStatus === 'dismissed' ? 'outline' : 'default'}
                        onClick={() => review.mutate({ escalationId: esc.id, status: reviewStatus, notes: reviewNotes })}
                        disabled={review.isPending}
                      >
                        {reviewStatus === 'reviewed' ? 'Confirmer le traitement' : 'Confirmer le rejet'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setReviewingId(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
