import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Upload, User, Mail, Phone, MapPin, Briefcase, Award, Clock, Euro, CheckCircle, Shield, AlertCircle, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSecureForm } from '@/hooks/useSecureForm';
import { providerProfileSchema } from '@/lib/security-validation';
import { z } from 'zod';

interface ProviderData {
  id?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  personal_description?: string;
  business_name?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  avatar_url?: string;
  hourly_rate?: number;
  siret_number?: string;
  professional_status?: string;
  experience_years?: number;
  languages?: string[];
  universes?: string[];
  is_verified?: boolean;
  verification_status?: string;
  rejection_reason?: string;
}

const ProviderProfileForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProviderData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Secure form validation
  const { handleSubmit: secureSubmit, isSubmitting, errors } = useSecureForm({
    schema: providerProfileSchema,
    onSubmit: async (validatedData) => {
      console.log('Données validées:', validatedData);
      await executeSaveProfile(validatedData);
    },
    rateLimitKey: `provider_profile_${user?.id}`,
    rateLimitAction: 'update_provider_profile'
  });

  // Afficher les erreurs de validation dans la console
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.error('Erreurs de validation:', errors);
    }
  }, [errors]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      // Charger le profil utilisateur
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Charger les données prestataire si elles existent
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (providerError && providerError.code !== 'PGRST116') {
        throw providerError;
      }

      // Fusionner les données
      const combinedProfile = {
        ...profileData,
        ...providerData,
      };

      setProfile(combinedProfile);
    } catch (error: any) {
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger vos informations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}.${fileExt}`;
      const filePath = `provider-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('provider-applications')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('provider-applications')
        .getPublicUrl(filePath);

      handleInputChange('avatar_url', data.publicUrl);
      
      toast({
        title: "Photo mise à jour",
        description: "Votre photo de profil a été mise à jour",
      });
    } catch (error: any) {
      toast({
        title: "Erreur d'upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return !!(
          profile.first_name && 
          profile.last_name && 
          profile.email && 
          profile.phone &&
          profile.date_of_birth &&
          profile.professional_status &&
          profile.universes && profile.universes.length > 0
        );
      case 2:
        return !!(profile.description);
      default:
        return true;
    }
  };

  const saveProfile = () => {
    // Prepare data for validation
    const dataToValidate = {
      businessName: profile.business_name?.trim() || '',
      description: profile.description?.trim() || '',
      location: profile.city && profile.postal_code 
        ? `${profile.city} ${profile.postal_code}`.trim() 
        : profile.city?.trim() || '',
      postalCode: profile.postal_code?.trim() || '',
      hourlyRate: profile.hourly_rate || 22,
      services: [],
    };

    console.log('Données envoyées pour validation:', dataToValidate);
    
    // Trigger secure validation
    secureSubmit(dataToValidate);
  };

  const executeSaveProfile = async (validatedData: z.infer<typeof providerProfileSchema>) => {
    setSaving(true);
    try {
      // Sauvegarder le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          date_of_birth: profile.date_of_birth,
          gender: profile.gender,
          personal_description: profile.personal_description,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (profileError) throw profileError;

      // Sauvegarder les données prestataire with sanitized data (tarif fixe à 22€)
      const { error: providerError } = await supabase
        .from('providers')
        .upsert({
          user_id: user?.id,
          business_name: validatedData.businessName,
          description: validatedData.description,
          hourly_rate: 22,
          location: validatedData.location,
          postal_codes: profile.postal_code ? [profile.postal_code] : [],
          siret_number: profile.siret_number,
          professional_status: profile.professional_status,
          experience_years: profile.experience_years,
          languages: profile.languages || ['fr'],
          universes: profile.universes || [],
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (providerError) throw providerError;

      toast({
        title: "Profil mis à jour ! 🎉",
        description: "Vos informations ont été sauvegardées avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    } else {
      toast({
        title: "Informations manquantes",
        description: "Veuillez compléter tous les champs requis",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {[1, 2].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= step 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {validateStep(step) && currentStep > step ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              step
            )}
          </div>
          {step < 2 && (
            <div className={`w-12 h-0.5 ${
              currentStep > step ? 'bg-primary' : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {renderStepIndicator()}

      {/* Étape 1: Informations personnelles */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Informations personnelles</span>
              <Badge variant="outline" className="ml-2">
                <Shield className="w-3 h-3 mr-1" />
                Sécurisé
              </Badge>
            </CardTitle>
            <CardDescription>
              Renseignez vos informations de base pour créer votre profil prestataire
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo de profil */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.first_name, profile.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{uploading ? "Upload..." : "Changer la photo"}</span>
                  </div>
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadAvatar}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommandée pour rassurer les clients
                </p>
              </div>
            </div>

            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  value={profile.first_name || ''}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Votre prénom"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  value={profile.last_name || ''}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Votre nom"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  value={profile.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  required
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_name">Nom de l'entreprise (optionnel)</Label>
                <Input
                  id="business_name"
                  value={profile.business_name || ''}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  placeholder="Nom de votre entreprise"
                />
                {errors.businessName && (
                  <p className="text-sm text-destructive">{errors.businessName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="siret_number">SIRET (optionnel)</Label>
                <Input
                  id="siret_number"
                  value={profile.siret_number || ''}
                  onChange={(e) => handleInputChange('siret_number', e.target.value)}
                  placeholder="12345678901234"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date de naissance *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={profile.date_of_birth || ''}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Genre</Label>
                <Select
                  value={profile.gender || ''}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Homme</SelectItem>
                    <SelectItem value="female">Femme</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Description personnelle courte */}
            <div className="space-y-2">
              <Label htmlFor="personal_description">Description personnelle</Label>
              <Textarea
                id="personal_description"
                value={profile.personal_description || ''}
                onChange={(e) => handleInputChange('personal_description', e.target.value)}
                placeholder="Une courte présentation personnelle..."
                rows={3}
                className="resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {profile.personal_description?.length || 0}/500 caractères
              </p>
            </div>

            {/* Informations professionnelles */}
            <Separator className="my-4" />
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Briefcase className="h-5 w-5" />
              <span>Informations professionnelles</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="professional_status">Statut professionnel *</Label>
                <Select
                  value={profile.professional_status || ''}
                  onValueChange={(value) => handleInputChange('professional_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner votre statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto_entrepreneur">Auto-entrepreneur</SelectItem>
                    <SelectItem value="company">Société</SelectItem>
                    <SelectItem value="independent">Indépendant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience_years">Expérience (années)</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  value={profile.experience_years || ''}
                  onChange={(e) => handleInputChange('experience_years', parseInt(e.target.value) || 0)}
                  placeholder="5"
                />
              </div>
            </div>

            {/* Langues parlées */}
            <div className="space-y-2">
              <Label>Langues parlées</Label>
              <div className="flex flex-wrap gap-2">
                {['Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien', 'Arabe', 'Portugais'].map((lang) => {
                  const langCode = lang.toLowerCase().slice(0, 2);
                  const isSelected = profile.languages?.includes(langCode);
                  return (
                    <Badge
                      key={lang}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const currentLangs = profile.languages || ['fr'];
                        if (isSelected) {
                          handleInputChange('languages', currentLangs.filter(l => l !== langCode));
                        } else {
                          handleInputChange('languages', [...currentLangs, langCode]);
                        }
                      }}
                    >
                      {lang}
                      {isSelected && <CheckCircle className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Univers d'activité */}
            <div className="space-y-2">
              <Label>Univers d'activité *</Label>
              <p className="text-xs text-muted-foreground">Sélectionnez les domaines dans lesquels vous intervenez</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Kids', 'Maison', 'Vie', 'Animal', 'Seniors', 'Jardinage'].map((univers) => {
                  const isSelected = profile.universes?.includes(univers);
                  return (
                    <div
                      key={univers}
                      onClick={() => {
                        const currentUniverses = profile.universes || [];
                        if (isSelected) {
                          handleInputChange('universes', currentUniverses.filter(u => u !== univers));
                        } else {
                          handleInputChange('universes', [...currentUniverses, univers]);
                        }
                      }}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{univers}</span>
                        {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Adresse */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Adresse</span>
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="address">Adresse complète</Label>
                <Input
                  id="address"
                  value={profile.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Rue de la République"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    value={profile.postal_code || ''}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    placeholder="75001"
                  />
                  {errors.postalCode && (
                    <p className="text-sm text-destructive">{errors.postalCode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={profile.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Paris"
                  />
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 2: Présentation */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5" />
              <span>Présentation</span>
            </CardTitle>
            <CardDescription>
              Présentez votre expertise et vos compétences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="space-y-2">
              <Label htmlFor="description">Présentation et compétences *</Label>
              <Textarea
                id="description"
                value={profile.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Présentez-vous et décrivez vos compétences, votre expérience et vos spécialités..."
                rows={6}
                className="resize-none"
                maxLength={1000}
                required
              />
              {errors.description && (
                <p className="text-sm text-destructive font-medium">{errors.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {profile.description?.length || 0}/1000 caractères - Cette description sera visible par les clients.
              </p>
              {(!profile.description || profile.description.length < 10) && (
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  ⚠️ Minimum 10 caractères requis pour la description
                </p>
              )}
            </div>

          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          Précédent
        </Button>

        <div className="flex items-center space-x-2">
          {currentStep < 2 ? (
            <Button onClick={nextStep}>
              Suivant
            </Button>
          ) : (
            <Button onClick={saveProfile} disabled={saving || isSubmitting}>
              {saving || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                "Finaliser mon profil"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Statut de vérification */}
      <Card className="border-2">
        <CardContent className="pt-6">
          {profile.verification_status === 'approved' ? (
            <div className="flex items-center space-x-3 text-green-600">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <span className="font-semibold text-lg block">🟢 Profil actif</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Votre profil est vérifié et vous pouvez recevoir des missions.
                </p>
              </div>
            </div>
          ) : profile.verification_status === 'in_review' ? (
            <div className="flex items-center space-x-3 text-blue-600">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <span className="font-semibold text-lg block">🔵 En cours de vérification</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Votre profil est en cours d'examen. Vous recevrez une réponse sous 48h ouvrées.
                </p>
              </div>
            </div>
          ) : profile.verification_status === 'documents_received' ? (
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <span className="font-semibold text-lg block">🟠 Documents reçus</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Nous avons bien reçu vos documents. Vérification en cours.
                </p>
              </div>
            </div>
          ) : profile.verification_status === 'rejected' ? (
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3 text-red-600">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-semibold text-lg block">🔴 Profil refusé</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Votre profil nécessite des modifications.
                  </p>
                </div>
              </div>
              {profile.rejection_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Raison:</strong> {profile.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          ) : profile.verification_status === 'suspended' ? (
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <span className="font-semibold text-lg block">⛔ Profil suspendu</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Votre profil a été suspendu. Contactez l'administration.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <span className="font-semibold text-lg block">⏳ En attente</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Complétez votre profil et vos documents pour commencer.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderProfileForm;