import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, XCircle, UserCog, Shield, Clock, Eye, FileCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { StaffMember, expiryLabel, expiryVariant, callGovernance } from '@/lib/governance';

const ACCESS_ITEMS = [
  { label: 'Réservations (lecture + statut)', ok: true },
  { label: 'Clients — profil + historique', ok: true },
  { label: 'Messages (lire + répondre)', ok: true },
  { label: 'Réclamations (créer + traiter)', ok: true },
  { label: 'Notifications (voir)', ok: true },
  { label: 'Litiges (ouvrir + commenter)', ok: true },
  { label: 'Finance', ok: false },
  { label: 'Prestataires — données sensibles / IBAN', ok: false },
  { label: 'Annulation avec remboursement direct', ok: false },
  { label: 'Modifier les tarifs', ok: false },
  { label: 'Supprimer des données', ok: false },
];

const RULES = [
  { id: 'R-SC-01', text: 'Peut créer un signalement mais pas le résoudre seul' },
  { id: 'R-SC-02', text: 'Accès historique complet client pour assistance' },
  { id: 'R-SC-03', text: 'Communication via messagerie interne uniquement' },
  { id: 'R-SC-04', text: 'Remboursement → escalade Super Admin obligatoire' },
  { id: 'R-SC-05', text: 'Aucun accès IBAN ni données bancaires prestataires' },
  { id: 'R-SC-06', text: 'Session expire après 4h sans activité' },
  { id: 'R-SC-07', text: 'Toutes les actions sont loguées (qui, quoi, quand)' },
  { id: 'R-GLOBAL-03', text: 'Expiration automatique à 6 mois' },
  { id: 'R-GLOBAL-05', text: 'Charte de confidentialité obligatoire avant accès' },
];

async function callSC(action: string, payload?: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('admin-support-client', {
    body: { action, ...payload },
  });
  if (error) throw error;
  return data;
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  const v = expiryVariant(expiresAt);
  if (v === 'none') return null;
  const cls = v === 'expired' || v === 'urgent' ? 'destructive' : v === 'soon' ? 'secondary' : 'outline';
  return <Badge variant={cls as any} className="text-[10px]">{expiryLabel(expiresAt)}</Badge>;
}

export default function SupportClients() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [assignEmail, setAssignEmail] = useState('');
  const [charterChecked, setCharterChecked] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['support-client-agents'],
    queryFn: async () => {
      const res = await callSC('list_agents');
      return res.agents as StaffMember[];
    },
  });
  const agents = data ?? [];

  const assign = useMutation({
    mutationFn: async (email: string) => {
      const { data: prof } = await supabase.from('profiles').select('user_id').eq('email', email).maybeSingle();
      if (!prof) throw new Error('Aucun utilisateur avec cet email');
      return callSC('assign', { userId: prof.user_id, charterAcknowledged: charterChecked });
    },
    onSuccess: () => {
      toast({ title: 'Rôle Support Client assigné (expire dans 6 mois)' });
      setAssignEmail(''); setCharterChecked(false);
      qc.invalidateQueries({ queryKey: ['support-client-agents'] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  });

  const revoke = useMutation({
    mutationFn: (userId: string) =>
      callGovernance('revoke_with_email', { userId, role: 'support_client', reason: 'Révoqué depuis interface admin' }),
    onSuccess: () => {
      toast({ title: 'Rôle révoqué — email envoyé à l\'agent' });
      setRevokeId(null);
      qc.invalidateQueries({ queryKey: ['support-client-agents'] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  });

  const renew = useMutation({
    mutationFn: (userId: string) =>
      callGovernance('renew', { userId, role: 'support_client', months: 6 }),
    onSuccess: () => {
      toast({ title: 'Accès renouvelé pour 6 mois' });
      qc.invalidateQueries({ queryKey: ['support-client-agents'] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Eye className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold">Support Client</h1>
          <p className="text-muted-foreground">Agents d'assistance client — R-SC-01 à R-SC-07</p>
        </div>
        <Badge className="ml-auto" variant="secondary">
          {agents.length} agent{agents.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Agents Support Client actifs</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
            ) : agents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun agent Support Client assigné.</p>
            ) : (
              <div className="space-y-2">
                {agents.map((agent: StaffMember) => (
                  <div key={agent.userId} className={`flex items-center justify-between p-3 rounded-lg border ${expiryVariant(agent.expiresAt) === 'expired' ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{agent.firstName} {agent.lastName}</p>
                        {agent.charterSignedAt && <span title="Charte signée"><FileCheck className="w-3.5 h-3.5 text-green-500" /></span>}
                        <ExpiryBadge expiresAt={agent.expiresAt} />
                      </div>
                      <p className="text-xs text-muted-foreground">{agent.email}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Assigné le {format(new Date(agent.assignedAt), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => renew.mutate(agent.userId)} disabled={renew.isPending}>+6 mois</Button>
                      {revokeId === agent.userId ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="destructive" onClick={() => revoke.mutate(agent.userId)} disabled={revoke.isPending}>Confirmer</Button>
                          <Button size="sm" variant="outline" onClick={() => setRevokeId(null)}>Annuler</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRevokeId(agent.userId)}>Révoquer</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><UserCog className="w-4 h-4" />Assigner le rôle SC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">L'utilisateur devra se reconnecter.</p>
            <Input
              placeholder="Email de l'utilisateur"
              value={assignEmail}
              onChange={e => setAssignEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && assignEmail.trim() && charterChecked) assign.mutate(assignEmail.trim()); }}
            />
            <div className="flex items-start gap-2 p-2 rounded border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
              <Checkbox id="charter-sc" checked={charterChecked} onCheckedChange={v => setCharterChecked(v === true)} className="mt-0.5" />
              <label htmlFor="charter-sc" className="text-xs text-amber-700 dark:text-amber-300 cursor-pointer">
                R-GLOBAL-05 — Je confirme que cet utilisateur a signé la charte de confidentialité
              </label>
            </div>
            <Button onClick={() => assign.mutate(assignEmail.trim())} disabled={assign.isPending || !assignEmail.trim() || !charterChecked} className="w-full">
              Assigner (6 mois)
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-blue-500" />Droits d'accès</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ACCESS_ITEMS.map(item => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                {item.ok ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                <span className={item.ok ? '' : 'text-muted-foreground'}>{item.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500" />Règles R-SC</CardTitle></CardHeader>
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
    </div>
  );
}
