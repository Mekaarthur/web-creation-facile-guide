import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { User } from 'lucide-react';
import { DocumentUpload } from '@/components/DocumentUpload';
import type { FormData } from './types';

interface Props {
  formData: FormData;
  onUpdate: (field: keyof FormData, value: any) => void;
}

export function ApplicationPersonalInfoCard({ formData, onUpdate }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Informations personnelles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">Prénom *</Label>
            <Input id="first_name" value={formData.first_name} onChange={(e) => onUpdate('first_name', e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="last_name">Nom *</Label>
            <Input id="last_name" value={formData.last_name} onChange={(e) => onUpdate('last_name', e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={formData.email} onChange={(e) => onUpdate('email', e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone *</Label>
            <Input id="phone" value={formData.phone} onChange={(e) => onUpdate('phone', e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">Ville *</Label>
            <Input id="city" value={formData.city} onChange={(e) => onUpdate('city', e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="postal_code">Code postal *</Label>
            <Input id="postal_code" value={formData.postal_code} onChange={(e) => onUpdate('postal_code', e.target.value)} required />
          </div>
        </div>

        <DocumentUpload
          label="Photo de profil"
          documentType="photo"
          currentUrl={formData.profile_photo_url}
          onUploadComplete={(url) => onUpdate('profile_photo_url', url)}
          accept=".jpg,.jpeg,.png"
        />

        <div>
          <Label htmlFor="business_name">Nom de l'entreprise (si applicable)</Label>
          <Input id="business_name" value={formData.business_name} onChange={(e) => onUpdate('business_name', e.target.value)} />
        </div>

        <div>
          <Label htmlFor="siret_number">Numéro SIRET (si applicable)</Label>
          <Input id="siret_number" value={formData.siret_number} onChange={(e) => onUpdate('siret_number', e.target.value)} />
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="mandat_facturation"
              checked={formData.mandat_facturation_accepte || false}
              onCheckedChange={(checked) => onUpdate('mandat_facturation_accepte', checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="mandat_facturation" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Mandat de facturation *
              </Label>
              <p className="text-sm text-muted-foreground">
                J'autorise Bikawo à établir mes factures en mon nom et pour mon compte conformément à la réglementation en vigueur.
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p><strong>Important :</strong> Ce mandat permet à Bikawo de :</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Émettre des factures en votre nom vers vos clients</li>
              <li>Gérer automatiquement votre facturation</li>
              <li>Vous transmettre vos fiches de rémunération sous 4 jours</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
