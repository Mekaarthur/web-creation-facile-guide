import { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, User, MapPin, Shield } from 'lucide-react';

export interface ProviderData {
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
  siret_number?: string;
  is_verified?: boolean;
  gender?: string;
  verification_status?: string;
  rejection_reason?: string;
  last_status_change_at?: string;
}

interface Props {
  profile: ProviderData;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  uploading: boolean;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const getInitials = (firstName?: string, lastName?: string) =>
  `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

export function ProfilePersonalInfoStep({ profile, errors, onChange, uploading, onAvatarUpload }: Props) {
  const avatarInputRef = useRef<HTMLInputElement>(null);

  return (
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
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="text-lg">{getInitials(profile.first_name, profile.last_name)}</AvatarFallback>
          </Avatar>
          <div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarUpload} disabled={uploading} />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span>{uploading ? 'Upload...' : 'Changer la photo'}</span>
            </button>
            <p className="text-xs text-muted-foreground mt-1">Recommandée pour rassurer les clients</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Prénom *</Label>
            <Input id="first_name" value={profile.first_name || ''} onChange={(e) => onChange('first_name', e.target.value)} placeholder="Votre prénom" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Nom *</Label>
            <Input id="last_name" value={profile.last_name || ''} onChange={(e) => onChange('last_name', e.target.value)} placeholder="Votre nom" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={profile.email || ''} onChange={(e) => onChange('email', e.target.value)} placeholder="votre@email.com" required />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone *</Label>
            <Input id="phone" value={profile.phone || ''} onChange={(e) => onChange('phone', e.target.value)} placeholder="+33 6 12 34 56 78" required />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="business_name">Nom de l'entreprise (optionnel)</Label>
            <Input id="business_name" value={profile.business_name || ''} onChange={(e) => onChange('business_name', e.target.value)} placeholder="Nom de votre entreprise" />
            {errors.businessName && <p className="text-sm text-destructive">{errors.businessName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="siret_number">SIRET (optionnel)</Label>
            <Input id="siret_number" value={profile.siret_number || ''} onChange={(e) => onChange('siret_number', e.target.value)} placeholder="12345678901234" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Genre</Label>
            <Select value={profile.gender || ''} onValueChange={(value) => onChange('gender', value)}>
              <SelectTrigger id="gender"><SelectValue placeholder="Sélectionnez votre genre" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="homme">Homme</SelectItem>
                <SelectItem value="femme">Femme</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Adresse</span>
          </h3>
          <div className="space-y-2">
            <Label htmlFor="address">Adresse complète</Label>
            <Input id="address" value={profile.address || ''} onChange={(e) => onChange('address', e.target.value)} placeholder="123 Rue de la République" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Code postal</Label>
              <Input id="postal_code" value={profile.postal_code || ''} onChange={(e) => onChange('postal_code', e.target.value)} placeholder="75001" />
              {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" value={profile.city || ''} onChange={(e) => onChange('city', e.target.value)} placeholder="Paris" />
              {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
