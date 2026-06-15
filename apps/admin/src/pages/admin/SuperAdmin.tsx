import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Crown, CheckCircle2, XCircle, AlertTriangle, Shield, Key, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSuperAdmin, SuperAdminCompliance } from '@/hooks/admin/useSuperAdmin';
import { EscalationPanel } from '@/components/EscalationPanel';
import { SignalementEscalationPanel } from '@/components/SignalementEscalationPanel';

const ACCESS_ITEMS = [
  'Tout sans exception',
  'Paramètres système',
  'Règles financières',
  'Suppression de données',
  'Gestion des rôles',
  'Accès aux logs complets',
  'Mode maintenance',
];

const RULES: { id: string; text: string; key: keyof SuperAdminCompliance; advisory?: boolean }[] = [
  { id: 'R-SA-01', text: 'Un seul Super Admin par plateforme',      key: 'r_sa_01' },
  { id: 'R-SA-02', text: 'Authentification 2FA obligatoire',         key: 'r_sa_02' },
  { id: 'R-SA-03', text: 'Toutes les actions sont loguées',          key: 'r_sa_03' },
  { id: 'R-SA-04', text: 'Ne jamais partager ces identifiants',      key: 'r_sa_04', advisory: true },
  { id: 'R-SA-05', text: 'Révision mensuelle des accès accordés',    key: 'r_sa_05' },
  { id: 'R-SA-06', text: 'Changer le mot de passe tous les 90 jours', key: 'r_sa_06' },
];

function StatusIcon({ ok, advisory }: { ok: boolean; advisory?: boolean }) {
  if (advisory) return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
  if (ok) return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
  return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
}

export default function SuperAdmin() {
  const { superAdmin, isLoading, isCurrentUserSuperAdmin, markReview, markPwChange, promote } = useSuperAdmin();
  const [transferEmail, setTransferEmail] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const isMissing = !superAdmin;

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Crown className="w-8 h-8 text-amber-500" />
        <div>
          <h1 className="text-3xl font-bold">Super Admin</h1>
          <p className="text-muted-foreground">Rôle souverain — accès total et gouvernance de la plateforme</p>
        </div>
        {isCurrentUserSuperAdmin && (
          <Badge className="ml-auto bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300">
            Vous êtes Super Admin
          </Badge>
        )}
        {isMissing && (
          <Badge className="ml-auto" variant="destructive">Aucun Super Admin désigné</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Identity card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />Super Admin actuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {superAdmin ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xl font-semibold">{superAdmin.firstName} {superAdmin.lastName}</p>
                  <p className="text-muted-foreground text-sm">{superAdmin.email}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Promu le {format(new Date(superAdmin.promotedAt), 'dd MMMM yyyy', { locale: fr })}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={superAdmin.mfaEnrolled ? 'default' : 'destructive'} className="text-xs">
                    {superAdmin.mfaEnrolled ? '2FA activé' : '2FA manquant'}
                  </Badge>
                  <Badge variant={superAdmin.compliance.r_sa_05 ? 'default' : 'destructive'} className="text-xs">
                    Révision {superAdmin.daysSinceReview !== null ? `il y a ${superAdmin.daysSinceReview}j` : 'jamais'}
                  </Badge>
                  <Badge variant={superAdmin.compliance.r_sa_06 ? 'default' : 'destructive'} className="text-xs">
                    MdP {superAdmin.daysSincePwChange !== null ? `il y a ${superAdmin.daysSincePwChange}j` : 'jamais'}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Crown className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun Super Admin désigné sur cette plateforme.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Governance compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />Conformité gouvernance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {superAdmin ? (
              <div className="space-y-2.5">
                {RULES.map(rule => (
                  <div key={rule.id} className="flex items-center gap-2 text-sm">
                    <StatusIcon ok={superAdmin.compliance[rule.key]} advisory={rule.advisory} />
                    <span className="font-mono text-[11px] text-muted-foreground w-16 flex-shrink-0">{rule.id}</span>
                    <span className={superAdmin.compliance[rule.key] || rule.advisory ? '' : 'text-red-600'}>
                      {rule.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">Aucun Super Admin — conformité non applicable.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Governance actions — super_admin only */}
      {isCurrentUserSuperAdmin && superAdmin && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Key className="w-5 h-5" />Actions de gouvernance
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />Révision mensuelle (R-SA-05)
              </p>
              <p className="text-xs text-muted-foreground">
                {superAdmin.daysSinceReview !== null ? `Dernière il y a ${superAdmin.daysSinceReview} jours` : 'Jamais effectuée'}
              </p>
              <Button size="sm" variant="outline" onClick={() => markReview.mutate()} disabled={markReview.isPending}>
                Marquer comme effectuée aujourd'hui
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Key className="w-4 h-4 text-green-500" />Changement de mot de passe (R-SA-06)
              </p>
              <p className="text-xs text-muted-foreground">
                {superAdmin.daysSincePwChange !== null ? `Dernière il y a ${superAdmin.daysSincePwChange} jours` : 'Jamais enregistré'}
              </p>
              <Button size="sm" variant="outline" onClick={() => markPwChange.mutate()} disabled={markPwChange.isPending}>
                Confirmer changement effectué
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer — super_admin only */}
      {isCurrentUserSuperAdmin && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <Crown className="w-5 h-5" />Transfert du rôle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Désignez un successeur. L'opération vous retirera immédiatement le rôle Super Admin et le transférera à cet utilisateur.
            </p>
            <div className="flex gap-2 max-w-md">
              <Input
                placeholder="Email du successeur"
                value={transferEmail}
                onChange={e => setTransferEmail(e.target.value)}
              />
              <Button
                variant="destructive"
                onClick={() => { promote.mutate(transferEmail); setTransferEmail(''); }}
                disabled={promote.isPending || !transferEmail.trim()}
              >
                Transférer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No super_admin: bootstrap promote (any admin) */}
      {isMissing && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Crown className="w-5 h-5" />Désigner le premier Super Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Aucun Super Admin n'existe encore. N'importe quel administrateur peut désigner le premier.
            </p>
            <div className="flex gap-2 max-w-md">
              <Input
                placeholder="Email du Super Admin"
                value={transferEmail}
                onChange={e => setTransferEmail(e.target.value)}
              />
              <Button
                onClick={() => { promote.mutate(transferEmail); setTransferEmail(''); }}
                disabled={promote.isPending || !transferEmail.trim()}
              >
                Désigner
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <EscalationPanel />
      <SignalementEscalationPanel />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Access list */}
        <Card>
          <CardHeader><CardTitle>Accès</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ACCESS_ITEMS.map(item => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rules */}
        <Card>
          <CardHeader><CardTitle>Règles</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {RULES.map(rule => (
                <div key={rule.id} className="flex items-start gap-3 p-2.5 rounded-lg border">
                  <Badge variant="outline" className="font-mono text-[11px] flex-shrink-0 mt-0.5">{rule.id}</Badge>
                  <span className="text-sm">{rule.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
