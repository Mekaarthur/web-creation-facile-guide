import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ApplicationPersonalInfoCard } from './provider/application/ApplicationPersonalInfoCard';
import { ApplicationServicesCard } from './provider/application/ApplicationServicesCard';
import { ApplicationAvailabilityCard } from './provider/application/ApplicationAvailabilityCard';
import { ApplicationCoverageCard } from './provider/application/ApplicationCoverageCard';
import { ApplicationDocumentsCard } from './provider/application/ApplicationDocumentsCard';
import { ApplicationExperienceCard } from './provider/application/ApplicationExperienceCard';
import { INITIAL_FORM_DATA, type FormData } from './provider/application/types';

export const ProviderApplicationForm = () => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }
      if (formData.service_categories.length === 0) {
        throw new Error('Veuillez sélectionner au moins une catégorie de service');
      }
      if (!formData.identity_document_url) {
        throw new Error("La pièce d'identité est obligatoire");
      }

      const { error } = await supabase.from('job_applications').insert({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        category: formData.service_categories.join(', '),
        experience_years: formData.experience_years,
        availability: `${formData.availability_days.join(', ')} - ${formData.availability_hours}`,
        motivation: formData.motivation,
        has_transport: formData.has_transport,
        certifications: formData.certifications,
        cv_file_url: formData.identity_document_url || null,
        status: 'pending',
      });

      if (error) throw error;

      await supabase.functions.invoke('create-admin-notification', {
        body: {
          type: 'provider_application',
          title: '📋 Nouvelle candidature prestataire',
          message: `${formData.first_name} ${formData.last_name} a postulé pour devenir prestataire (${formData.service_categories.join(', ')})`,
          data: {
            provider_name: `${formData.first_name} ${formData.last_name}`,
            provider_email: formData.email,
            provider_phone: formData.phone,
            service_categories: formData.service_categories.join(', '),
          },
          priority: 'high',
        },
      });

      toast({
        title: 'Candidature envoyée !',
        description: 'Votre candidature a été soumise avec succès. Nous vous contacterons rapidement.',
      });

      setFormData(INITIAL_FORM_DATA);
    } catch (error: any) {
      console.error('Erreur candidature:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Impossible d'envoyer la candidature",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sharedProps = { formData, onUpdate: updateFormData };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <ApplicationPersonalInfoCard {...sharedProps} />
      <ApplicationServicesCard {...sharedProps} />
      <ApplicationAvailabilityCard {...sharedProps} />
      <ApplicationCoverageCard {...sharedProps} />
      <ApplicationDocumentsCard {...sharedProps} />
      <ApplicationExperienceCard {...sharedProps} />

      <div className="flex justify-center">
        <Button type="submit" size="lg" disabled={loading} className="px-8">
          {loading ? 'Envoi en cours...' : 'Envoyer ma candidature'}
        </Button>
      </div>
    </form>
  );
};
