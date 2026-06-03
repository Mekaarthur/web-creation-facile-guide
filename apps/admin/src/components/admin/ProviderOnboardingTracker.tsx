import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, FileText, Shield, GraduationCap, UserCheck } from 'lucide-react';

interface OnboardingStep {
  key: string;
  label: string;
  completed: boolean;
  icon: any;
}

interface ProviderOnboardingTrackerProps {
  provider: any;
  onActivate: () => void;
  loading?: boolean;
}

export const ProviderOnboardingTracker = ({ 
  provider, 
  onActivate,
  loading = false 
}: ProviderOnboardingTrackerProps) => {
  const steps: OnboardingStep[] = [
    {
      key: 'documents',
      label: 'Documents soumis',
      completed: provider.documents_submitted || false,
      icon: FileText,
    },
    {
      key: 'mandate',
      label: 'Mandat signé',
      completed: provider.mandat_facturation_accepte || false,
      icon: Shield,
    },
    {
      key: 'training',
      label: 'Formation complétée',
      completed: provider.formation_completed || false,
      icon: GraduationCap,
    },
    {
      key: 'identity',
      label: 'Identité vérifiée',
      completed: provider.identity_verified || false,
      icon: UserCheck,
    },
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;
  const allCompleted = completedSteps === steps.length;
  const canActivate = allCompleted && provider.status !== 'active';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Progression Onboarding</span>
          <Badge variant={allCompleted ? 'default' : 'secondary'}>
            {completedSteps}/{steps.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Barre de progression */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground text-right">
            {Math.round(progress)}% complété
          </p>
        </div>

        {/* Étapes */}
        <div className="space-y-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.key}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  step.completed
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                    : 'bg-muted/30'
                }`}
              >
                {step.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    step.completed ? 'text-green-700 dark:text-green-300' : 'text-foreground'
                  }`}>
                    {step.label}
                  </p>
                </div>
                <Icon className={`h-4 w-4 ${
                  step.completed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                }`} />
              </div>
            );
          })}
        </div>

        {/* Action */}
        {canActivate && (
          <Button
            onClick={onActivate}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Activer le prestataire
          </Button>
        )}

        {!allCompleted && (
          <p className="text-sm text-center text-muted-foreground">
            Le prestataire doit compléter toutes les étapes avant activation
          </p>
        )}

        {provider.status === 'active' && (
          <Badge variant="default" className="w-full justify-center py-2">
            ✓ Prestataire actif
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
