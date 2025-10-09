import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export const useProviderOnboarding = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'documents',
      label: 'Documents',
      description: 'Téléchargez vos documents officiels',
      completed: false,
      required: true
    },
    {
      id: 'mandate',
      label: 'Mandat de facturation',
      description: 'Signez le mandat de facturation électronique',
      completed: false,
      required: true
    },
    {
      id: 'training',
      label: 'Formation',
      description: 'Suivez la formation obligatoire (30 min)',
      completed: false,
      required: true
    },
    {
      id: 'identity',
      label: 'Vérification d\'identité',
      description: 'Validation de votre identité par nos équipes',
      completed: false,
      required: true
    }
  ]);

  useEffect(() => {
    if (user) {
      loadOnboardingStatus();
    }
  }, [user]);

  const loadOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (providerData) {
        setProvider(providerData);

        // Vérifier les documents
        const { data: documentsData } = await supabase
          .from('provider_documents')
          .select('*')
          .eq('provider_id', providerData.id)
          .eq('status', 'approved');

        const requiredDocs = ['identity_document', 'criminal_record', 'siret_document', 'rib_iban'];
        const hasAllDocs = requiredDocs.every(type =>
          documentsData?.some(doc => doc.document_type === type)
        );

        // Mettre à jour les étapes (cast temporaire en attendant la regénération des types)
        const providerAny = providerData as any;
        setSteps(prev => prev.map(step => {
          if (step.id === 'documents') {
            return { ...step, completed: hasAllDocs };
          }
          if (step.id === 'mandate') {
            return { ...step, completed: providerData.mandat_facturation_accepte || false };
          }
          if (step.id === 'training') {
            return { ...step, completed: providerAny.formation_completed || false };
          }
          if (step.id === 'identity') {
            return { ...step, completed: providerAny.identity_verified || false };
          }
          return step;
        }));

        // Déterminer l'étape actuelle
        const completedSteps = steps.filter(s => s.completed).length;
        setCurrentStep(Math.min(completedSteps, steps.length - 1));
      }
    } catch (error) {
      console.error('Erreur chargement onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (stepId: string) => {
    if (!provider) return;

    try {
      const updateData: any = {};
      
      if (stepId === 'mandate') {
        updateData.mandat_facturation_accepte = true;
        updateData.mandat_signature_date = new Date().toISOString();
      } else if (stepId === 'training') {
        updateData.formation_completed = true;
        updateData.formation_completed_at = new Date().toISOString();
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('providers')
          .update(updateData)
          .eq('id', provider.id);

        if (error) throw error;
      }

      await loadOnboardingStatus();
    } catch (error) {
      console.error('Erreur completion step:', error);
      throw error;
    }
  };

  const isOnboardingComplete = () => {
    return steps.filter(s => s.required).every(s => s.completed);
  };

  const getProgress = () => {
    const requiredSteps = steps.filter(s => s.required);
    const completedRequired = requiredSteps.filter(s => s.completed);
    return Math.round((completedRequired.length / requiredSteps.length) * 100);
  };

  return {
    loading,
    provider,
    steps,
    currentStep,
    setCurrentStep,
    completeStep,
    isOnboardingComplete,
    getProgress,
    reloadStatus: loadOnboardingStatus
  };
};
