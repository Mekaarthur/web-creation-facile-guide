import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserCog, CheckCircle2, XCircle, Clock, Shield, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface AOAgent { userId: string; email: string; firstName: string; lastName: string; assignedAt: string; }

const ACCESS_ITEMS = [
  { label: 'Réservations — voir + modifier statut',  ok: true  },
  { label: 'Prestataires — voir + assigner missions', ok: true  },
  { label: 'Clients — voir profils',                  ok: true  },
  { label: 'Notifications — gérer',                  ok: true  },
  { label: 'Missions — commencer/terminer',           ok: true  },
  { label: 'Réclamations — traiter',                  ok: true  },
  { label: 'Finance',                                 ok: false },
  { label: 'Paramètres système',                      ok: false },
  { label: 'Rôles utilisateurs',                      ok: false },
  { label: 'Suppression de données',                  ok: false },
];

const RULES = [
  { id: 'R-AO-01', text: 'Peut changer le statut de réservation mais pas annuler sans motif documenté' },
  { id: 'R-AO-02', text: 'Peut assigner un prestataire mais pas modifier les tarifs' },
  { id: 'R-AO-03', text: 'Peut voir les coordonnées client mais pas les exporter' },
  { id: 'R-AO-04', text: 'Toutes les modifications sont loguées' },
  { id: 'R-AO-05', text: 'Accès révocable immédiatement' },
  { id: 'R-AO-06', text: 'Session expire apres 8h sans activite' },
  { id: 'R-AO-07', text: 'Accès limité aux heures ouvrées (7h-22h)' },
];

async function invoke(action: string, extra?: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('admin-agent-operationnel', {
    body: { action, ...extra },
  });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error ?? 'Erreur');
  return data;
}

export default function AgentsOperationnels() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['ao-agents'],
    queryFn: async () => (await invoke('list')).agents as AOAgent[],
  });

  const agents = data ?? [];

  const assign = useMutation({
    mutationFn: (targetEmail: string) => invoke('assign', { targetEmail }),
    onSuccess: () => {
      toast({ title: 'Agent Opérationnel assigné' });
      qc.invalidateQueries({ queryKey: ['ao-agents'] });
      setEmail('');
    },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const revoke = useMutation({
    mutationFn: (targetUserId: string) => invoke('revoke', { targetUserId }),
    onSuccess: () => {
      toast({ title: 'Accès AO révoqué' });
      qc.invalidateQueries({ queryKey: ['ao-agents'] });
    },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-6 p-6">

      <div className="flex items-center gap-3">
        <UserCog className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold">Agents Opérationnels</h1>
          <p className="text-muted-foreground">Rôle de terrain — accès limité aux opérations courantes</p>
        </div>
        <Badge className="ml-auto bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-300">
          {agents.length} agent{agents.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Active agents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />Agents actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <UserCog className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun Agent Opérationnel actif.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {agents.map(agent => (
                  <div key={agent.userId} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{agent.firstName} {agent.lastName}</p>
                      <p className="text-xs text-muted-foreground">{agent.email}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        Assigné le {format(new Date(agent.assignedAt), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <Button
                      size="sm" variant="destructive"
                      onClick={() => revoke.mutate(agent.userId)}
                      disabled={revoke.isPending}
                    >
                      Révoquer (R-AO-05)
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign new AO */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCog className="w-4 h-4" />Assigner un AO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              L'utilisateur doit déjà avoir un compte sur la plateforme.
            </p>
            <Input
              placeholder="Email de l'utilisateur"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={() => assign.mutate(email)}
              disabled={assign.isPending || !email.trim()}
            >
              Assigner le rôle AO
            </Button>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3">
              <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>Toutes les actions seront loguées (R-AO-04). L'accès est révocable à tout moment (R-AO-05).</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Droits d'accès</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {ACCESS_ITEMS.map(item => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  {item.ok
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                  <span className={item.ok ? '' : 'text-muted-foreground line-through'}>{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Règles (R-AO-01→07)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {RULES.map(rule => (
                <div key={rule.id} className="flex items-start gap-2.5 p-2 rounded border text-xs">
                  <Badge variant="outline" className="font-mono text-[10px] flex-shrink-0">{rule.id}</Badge>
                  <span className="text-muted-foreground">{rule.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
