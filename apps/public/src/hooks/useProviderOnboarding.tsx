import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  required: boolean;
}

const STEPS_BASE: OnboardingStep[] = [
  { id: 'documents', label: 'Documents', description: 'Téléchargez vos documents officiels', completed: false, required: true },
  { id: 'mandate', label: 'Mandat de facturation', description: 'Signez le mandat de facturation électronique', completed: false, required: true },
  { id: 'identity', label: "Vérification d'identité", description: 'Validation de votre identité par nos équipes', completed: false, required: true },
];

const fetchOnboardingStatus = async (userId: string) => {
  const { data: providerData, error: providerError } = await supabase
    .from('providers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (providerError) throw providerError;
  if (!providerData) return { provider: null, steps: STEPS_BASE };

  const { data: documentsData } = await supabase
    .from('provider_documents')
    .select('*')
    .eq('provider_id', providerData.id)
    .eq('status', 'approved');

  const requiredDocs = ['identity_document', 'siret_document', 'rib_iban'];
  const hasAllDocs = requiredDocs.every(type =>
    documentsData?.some((doc: any) => doc.document_type === type)
  );

  const providerAny = providerData as any;
  const steps: OnboardingStep[] = STEPS_BASE.map(step => {
    if (step.id === 'documents') return { ...step, completed: hasAllDocs };
    if (step.id === 'mandate') return { ...step, completed: providerData.mandat_facturation_accepte || false };
    if (step.id === 'identity') return { ...step, completed: providerAny.identity_verified || false };
    return step;
  });

  return { provider: providerData, steps };
};

export const useProviderOnboarding = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  const queryKey = ['provider-onboarding', user?.id] as const;

  const { data, isLoading: loading } = useQuery({
    queryKey,
    queryFn: () => fetchOnboardingStatus(user!.id),
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const provider = data?.provider ?? null;
  const steps = data?.steps ?? STEPS_BASE;

  const completeStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      if (!provider) return;
      const updateData: any = {};
      if (stepId === 'mandate') {
        updateData.mandat_facturation_accepte = true;
        updateData.mandat_signature_date = new Date().toISOString();
      }
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase.from('providers').update(updateData).eq('id', provider.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
  });

  const isOnboardingComplete = () => steps.filter(s => s.required).every(s => s.completed);

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
    completeStep: completeStepMutation.mutateAsync,
    isOnboardingComplete,
    getProgress,
    reloadStatus: () => qc.invalidateQueries({ queryKey }),
  };
};
