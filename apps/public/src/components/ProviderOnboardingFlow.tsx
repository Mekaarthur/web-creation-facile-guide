import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Circle, 
  Clock,
  FileText,
  GraduationCap,
  Shield,
  Edit,
  AlertCircle
} from 'lucide-react';
import { useProviderOnboarding } from '@/hooks/useProviderOnboarding';
import ProviderDocuments from './ProviderDocuments';
import { ProviderMandateSignature } from './ProviderMandateSignature';
import { ProviderTrainingModule } from './ProviderTrainingModule';

interface ProviderOnboardingFlowProps {
  onComplete?: () => void;
}

export const ProviderOnboardingFlow = ({ onComplete }: ProviderOnboardingFlowProps) => {
  const {
    loading,
    provider,
    steps,
    currentStep,
    setCurrentStep,
    completeStep,
    isOnboardingComplete,
    getProgress
  } = useProviderOnboarding();

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'documents': return FileText;
      case 'mandate': return Edit;
      case 'training': return GraduationCap;
      case 'identity': return Shield;
      default: return Circle;
    }
  };

  const handleStepComplete = async (stepId: string) => {
    try {
      await completeStep(stepId);
      
      // Passer à l'étape suivante si disponible
      const nextStepIndex = steps.findIndex(s => !s.completed);
      if (nextStepIndex !== -1) {
        setCurrentStep(nextStepIndex);
      } else if (isOnboardingComplete() && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Erreur completion step:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="space-y-6">
      {/* En-tête avec progression */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Onboarding Prestataire
              </h2>
              <p className="text-muted-foreground">
                Complétez ces étapes pour pouvoir commencer vos missions
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {getProgress()}%
            </Badge>
          </div>
          <Progress value={getProgress()} className="h-3" />
        </CardContent>
      </Card>

      {/* Stepper horizontal */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = getStepIcon(step.id);
              const isActive = index === currentStep;
              const isCompleted = step.completed;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(index)}
                    className={`flex flex-col items-center gap-2 transition-all ${
                      isActive ? 'scale-110' : ''
                    }`}
                    disabled={!isCompleted && index > currentStep}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isActive
                        ? 'bg-primary border-primary text-white'
                        : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-8 h-8" />
                      ) : (
                        <Icon className="w-8 h-8" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </p>
                      {step.required && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Requis
                        </Badge>
                      )}
                    </div>
                  </button>
                  
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 w-16 mx-2 ${
                      step.completed ? 'bg-green-500' : 'bg-muted'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Message de validation en attente */}
      {currentStepData.id === 'identity' && steps[2].completed && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Vérification en cours</strong><br />
            Nos équipes vérifient actuellement votre identité et vos documents. Vous recevrez une notification 
            par email dès la validation terminée (sous 48h ouvrées).
          </AlertDescription>
        </Alert>
      )}

      {/* Contenu de l'étape actuelle */}
      <div className="min-h-[400px]">
        {currentStepData.id === 'documents' && (
          <ProviderDocuments />
        )}

        {currentStepData.id === 'mandate' && (
          <ProviderMandateSignature
            provider={provider}
            onComplete={() => handleStepComplete('mandate')}
          />
        )}

        {currentStepData.id === 'training' && (
          <ProviderTrainingModule
            provider={provider}
            onComplete={() => handleStepComplete('training')}
          />
        )}

        {currentStepData.id === 'identity' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Vérification d'identité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Vos documents sont en cours de vérification par nos équipes. Cette étape est automatique 
                  et prend généralement moins de 48h ouvrées.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-6 rounded-lg space-y-3">
                <h3 className="font-semibold">Que vérifions-nous ?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                    <span>Authenticité de votre pièce d'identité</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                    <span>Validité de votre extrait de casier judiciaire</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                    <span>Statut auto-entrepreneur et SIRET actif</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                    <span>Cohérence des informations fournies</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Vous recevrez un email dès que :</strong>
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>✓ Votre compte sera validé et activé</li>
                  <li>✓ Vous pourrez commencer à recevoir des missions</li>
                  <li>✓ Votre profil sera visible par les clients</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Onboarding terminé */}
      {isOnboardingComplete() && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Félicitations ! 🎉</strong><br />
            Votre onboarding est terminé. Vous pouvez maintenant commencer à recevoir des missions.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
