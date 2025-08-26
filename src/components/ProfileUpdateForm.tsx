import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Upload, User, Mail, Phone, MapPin, Globe, Briefcase, Award } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ProfileData {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  avatar_url?: string;
  user_type?: string;
  preferences?: any;
  specialties?: any;
  intervention_zones?: any;
  certifications?: any;
}

interface ProfileUpdateFormProps {
  userType?: 'client' | 'provider';
}

const ProfileUpdateForm = ({ userType = 'client' }: ProfileUpdateFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // Créer un profil par défaut si il n'existe pas
        setProfile({
          first_name: '',
          last_name: '',
          email: user?.email || '',
          phone: '',
          address: '',
          postal_code: '',
          city: '',
          country: 'France',
          avatar_url: '',
          user_type: userType,
        });
      }
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

  const handleInputChange = (field: string, value: string) => {
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
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('profiles')
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

  const validateForm = () => {
    if (!profile.first_name || !profile.last_name) {
      toast({
        title: "Champs requis",
        description: "Le prénom et le nom sont obligatoires",
        variant: "destructive",
      });
      return false;
    }

    if (profile.email && !/\S+@\S+\.\S+/.test(profile.email)) {
      toast({
        title: "Email invalide",
        description: "Veuillez entrer un email valide",
        variant: "destructive",
      });
      return false;
    }

    if (profile.phone && !/^[\d\s\-\+\(\)]+$/.test(profile.phone)) {
      toast({
        title: "Téléphone invalide",
        description: "Veuillez entrer un numéro de téléphone valide",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const saveProfile = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          ...profile,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

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

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Mes informations personnelles</span>
        </CardTitle>
        <CardDescription>
          Mettez à jour vos informations personnelles et de contact
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
              JPG, PNG ou GIF, max 5MB
            </p>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Prénom *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="first_name"
                value={profile.first_name || ''}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Votre prénom"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Nom *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="last_name"
                value={profile.last_name || ''}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Votre nom"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={profile.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="votre@email.com"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                value={profile.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className="pl-10"
              />
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Code postal</Label>
              <Input
                id="postal_code"
                value={profile.postal_code || ''}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                placeholder="75001"
              />
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

            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="country"
                  value={profile.country || 'France'}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Informations spécifiques selon le type d'utilisateur */}
        {userType === 'client' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Préférences</h3>
            <div className="space-y-2">
              <Label htmlFor="preferences">Préférences de service</Label>
              <Textarea
                id="preferences"
                value={profile.preferences?.description || ''}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, description: e.target.value }
                }))}
                placeholder="Décrivez vos préférences (type de voyages, besoins spécifiques, etc.)"
                rows={3}
              />
            </div>
          </div>
        )}

        {userType === 'provider' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Briefcase className="h-5 w-5" />
              <span>Informations professionnelles</span>
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="specialties">Spécialités</Label>
              <Textarea
                id="specialties"
                value={profile.specialties?.description || ''}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  specialties: { ...prev.specialties, description: e.target.value }
                }))}
                placeholder="Décrivez vos spécialités et compétences"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="intervention_zones">Zones d'intervention</Label>
              <Textarea
                id="intervention_zones"
                value={profile.intervention_zones?.description || ''}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  intervention_zones: { ...prev.intervention_zones, description: e.target.value }
                }))}
                placeholder="Indiquez vos zones d'intervention (départements, villes, etc.)"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certifications" className="flex items-center space-x-2">
                <Award className="h-4 w-4" />
                <span>Certifications</span>
              </Label>
              <Textarea
                id="certifications"
                value={profile.certifications?.description || ''}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  certifications: { ...prev.certifications, description: e.target.value }
                }))}
                placeholder="Listez vos certifications, diplômes et formations"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Bouton de sauvegarde */}
        <div className="pt-4">
          <Button
            onClick={saveProfile}
            disabled={saving}
            className="w-full md:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              "Sauvegarder les modifications"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileUpdateForm;