import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DocumentUploadSection } from '@/components/provider/DocumentUploadSection';
import { MandateSignature } from '@/components/provider/MandateSignature';
import { TrainingModule } from '@/components/provider/TrainingModule';
import { CheckCircle, Loader2, ArrowLeft, FileText, PenLine, GraduationCap, BadgeCheck } from 'lucide-react';

const ProviderOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    loadProviderData();
  }, []);

  const loadProviderData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth/provider');
        return;
      }

      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setProvider(data);
      
      // Déterminer l'étape actuelle
      if (!data.documents_submitted) {
        setCurrentStep(1);
      } else if (!data.mandat_facturation_accepte) {
        setCurrentStep(2);
      } else if (!data.formation_completed) {
        setCurrentStep(3);
      } else if (data.status === 'active') {
        navigate('/espace-prestataire');
        return;
      } else {
        setCurrentStep(4);
      }
    } catch (error: any) {
      toast.error('Erreur', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement de votre progression...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return null;
  }

  const steps = [
    { id: 1, title: 'Documents', icon: FileText, completed: provider.documents_submitted },
    { id: 2, title: 'Mandat', icon: PenLine, completed: provider.mandat_facturation_accepte },
    { id: 3, title: 'Formation', icon: GraduationCap, completed: provider.formation_completed },
    { id: 4, title: 'Validation', icon: BadgeCheck, completed: provider.status === 'active' }
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/auth/provider" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">Retour</span>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/4c766686-0c19-4be4-b410-bc4ee2dc5c59.png" 
              alt="Bikawo" 
              className="h-8 w-auto"
            />
          </Link>
          <div className="w-16 sm:w-24" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-4xl">
        {/* Header section */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold">
            Bienvenue chez <span className="text-primary">Bikawo</span> 👋
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Complétez ces étapes pour activer votre compte prestataire et commencer à recevoir des missions.
          </p>
          
          {/* Progress bar */}
          <div className="max-w-md mx-auto space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {completedSteps} sur {steps.length} étapes complétées
            </p>
          </div>
        </div>

        {/* Steps indicator - improved */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-8">
          {steps.map((step) => {
            const StepIcon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.completed;
            
            return (
              <div
                key={step.id}
                className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  isCompleted
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                    : isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted bg-muted/30'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-2 rounded-full ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>
                  <span className={`text-xs sm:text-sm font-medium text-center ${
                    isCompleted ? 'text-green-700 dark:text-green-400' : isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </div>
                
                {/* Step number badge */}
                <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {isCompleted ? '✓' : step.id}
                </div>
              </div>
            );
          })}
        </div>

        {/* Content based on current step */}
        <div className="space-y-6">
          {currentStep === 1 && (
            <DocumentUploadSection
              providerId={provider.id}
              onDocumentsUpdated={loadProviderData}
            />
          )}

          {currentStep === 2 && (
            <MandateSignature
              providerId={provider.id}
              providerName={provider.business_name || 'Prestataire'}
              onSigned={() => {
                loadProviderData();
                setCurrentStep(3);
              }}
            />
          )}

          {currentStep === 3 && (
            <TrainingModule
              providerId={provider.id}
              onCompleted={() => {
                loadProviderData();
                setCurrentStep(4);
              }}
            />
          )}

          {currentStep === 4 && (
            <Card className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-semibold">Vérification en cours</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Félicitations ! Votre dossier est complet et en cours de vérification par notre équipe. 
                Vous recevrez un email dès que votre compte sera activé.
              </p>
              <div className="pt-4 space-y-2">
                <p className="text-sm font-medium text-primary">
                  ⏱ Temps de traitement : 24-48h
                </p>
                <p className="text-xs text-muted-foreground">
                  Nous vous contacterons si des informations supplémentaires sont nécessaires.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderOnboarding;
