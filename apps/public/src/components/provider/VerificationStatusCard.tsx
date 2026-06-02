import { Card, CardContent } from '@/components/ui/card';

interface Props {
  status: string;
  rejectionReason?: string;
  lastStatusChangeAt?: string;
}

const STATUS_CONFIG: Record<string, { border: string; bg: string; icon: string; iconBg: string; label: string; message: string }> = {
  active: {
    border: 'border-green-200', bg: 'bg-green-50', icon: '🟢', iconBg: 'bg-green-600',
    label: 'Profil Actif',
    message: 'Votre profil est validé et vous pouvez recevoir des missions.',
  },
  in_review: {
    border: 'border-amber-200', bg: 'bg-amber-50', icon: '🟠', iconBg: 'bg-amber-600',
    label: 'En cours de vérification',
    message: 'Vos documents sont en cours de vérification par notre équipe.',
  },
  suspended: {
    border: 'border-red-200', bg: 'bg-red-50', icon: '🔴', iconBg: 'bg-red-600',
    label: 'Profil Suspendu',
    message: 'Votre profil est temporairement suspendu.',
  },
};

const DEFAULT_CONFIG = {
  border: 'border-yellow-200', bg: 'bg-yellow-50', icon: '🟡', iconBg: 'bg-yellow-600',
  label: 'En attente',
  message: 'Votre profil ne peut pas encore recevoir de missions. Merci de compléter vos documents.',
};

export function VerificationStatusCard({ status, rejectionReason, lastStatusChangeAt }: Props) {
  const cfg = STATUS_CONFIG[status] ?? DEFAULT_CONFIG;

  return (
    <Card className={`border-2 ${cfg.border} ${cfg.bg}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${cfg.iconBg}`}>
            <span className="text-white text-xl">{cfg.icon}</span>
          </div>
          <div className="flex-1">
            <span className="font-semibold text-lg">{cfg.label}</span>
            <p className="text-sm text-muted-foreground mt-1">{cfg.message}</p>
            {rejectionReason && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm text-red-800"><strong>Motif :</strong> {rejectionReason}</p>
              </div>
            )}
            {lastStatusChangeAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Dernière mise à jour : {new Date(lastStatusChangeAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
