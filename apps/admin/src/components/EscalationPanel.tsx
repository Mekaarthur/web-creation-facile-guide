import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

async function callSC(action: string, payload?: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('admin-support-client', {
    body: { action, ...payload },
  });
  if (error) throw error;
  return data;
}

export function EscalationPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['refund-escalations'],
    queryFn: () => callSC('list_escalations'),
  });

  const approve = useMutation({
    mutationFn: (escalationId: string) => callSC('approve_escalation', { escalationId }),
    onSuccess: () => {
      toast({ title: 'Escalade approuvee — Traitez le remboursement Stripe depuis Reservations' });
      qc.invalidateQueries({ queryKey: ['refund-escalations'] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  });

  const reject = useMutation({
    mutationFn: ({ escalationId, notes }: { escalationId: string; notes: string }) =>
      callSC('reject_escalation', { escalationId, notes }),
    onSuccess: () => {
      toast({ title: 'Escalade refusee' });
      setRejectingId(null);
      setRejectNotes('');
      qc.invalidateQueries({ queryKey: ['refund-escalations'] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  });

  const escalations = data?.escalations || [];
  const pending = escalations.filter((e: any) => e.status === 'pending');

  return (
    <Card className={pending.length > 0 ? 'border-orange-300 dark:border-orange-700' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          Escalades remboursement (R-SC-04)
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
          <p className="text-sm text-muted-foreground text-center py-4">Aucune escalade de remboursement.</p>
        ) : (
          <div className="space-y-3">
            {escalations.map((esc: any) => (
              <div
                key={esc.id}
                className={`p-3 rounded-lg border ${esc.status === 'pending' ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={esc.status === 'pending' ? 'destructive' : esc.status === 'approved' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {esc.status === 'pending' ? 'En attente' : esc.status === 'approved' ? 'Approuvee' : 'Refusee'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(esc.requested_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <p className="text-sm font-medium">Reservation : {esc.booking_id?.slice(0, 8)}…</p>
                    <p className="text-sm">Montant : <span className="font-semibold">{esc.requested_amount ?? 0} €</span></p>
                    <p className="text-sm text-muted-foreground">Motif : {esc.reason}</p>
                    {esc.resolution_notes && (
                      <p className="text-xs text-muted-foreground">Resolution : {esc.resolution_notes}</p>
                    )}
                  </div>

                  {esc.status === 'pending' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button size="sm" onClick={() => approve.mutate(esc.id)} disabled={approve.isPending}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setRejectingId(esc.id); setRejectNotes(''); }}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />Refuser
                      </Button>
                    </div>
                  )}
                </div>

                {rejectingId === esc.id && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Motif du refus (obligatoire)"
                      value={rejectNotes}
                      onChange={e => setRejectNotes(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => reject.mutate({ escalationId: esc.id, notes: rejectNotes })}
                        disabled={reject.isPending || !rejectNotes.trim()}
                      >
                        Confirmer le refus
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectingId(null)}>
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
