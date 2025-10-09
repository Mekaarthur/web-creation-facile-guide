import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DocumentUploadSection } from '@/components/provider/DocumentUploadSection';
import { MandateSignature } from '@/components/provider/MandateSignature';
import { TrainingModule } from '@/components/provider/TrainingModule';
import { CheckCircle, Loader2 } from 'lucide-react';

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
      if (!data.mandat_facturation_accepte) {
        setCurrentStep(2);
      } else if (!data.formation_completed) {
        setCurrentStep(3);
      } else if (data.status === 'active') {
        // Déjà complété, rediriger vers le dashboard
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return null;
  }

  const steps = [
    { id: 1, title: 'Documents', completed: provider.status !== 'pending' },
    { id: 2, title: 'Mandat', completed: provider.mandat_facturation_accepte },
    { id: 3, title: 'Formation', completed: provider.formation_completed },
    { id: 4, title: 'Validation', completed: provider.status === 'active' }
  ];

  const progress = (steps.filter(s => s.completed).length / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Onboarding Prestataire Bikawo</h1>
          <p className="text-muted-foreground">
            Complétez ces étapes pour devenir prestataire actif sur Bikawo
          </p>
          <Progress value={progress} className="max-w-md mx-auto" />
        </div>

        {/* Steps indicator */}
        <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`text-center p-3 rounded-lg border-2 transition-all ${
                step.completed
                  ? 'border-green-500 bg-green-50'
                  : step.id === currentStep
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                {step.completed ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    step.id === currentStep ? 'border-blue-500 text-blue-500' : 'border-gray-300 text-gray-400'
                  }`}>
                    {step.id}
                  </div>
                )}
              </div>
              <p className="text-sm font-medium">{step.title}</p>
            </div>
          ))}
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
              providerName={provider.business_name}
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
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold">Vérification en cours</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Votre dossier est en cours de vérification par notre équipe. 
                Vous recevrez un email dès que votre compte sera activé.
              </p>
              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Temps de traitement habituel: 24-48h
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
