import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calculator, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface CPUser { userId: string; email: string; firstName: string; lastName: string; assignedAt: string; }

const ACCESS_ITEMS = [
  { label: 'Finance — voir toutes les transactions',      ok: true  },
  { label: 'Factures — voir + télécharger',               ok: true  },
  { label: 'Rapports — générer + exporter',               ok: true  },
  { label: 'Rémunérations prestataires — voir',           ok: true  },
  { label: 'Réconciliation mensuelle — lancer',           ok: true  },
  { label: 'Réservations — lecture seule',                ok: true  },
  { label: 'Clients — données personnelles',              ok: false },
  { label: 'Prestataires — données financières uniquement', ok: true },
  { label: 'Paramètres système',                          ok: false },
  { label: 'Virements — lecture seule (pas d\'action)',   ok: true  },
];

const RULES = [
  { id: 'R-CP-01', text: 'Peut voir les montants mais pas déclencher un virement' },
  { id: 'R-CP-02', text: 'Peut exporter les données financières en CSV/Excel' },
  { id: 'R-CP-03', text: 'Accès aux factures en lecture seule (immuables)' },
  { id: 'R-CP-04', text: 'Ne voit jamais les données personnelles clients (RGPD)' },
  { id: 'R-CP-05', text: 'Accès révocable immédiatement' },
  { id: 'R-CP-06', text: 'Expiration automatique à 1 an' },
  { id: 'R-CP-07', text: 'Toutes les consultations loguées (qui a vu quoi et quand)' },
];

async function invoke(action: string, extra?: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('admin-comptable-partenaire', {
    body: { action, ...extra },
  });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error ?? 'Erreur');
  return data;
}

export default function ComptablesPartenaires() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['cp-users'],
    queryFn: async () => (await invoke('list')).comptables as CPUser[],
  });

  const users = data ?? [];

  const assign = useMutation({
    mutationFn: (targetEmail: string) => invoke('assign', { targetEmail }),
    onSuccess: () => {
      toast({ title: 'Comptable/Partenaire assigné' });
      qc.invalidateQueries({ queryKey: ['cp-users'] });
      setEmail('');
    },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const revoke = useMutation({
    mutationFn: (targetUserId: string) => invoke('revoke', { targetUserId }),
    onSuccess: () => {
      toast({ title: 'Accès CP révoqué' });
      qc.invalidateQueries({ queryKey: ['cp-users'] });
    },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-6 p-6">

      <div className="flex items-center gap-3">
        <Calculator className="w-8 h-8 text-emerald-500" />
        <div>
          <h1 className="text-3xl font-bold">Comptables / Partenaires</h1>
          <p className="text-muted-foreground">Accès financier en lecture — données personnelles masquées</p>
        </div>
        <Badge className="ml-auto bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300">
          {users.length} utilisateur{users.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calculator className="w-4 h-4 text-emerald-500" />Accès actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Calculator className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun Comptable/Partenaire actif.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map(u => (
                  <div key={u.userId} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        Assigné le {format(new Date(u.assignedAt), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <Button
                      size="sm" variant="destructive"
                      onClick={() => revoke.mutate(u.userId)}
                      disabled={revoke.isPending}
                    >
                      Révoquer (R-CP-05)
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="w-4 h-4" />Assigner un accès
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
              Assigner le rôle CP
            </Button>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3">
              <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>Expire automatiquement à 1 an (R-CP-06). Révocable à tout moment (R-CP-05).</span>
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
          <CardHeader><CardTitle className="text-sm">Règles (R-CP-01 à 07)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {RULES.map(rule => (
                <div key={rule.id} className="flex items-start gap-2.5 p-2 rounded border text-xs">
                  <Badge variant="outline" className="font-mono text-[10px] flex-shrink-0 bg-emerald-50 dark:bg-emerald-950 border-emerald-200">
                    {rule.id}
                  </Badge>
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
