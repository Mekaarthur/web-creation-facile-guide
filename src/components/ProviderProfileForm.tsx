import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CheckCircle } from 'lucide-react';
import { useSecureForm } from '@/hooks/useSecureForm';
import { providerProfileSchema } from '@/lib/security-validation';
import { z } from 'zod';
import { ProfilePersonalInfoStep, type ProviderData } from '@/components/provider/ProfilePersonalInfoStep';
import { ProfilePresentationStep } from '@/components/provider/ProfilePresentationStep';
import { VerificationStatusCard } from '@/components/provider/VerificationStatusCard';

const ProviderProfileForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProviderData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const { handleSubmit: secureSubmit, isSubmitting, errors } = useSecureForm({
    schema: providerProfileSchema,
    onSubmit: async (validatedData) => {
      await executeSaveProfile(validatedData);
    },
    rateLimitKey: `provider_profile_${user?.id}`,
    rateLimitAction: 'update_provider_profile',
    rateLimitConfig: { maxAttempts: 15, windowMs: 60000 },
  });

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.error('Erreurs de validation:', errors);
    }
  }, [errors]);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const [{ data: profileData, error: profileError }, { data: providerData, error: providerError }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user?.id).maybeSingle(),
        supabase.from('providers').select('*').eq('user_id', user?.id).maybeSingle(),
      ]);
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      if (providerError && providerError.code !== 'PGRST116') throw providerError;
      setProfile({ ...profileData, ...providerData });
    } catch {
      toast({ title: "Erreur de chargement", description: "Impossible de charger vos informations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user?.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('profiles').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
      handleInputChange('avatar_url', data.publicUrl);
      toast({ title: "Photo mise à jour", description: "Votre photo de profil a été mise à jour" });
    } catch (error: any) {
      toast({ title: "Erreur d'upload", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const validateStep = (step: number) => {
    if (step === 1) return !!(profile.first_name && profile.last_name && profile.email && profile.phone);
    if (step === 2) return !!(profile.description);
    return true;
  };

  const saveProfile = () => {
    if (!profile.description || profile.description.trim().length < 10) {
      toast({ title: "Description requise", description: "Veuillez saisir une description d'au moins 10 caractères", variant: "destructive" });
      return;
    }
    secureSubmit({
      businessName: profile.business_name?.trim() || '',
      description: profile.description?.trim() || '',
      location: profile.city && profile.postal_code ? `${profile.city} ${profile.postal_code}`.trim() : profile.city?.trim() || '',
      postalCode: profile.postal_code?.trim() || '',
      hourlyRate: profile.hourly_rate || 22,
      services: [],
    });
  };

  const executeSaveProfile = async (validatedData: z.infer<typeof providerProfileSchema>) => {
    setSaving(true);
    try {
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: user?.id, first_name: profile.first_name, last_name: profile.last_name,
        email: profile.email, phone: profile.phone, address: profile.address,
        avatar_url: profile.avatar_url, gender: profile.gender, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (profileError) throw profileError;

      const { error: providerError } = await supabase.from('providers').upsert({
        user_id: user?.id, business_name: validatedData.businessName, description: validatedData.description,
        hourly_rate: 22, location: validatedData.location,
        postal_codes: profile.postal_code ? [profile.postal_code] : [],
        siret_number: profile.siret_number, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (providerError) throw providerError;

      toast({ title: "Profil mis à jour ! 🎉", description: "Vos informations ont été sauvegardées avec succès" });
    } catch (error: any) {
      toast({ title: "Erreur de sauvegarde", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    } else {
      toast({ title: "Informations manquantes", description: "Veuillez compléter tous les champs requis", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {validateStep(step) && currentStep > step ? <CheckCircle className="w-4 h-4" /> : step}
            </div>
            {step < 2 && <div className={`w-12 h-0.5 ${currentStep > step ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      {currentStep === 1 && (
        <ProfilePersonalInfoStep
          profile={profile}
          errors={errors}
          onChange={handleInputChange}
          uploading={uploading}
          onAvatarUpload={uploadAvatar}
        />
      )}

      {currentStep === 2 && (
        <ProfilePresentationStep
          description={profile.description || ''}
          errors={errors}
          onChange={handleInputChange}
        />
      )}

      {Object.keys(errors).length > 0 && (
        <div className="p-3 rounded-lg border border-destructive bg-destructive/10">
          <p className="text-sm font-medium text-destructive mb-1">Veuillez corriger les erreurs :</p>
          {Object.entries(errors).map(([key, msg]) => (
            <p key={key} className="text-sm text-destructive">• {msg}</p>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))} disabled={currentStep === 1}>
          Précédent
        </Button>
        {currentStep < 2 ? (
          <Button onClick={nextStep}>Suivant</Button>
        ) : (
          <Button onClick={saveProfile} disabled={saving || isSubmitting}>
            {saving || isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sauvegarde...</> : 'Finaliser mon profil'}
          </Button>
        )}
      </div>

      {profile.verification_status && (
        <VerificationStatusCard
          status={profile.verification_status}
          rejectionReason={profile.rejection_reason}
          lastStatusChangeAt={profile.last_status_change_at}
        />
      )}
    </div>
  );
};

export default ProviderProfileForm;
