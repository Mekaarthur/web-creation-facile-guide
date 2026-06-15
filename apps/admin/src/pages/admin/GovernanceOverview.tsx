import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, AlertTriangle, Users, Clock, CheckCircle2, FileCheck } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { callGovernance, expiryLabel, expiryVariant } from '@/lib/governance';

const ROLE_COLORS: Record<string, string> = {
  agent_operationnel:   'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  comptable_partenaire: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  support_client:       'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  moderator:            'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
};

const SEVERITY_COLORS: Record<string, string> = {
  low:      'bg-blue-100 text-blue-800',
  medium:   'bg-amber-100 text-amber-800',
  high:     'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const STATUS_COLORS: Record<string, string> = {
  open:          'bg-red-100 text-red-800',
  investigating: 'bg-amber-100 text-amber-800',
  resolved:      'bg-green-100 text-green-800',
  closed:        'bg-muted text-muted-foreground',
};

export default function GovernanceOverview() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [incidentUserId, setIncidentUserId] = useState('');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState('high');
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['governance-staff'],
    queryFn: () => callGovernance('list_all_staff'),
  });

  const { data: expiringData } = useQuery({
    queryKey: ['governance-expiring'],
    queryFn: () => callGovernance('list_expiring', { daysAhead: 30 }),
  });

  const { data: incidentsData, isLoading: incLoading } = useQuery({
    queryKey: ['governance-incidents'],
    queryFn: () => callGovernance('list_incidents'),
  });

  const staff = staffData?.staff ?? [];
  const expiring = expiringData?.expiring ?? [];
  const incidents = incidentsData?.incidents ?? [];
  const openIncidents = incidents.filter((i: any) => i.status === 'open' || i.status === 'investigating');

  const triggerIncident = useMutation({
    mutationFn: () => callGovernance('trigger_incident', {
      targetUserId: incidentUserId.trim(),
      description: incidentDesc.trim(),
      severity: incidentSeverity,
    }),
    onSuccess: () => {
      toast({ title: '⚠️ Incident enregistré — tous les accès du collaborateur ont été révoqués' });
      setIncidentUserId(''); setIncidentDesc(''); setShowIncidentForm(false);
      qc.invalidateQueries({ queryKey: ['governance-incidents'] });
      qc.invalidateQueries({ queryKey: ['governance-staff'] });
    },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const resolveIncident = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      callGovernance('resolve_incident', { incidentId: id, status, resolution: resolveNotes }),
    onSuccess: () => {
      toast({ title: 'Incident mis à jour' });
      setResolvingId(null); setResolveNotes('');
      qc.invalidateQueries({ queryKey: ['governance-incidents'] });
    },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gouvernance des Accès</h1>
          <p className="text-muted-foreground">Vue globale — R-GLOBAL-01 à 06</p>
        </div>
        {openIncidents.length > 0 && (
          <Badge variant="destructive" className="ml-auto">
            {openIncidents.length} incident{openIncidents.length > 1 ? 's' : ''} ouvert{openIncidents.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{staff.length}</p>
                <p className="text-xs text-muted-foreground">Collaborateurs actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={expiring.length > 0 ? 'border-amber-400' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{expiring.length}</p>
                <p className="text-xs text-muted-foreground">Expirent dans 30j</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={openIncidents.length > 0 ? 'border-destructive' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{openIncidents.length}</p>
                <p className="text-xs text-muted-foreground">Incidents ouverts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{staff.filter((s: any) => s.charterSignedAt).length}</p>
                <p className="text-xs text-muted-foreground">Chartes signées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tous les collaborateurs actifs</CardTitle>
          <Button variant="destructive" size="sm" onClick={() => setShowIncidentForm(v => !v)}>
            ⚠️ Déclarer un incident (R-GLOBAL-06)
          </Button>
        </CardHeader>
        <CardContent>
          {showIncidentForm && (
            <div className="mb-4 p-4 rounded-lg border border-destructive/50 bg-destructive/5 space-y-3">
              <p className="text-sm font-medium text-destructive">R-GLOBAL-06 — Incident de sécurité</p>
              <p className="text-xs text-muted-foreground">Tous les accès staff du collaborateur ciblé seront révoqués immédiatement et le Super Admin sera notifié.</p>
              <input
                className="w-full border rounded px-3 py-2 text-sm bg-background"
                placeholder="UUID du collaborateur ciblé"
                value={incidentUserId}
                onChange={e => setIncidentUserId(e.target.value)}
              />
              <Textarea
                placeholder="Description de l'incident (obligatoire)"
                value={incidentDesc}
                onChange={e => setIncidentDesc(e.target.value)}
                rows={3}
              />
              <div className="flex items-center gap-2">
                <Select value={incidentSeverity} onValueChange={setIncidentSeverity}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="high">Élevé</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  onClick={() => triggerIncident.mutate()}
                  disabled={triggerIncident.isPending || !incidentUserId.trim() || !incidentDesc.trim()}
                >
                  Déclencher l'incident
                </Button>
                <Button variant="outline" onClick={() => setShowIncidentForm(false)}>Annuler</Button>
              </div>
            </div>
          )}

          {staffLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
          ) : staff.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun collaborateur actif.</p>
          ) : (
            <div className="space-y-2">
              {staff.map((s: any) => {
                const v = expiryVariant(s.expiresAt);
                return (
                  <div key={`${s.userId}-${s.role}`} className={`flex items-center justify-between p-3 rounded-lg border ${v === 'expired' ? 'border-destructive/50 bg-destructive/5' : v === 'urgent' ? 'border-amber-400/50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[s.role] ?? ''}`}>{s.roleLabel}</span>
                          {s.charterSignedAt && <span title="Charte signée"><FileCheck className="w-3.5 h-3.5 text-green-500" /></span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${v === 'expired' ? 'text-destructive' : v === 'urgent' ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        {expiryLabel(s.expiresAt)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Depuis {format(new Date(s.assignedAt), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incidents */}
      {incidents.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Incidents de sécurité (R-GLOBAL-06)</CardTitle></CardHeader>
          <CardContent>
            {incLoading ? (
              <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
            ) : (
              <div className="space-y-3">
                {incidents.map((inc: any) => (
                  <div key={inc.id} className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[inc.severity] ?? ''}`}>{inc.severity.toUpperCase()}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[inc.status] ?? ''}`}>{inc.status}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{format(new Date(inc.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
                    </div>
                    <p className="text-sm">{inc.description}</p>
                    {resolvingId === inc.id ? (
                      <div className="space-y-2">
                        <Textarea placeholder="Notes de résolution" value={resolveNotes} onChange={e => setResolveNotes(e.target.value)} rows={2} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => resolveIncident.mutate({ id: inc.id, status: 'resolved' })} disabled={resolveIncident.isPending}>Résolu</Button>
                          <Button size="sm" variant="outline" onClick={() => resolveIncident.mutate({ id: inc.id, status: 'investigating' })} disabled={resolveIncident.isPending}>En investigation</Button>
                          <Button size="sm" variant="outline" onClick={() => { setResolvingId(null); setResolveNotes(''); }}>Annuler</Button>
                        </div>
                      </div>
                    ) : inc.status !== 'closed' && (
                      <Button size="sm" variant="outline" onClick={() => setResolvingId(inc.id)}>Traiter</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
