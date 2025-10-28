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
import { Loader2, Upload, User, Mail, Phone, MapPin, Briefcase, Award, Clock, Euro, CheckCircle, Shield } from 'lucide-react';
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
  business_name?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  avatar_url?: string;
  hourly_rate?: number;
  service_zones?: string[];
  selected_services?: string[];
  availability?: {
    monday?: { start: string; end: string; available: boolean };
    tuesday?: { start: string; end: string; available: boolean };
    wednesday?: { start: string; end: string; available: boolean };
    thursday?: { start: string; end: string; available: boolean };
    friday?: { start: string; end: string; available: boolean };
    saturday?: { start: string; end: string; available: boolean };
    sunday?: { start: string; end: string; available: boolean };
  };
  certifications?: string;
  siret_number?: string;
  is_verified?: boolean;
}

// Zones géographiques disponibles (Île-de-France)
const ZONES_INTERVENTION = [
  { code: '75', name: 'Paris (75)' },
  { code: '77', name: 'Seine-et-Marne (77)' },
  { code: '78', name: 'Yvelines (78)' },
  { code: '91', name: 'Essonne (91)' },
  { code: '92', name: 'Hauts-de-Seine (92)' },
  { code: '93', name: 'Seine-Saint-Denis (93)' },
  { code: '94', name: 'Val-de-Marne (94)' },
  { code: '95', name: 'Val-d\'Oise (95)' },
  { code: '60', name: 'Oise (60)' },
];

// Services disponibles
const SERVICES_DISPONIBLES = [
  { key: 'kids', name: 'Bika Kids - Services aux enfants', icon: '🧸' },
  { key: 'maison', name: 'Bika Maison - Gestion du foyer', icon: '🏠' },
  { key: 'vie', name: 'Bika Vie - Conciergerie complète', icon: '🔑' },
  { key: 'travel', name: 'Bika Travel - Assistance voyage', icon: '✈️' },
  { key: 'animals', name: 'Bika Animal - Univers animalier', icon: '🐾' },
  { key: 'seniors', name: 'Bika Seniors - Accompagnement seniors', icon: '👴' },
  { key: 'pro', name: 'Bika Pro - Services aux entreprises', icon: '💼' },
  { key: 'plus', name: 'Bika Plus - Services premium', icon: '💎' },
];

const JOURS_SEMAINE = [
  { key: 'monday', name: 'Lundi' },
  { key: 'tuesday', name: 'Mardi' },
  { key: 'wednesday', name: 'Mercredi' },
  { key: 'thursday', name: 'Jeudi' },
  { key: 'friday', name: 'Vendredi' },
  { key: 'saturday', name: 'Samedi' },
  { key: 'sunday', name: 'Dimanche' },
];

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
      await executeSaveProfile(validatedData);
    },
    rateLimitKey: `provider_profile_${user?.id}`,
    rateLimitAction: 'update_provider_profile'
  });

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
        service_zones: providerData?.postal_codes || [],
        selected_services: providerData?.service_zones || [],
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

  const handleZoneToggle = (zoneCode: string) => {
    const currentZones = profile.service_zones || [];
    const newZones = currentZones.includes(zoneCode)
      ? currentZones.filter(z => z !== zoneCode)
      : [...currentZones, zoneCode];
    
    handleInputChange('service_zones', newZones);
  };

  const handleServiceToggle = (serviceKey: string) => {
    const currentServices = profile.selected_services || [];
    const newServices = currentServices.includes(serviceKey)
      ? currentServices.filter(s => s !== serviceKey)
      : [...currentServices, serviceKey];
    
    handleInputChange('selected_services', newServices);
  };

  const handleAvailabilityChange = (day: string, field: 'start' | 'end' | 'available', value: string | boolean) => {
    setProfile(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability?.[day],
          [field]: value
        }
      }
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
        return !!(profile.first_name && profile.last_name && profile.email && profile.phone);
      case 2:
        return !!(profile.service_zones?.length && profile.selected_services?.length);
      case 3:
        return !!(profile.description);
      default:
        return true;
    }
  };

  const saveProfile = () => {
    // Trigger secure validation
    secureSubmit({
      businessName: profile.business_name || '',
      description: profile.description || '',
      location: `${profile.city} ${profile.postal_code}` || '',
      postalCode: profile.postal_code || '',
      hourlyRate: profile.hourly_rate || 0,
      services: profile.selected_services || [],
    });
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
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          postal_code: validatedData.postalCode,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
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
          postal_codes: profile.service_zones,
          service_categories: validatedData.services,
          location: validatedData.location,
          siret_number: profile.siret_number,
          updated_at: new Date().toISOString(),
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
      setCurrentStep(prev => Math.min(prev + 1, 4));
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
      {[1, 2, 3, 4].map((step) => (
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
          {step < 4 && (
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
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 2: Zones et Services */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Zones d'intervention et services</span>
            </CardTitle>
            <CardDescription>
              Définissez vos zones d'intervention et les types de services que vous proposez
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Zones d'intervention */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <Label className="text-base font-medium">Zones d'intervention *</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Sélectionnez les départements où vous pouvez intervenir
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ZONES_INTERVENTION.map((zone) => (
                  <div key={zone.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`zone-${zone.code}`}
                      checked={profile.service_zones?.includes(zone.code) || false}
                      onCheckedChange={() => handleZoneToggle(zone.code)}
                    />
                    <Label htmlFor={`zone-${zone.code}`} className="text-sm font-normal">
                      {zone.name}
                    </Label>
                  </div>
                ))}
              </div>
              
              {profile.service_zones?.length ? (
                <div className="flex flex-wrap gap-2">
                  {profile.service_zones.map((zoneCode) => {
                    const zone = ZONES_INTERVENTION.find(z => z.code === zoneCode);
                    return zone ? (
                      <Badge key={zoneCode} variant="secondary">
                        {zone.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              ) : null}
            </div>

            <Separator />

            {/* Types de services */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <Label className="text-base font-medium">Types de services proposés *</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Choisissez les catégories de services que vous souhaitez proposer
              </p>
              
              <div className="grid gap-3">
                {SERVICES_DISPONIBLES.map((service) => (
                  <div key={service.key} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent">
                    <Checkbox
                      id={`service-${service.key}`}
                      checked={profile.selected_services?.includes(service.key) || false}
                      onCheckedChange={() => handleServiceToggle(service.key)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`service-${service.key}`} className="text-sm font-medium cursor-pointer">
                        <span className="mr-2">{service.icon}</span>
                        {service.name}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
              
              {profile.selected_services?.length ? (
                <div className="flex flex-wrap gap-2">
                  {profile.selected_services.map((serviceKey) => {
                    const service = SERVICES_DISPONIBLES.find(s => s.key === serviceKey);
                    return service ? (
                      <Badge key={serviceKey} variant="outline">
                        <span className="mr-1">{service.icon}</span>
                        {service.name.split(' - ')[0]}
                      </Badge>
                    ) : null;
                  })}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 3: Présentation */}
      {currentStep === 3 && (
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
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {profile.description?.length || 0}/1000 caractères - Cette description sera visible par les clients.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certifications">Certifications et diplômes</Label>
              <Textarea
                id="certifications"
                value={profile.certifications || ''}
                onChange={(e) => handleInputChange('certifications', e.target.value)}
                placeholder="Listez vos certifications, diplômes et formations pertinentes..."
                rows={3}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 4: Disponibilités */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Disponibilités</span>
            </CardTitle>
            <CardDescription>
              Définissez vos créneaux de disponibilité pour recevoir des demandes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {JOURS_SEMAINE.map((jour) => (
                <div key={jour.key} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 min-w-[120px]">
                    <Checkbox
                      id={`available-${jour.key}`}
                      checked={profile.availability?.[jour.key]?.available || false}
                      onCheckedChange={(checked) => 
                        handleAvailabilityChange(jour.key, 'available', checked)
                      }
                    />
                    <Label htmlFor={`available-${jour.key}`} className="font-medium">
                      {jour.name}
                    </Label>
                  </div>

                  {profile.availability?.[jour.key]?.available && (
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm">De</Label>
                      <Select
                        value={profile.availability[jour.key]?.start || '08:00'}
                        onValueChange={(value) => 
                          handleAvailabilityChange(jour.key, 'start', value)
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 24}, (_, i) => (
                            <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                              {`${i.toString().padStart(2, '0')}:00`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Label className="text-sm">à</Label>
                      <Select
                        value={profile.availability[jour.key]?.end || '18:00'}
                        onValueChange={(value) => 
                          handleAvailabilityChange(jour.key, 'end', value)
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 24}, (_, i) => (
                            <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                              {`${i.toString().padStart(2, '0')}:00`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Astuce :</strong> Plus vous êtes disponible, plus vous recevrez de demandes. 
                Vous pourrez toujours refuser une mission si elle ne vous convient pas.
              </p>
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
          {currentStep < 4 ? (
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
      {profile.is_verified !== undefined && (
        <Card>
          <CardContent className="pt-6">
            <div className={`flex items-center space-x-2 ${
              profile.is_verified ? 'text-green-600' : 'text-amber-600'
            }`}>
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                {profile.is_verified 
                  ? 'Profil vérifié et activé' 
                  : 'En attente de vérification'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {profile.is_verified
                ? 'Votre profil est actif et visible par les clients.'
                : 'Votre profil sera examiné par notre équipe sous 48h.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProviderProfileForm;