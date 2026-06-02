import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Upload, User, Mail, Phone, MapPin, Shield } from 'lucide-react';
import { useSecureForm } from '@/hooks/useSecureForm';
import { z } from 'zod';
import { nameSchema, emailSchema, phoneSchema } from '@/lib/security-validation';
import { Badge } from '@/components/ui/badge';

interface ProfileData {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  user_type?: string;
}

interface ProfileUpdateFormProps {
  userType?: 'client' | 'provider';
}

const profileSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: z.string().max(200, "Adresse trop longue (max 200 caractères)").optional(),
});

const ProfileUpdateForm = ({ userType = 'client' }: ProfileUpdateFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Secure form validation
  const { handleSubmit: secureSubmit, isSubmitting, errors } = useSecureForm({
    schema: profileSchema,
    onSubmit: async (validatedData) => {
      await executeSaveProfile(validatedData);
    },
    rateLimitKey: `profile_${user?.id}`,
    rateLimitAction: 'update_profile'
  });

  const { data: serverProfile, isLoading: loading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles').select('*').eq('user_id', user!.id).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return (data ?? { first_name: '', last_name: '', email: user?.email || '', phone: '', address: '', avatar_url: '', user_type: userType }) as ProfileData;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Populate form from server data on first load
  useEffect(() => {
    if (serverProfile) setProfile(serverProfile);
  }, [serverProfile]);

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

  const saveProfile = () => {
    // Trigger secure validation
    secureSubmit({
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
    });
  };

  const executeSaveProfile = async (validatedData: z.infer<typeof profileSchema>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          email: validatedData.email,
          phone: validatedData.phone || null,
          address: validatedData.address || null,
          avatar_url: profile.avatar_url || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

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
          <Badge variant="outline" className="ml-2">
            <Shield className="w-3 h-3 mr-1" />
            Sécurisé
          </Badge>
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
            {errors.first_name && (
              <p className="text-sm text-destructive">{errors.first_name}</p>
            )}
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
            {errors.last_name && (
              <p className="text-sm text-destructive">{errors.last_name}</p>
            )}
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
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
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
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
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
              placeholder="123 Rue de la République, 75001 Paris"
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address}</p>
            )}
          </div>
        </div>


        {/* Bouton de sauvegarde */}
        <div className="pt-4">
          <Button
            onClick={saveProfile}
            disabled={saving || isSubmitting}
            className="w-full md:w-auto"
          >
            {saving || isSubmitting ? (
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