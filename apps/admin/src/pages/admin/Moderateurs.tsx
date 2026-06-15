import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, UserCog, Shield, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const ACCESS_ITEMS = [
  { label: 'Avis clients — valider + rejeter (avec motif)', ok: true },
  { label: 'Signalements — traiter + escalader', ok: true },
  { label: 'Prestataires — valider documents', ok: true },
  { label: 'Qualite — voir scores + alertes', ok: true },
  { label: 'Candidatures — approuver/rejeter', ok: true },
  { label: 'Reservations — lecture seule', ok: true },
  { label: 'Clients — donnees limitees', ok: true },
  { label: 'Finance', ok: false },
  { label: 'Paiements / Factures', ok: false },
  { label: 'Conversion prestataire directe', ok: false },
  { label: 'Suppression definitive', ok: false },
  { label: 'Parametres / RGPD', ok: false },
];

const RULES = [
  { id: 'R-MO-01', text: 'Approbation document → passage en pending_ao, validation finale par Agent Operationnel' },
  { id: 'R-MO-02', text: 'Peut rejeter un avis avec motif mais pas le supprimer definitivement' },
  { id: 'R-MO-03', text: 'Chaque decision de moderation necessite une note documentee (min 10 caracteres)' },
  { id: 'R-MO-04', text: 'Signalement urgent → escalade automatique vers Super Admin' },
  { id: 'R-MO-05', text: 'Toutes les decisions loguees avec horodatage et motif' },
];

async function callMO(action: string, payload?: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-moderateur`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erreur serveur');
  return json;
}

export default function Moderateurs() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [assignEmail, setAssignEmail] = useState('');
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['moderateur-agents'],
    queryFn: () => callMO('list_agents'),
  });

  const assign = useMutation({
    mutationFn: async (email: string) => {
      const { data: prof } = await supabase.from('profiles').select('id').eq('email', email).single();
      if (!prof) throw new Error('Aucun utilisateur avec cet email');
      return callMO('assign', { userId: prof.id });
    },
    onSuccess: () => {
      toast({ title: 'Role Moderateur assigne' });
      setAssignEmail('');
      qc.invalidateQueries({ queryKey: ['moderateur-agents'] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  });

  const revoke = useMutation({
    mutationFn: (userId: string) => callMO('revoke', { userId }),
    onSuccess: () => {
      toast({ title: 'Role revoque' });
      setRevokeId(null);
      qc.invalidateQueries({ queryKey: ['moderateur-agents'] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  });

  const agents = data?.agents || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-8 h-8 text-purple-500" />
        <div>
          <h1 className="text-3xl font-bold">Moderateurs</h1>
          <p className="text-muted-foreground">Role de moderation du contenu — R-MO-01 a R-MO-05</p>
        </div>
        <Badge className="ml-auto" variant="secondary">
          {agents.length} moderateur{agents.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />Droits d'acces
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ACCESS_ITEMS.map(item => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                {item.ok
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                <span className={item.ok ? '' : 'text-muted-foreground'}>{item.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />Regles R-MO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {RULES.map(rule => (
              <div key={rule.id} className="flex items-start gap-3 p-2 rounded-lg border">
                <Badge variant="outline" className="font-mono text-[11px] flex-shrink-0 mt-0.5">{rule.id}</Badge>
                <span className="text-sm">{rule.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />Assigner le role Moderateur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            L'utilisateur devra se reconnecter pour beneficier du role. Toutes ses decisions seront loguees (R-MO-05).
          </p>
          <div className="flex gap-2 max-w-md">
            <Input
              placeholder="Email de l'utilisateur"
              value={assignEmail}
              onChange={e => setAssignEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && assignEmail.trim()) assign.mutate(assignEmail.trim()); }}
            />
            <Button
              onClick={() => assign.mutate(assignEmail.trim())}
              disabled={assign.isPending || !assignEmail.trim()}
            >
              Assigner
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Moderateurs actifs</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : agents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun moderateur assigne.</p>
          ) : (
            <div className="space-y-2">
              {agents.map((agent: any) => (
                <div key={agent.userId} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{agent.first_name} {agent.last_name}</p>
                    <p className="text-xs text-muted-foreground">{agent.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Assigne le {format(new Date(agent.assignedAt), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant="secondary" className="text-xs">Moderateur</Badge>
                    {revokeId === agent.userId ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => revoke.mutate(agent.userId)} disabled={revoke.isPending}>
                          Confirmer
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRevokeId(null)}>Annuler</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setRevokeId(agent.userId)}>Revoquer</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
