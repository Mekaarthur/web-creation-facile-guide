import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Clock, Euro, FileText, Upload } from "lucide-react";
import { DocumentUpload } from "./DocumentUpload";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface FormData {
  // Identité
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  postal_code: string;
  profile_photo_url: string;
  
  // Business
  business_name: string;
  description: string;
  siret_number: string;
  
  // Services
  service_categories: string[];
  hourly_rate: number;
  
  // Disponibilités
  availability_days: string[];
  availability_hours: string;
  
  // Zone de couverture
  coverage_address: string;
  coverage_radius: number;
  
  // Documents
  identity_document_url: string;
  diploma_urls: string[];
  insurance_document_url: string;
  
  // Expérience
  experience_years: number;
  has_transport: boolean;
  certifications: string;
  motivation: string;
}

const SERVICE_CATEGORIES = [
  'Ménage et entretien',
  'Garde d\'enfants',
  'Aide aux seniors',
  'Coiffure',
  'Beauté',
  'Jardinage',
  'Bricolage',
  'Informatique',
  'Cours particuliers',
  'Livraison',
  'Déménagement',
  'Nettoyage auto',
  'Autre'
];

const DAYS = [
  'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
];

export const ProviderApplicationForm = () => {
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    postal_code: '',
    profile_photo_url: '',
    business_name: '',
    description: '',
    siret_number: '',
    service_categories: [],
    hourly_rate: 0,
    availability_days: [],
    availability_hours: '09h00 - 18h00',
    coverage_address: '',
    coverage_radius: 20,
    identity_document_url: '',
    diploma_urls: [],
    insurance_document_url: '',
    experience_years: 0,
    has_transport: false,
    certifications: '',
    motivation: ''
  });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (category: string) => {
    const current = formData.service_categories;
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    updateFormData('service_categories', updated);
  };

  const toggleDay = (day: string) => {
    const current = formData.availability_days;
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    updateFormData('availability_days', updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation basique
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      if (formData.service_categories.length === 0) {
        throw new Error('Veuillez sélectionner au moins une catégorie de service');
      }

      if (!formData.identity_document_url) {
        throw new Error('La pièce d\'identité est obligatoire');
      }

      const { error } = await supabase
        .from('job_applications')
        .insert({
          ...formData,
          category: formData.service_categories.join(', '), // Pour compatibilité
          availability: `${formData.availability_days.join(', ')} - ${formData.availability_hours}`,
          status: 'pending',
          application_date: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Candidature envoyée !",
        description: "Votre candidature a été soumise avec succès. Nous vous contacterons rapidement.",
      });

      // Reset du formulaire
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        city: '',
        postal_code: '',
        profile_photo_url: '',
        business_name: '',
        description: '',
        siret_number: '',
        service_categories: [],
        hourly_rate: 0,
        availability_days: [],
        availability_hours: '09h00 - 18h00',
        coverage_address: '',
        coverage_radius: 20,
        identity_document_url: '',
        diploma_urls: [],
        insurance_document_url: '',
        experience_years: 0,
        has_transport: false,
        certifications: '',
        motivation: ''
      });

    } catch (error: any) {
      console.error('Erreur candidature:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer la candidature",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Identité */}
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
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => updateFormData('first_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => updateFormData('last_name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateFormData('city', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="postal_code">Code postal *</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => updateFormData('postal_code', e.target.value)}
                required
              />
            </div>
          </div>

          <DocumentUpload
            label="Photo de profil"
            documentType="photo"
            currentUrl={formData.profile_photo_url}
            onUploadComplete={(url) => updateFormData('profile_photo_url', url)}
            accept=".jpg,.jpeg,.png"
          />

          <div>
            <Label htmlFor="business_name">Nom de l'entreprise (si applicable)</Label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(e) => updateFormData('business_name', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="siret_number">Numéro SIRET (si applicable)</Label>
            <Input
              id="siret_number"
              value={formData.siret_number}
              onChange={(e) => updateFormData('siret_number', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Services et tarifs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="w-5 h-5" />
            Services et tarifs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Catégories de services *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {SERVICE_CATEGORIES.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={formData.service_categories.includes(category)}
                    onCheckedChange={() => toggleCategory(category)}
                  />
                  <Label htmlFor={category} className="text-sm">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
            {formData.service_categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.service_categories.map(cat => (
                  <Badge key={cat} variant="secondary">{cat}</Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="hourly_rate">Tarif horaire souhaité (€/h)</Label>
            <Input
              id="hourly_rate"
              type="number"
              min="0"
              step="0.50"
              value={formData.hourly_rate}
              onChange={(e) => updateFormData('hourly_rate', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <Label htmlFor="description">Description de vos services</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Décrivez votre expérience et vos compétences..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Disponibilités */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Disponibilités
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Jours disponibles *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {DAYS.map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={formData.availability_days.includes(day)}
                    onCheckedChange={() => toggleDay(day)}
                  />
                  <Label htmlFor={day} className="text-sm capitalize">
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="availability_hours">Horaires</Label>
            <Select 
              value={formData.availability_hours} 
              onValueChange={(value) => updateFormData('availability_hours', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez vos horaires" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="09h00 - 18h00">09h00 - 18h00</SelectItem>
                <SelectItem value="08h00 - 17h00">08h00 - 17h00</SelectItem>
                <SelectItem value="10h00 - 19h00">10h00 - 19h00</SelectItem>
                <SelectItem value="Flexible">Flexible</SelectItem>
                <SelectItem value="Uniquement week-end">Uniquement week-end</SelectItem>
                <SelectItem value="Soirées et week-end">Soirées et week-end</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Zone de couverture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Zone de couverture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="coverage_address">Adresse de base</Label>
            <Input
              id="coverage_address"
              value={formData.coverage_address}
              onChange={(e) => updateFormData('coverage_address', e.target.value)}
              placeholder="Votre adresse de travail principale"
            />
          </div>

          <div>
            <Label htmlFor="coverage_radius">Rayon d'intervention (km)</Label>
            <Select 
              value={formData.coverage_radius.toString()} 
              onValueChange={(value) => updateFormData('coverage_radius', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 km</SelectItem>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="15">15 km</SelectItem>
                <SelectItem value="20">20 km</SelectItem>
                <SelectItem value="30">30 km</SelectItem>
                <SelectItem value="50">50 km</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_transport"
              checked={formData.has_transport}
              onCheckedChange={(checked) => updateFormData('has_transport', checked)}
            />
            <Label htmlFor="has_transport">
              Je dispose d'un véhicule personnel
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents justificatifs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <DocumentUpload
            label="Pièce d'identité *"
            documentType="identity"
            currentUrl={formData.identity_document_url}
            onUploadComplete={(url) => updateFormData('identity_document_url', url)}
          />

          <DocumentUpload
            label="Diplômes / Certifications"
            documentType="diploma"
            currentUrl={formData.diploma_urls[0] || ''}
            onUploadComplete={(url) => updateFormData('diploma_urls', [url])}
          />

          <DocumentUpload
            label="Assurance professionnelle (si applicable)"
            documentType="insurance"
            currentUrl={formData.insurance_document_url}
            onUploadComplete={(url) => updateFormData('insurance_document_url', url)}
          />
        </CardContent>
      </Card>

      {/* Expérience */}
      <Card>
        <CardHeader>
          <CardTitle>Expérience et motivation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="experience_years">Années d'expérience</Label>
            <Select 
              value={formData.experience_years.toString()} 
              onValueChange={(value) => updateFormData('experience_years', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre expérience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Débutant</SelectItem>
                <SelectItem value="1">1 an</SelectItem>
                <SelectItem value="2">2 ans</SelectItem>
                <SelectItem value="3">3-5 ans</SelectItem>
                <SelectItem value="5">5-10 ans</SelectItem>
                <SelectItem value="10">Plus de 10 ans</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="certifications">Certifications / Formations</Label>
            <Textarea
              id="certifications"
              value={formData.certifications}
              onChange={(e) => updateFormData('certifications', e.target.value)}
              placeholder="Listez vos certifications, formations ou qualifications..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="motivation">Lettre de motivation</Label>
            <Textarea
              id="motivation"
              value={formData.motivation}
              onChange={(e) => updateFormData('motivation', e.target.value)}
              placeholder="Expliquez pourquoi vous souhaitez rejoindre notre plateforme..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button type="submit" size="lg" disabled={loading} className="px-8">
          {loading ? "Envoi en cours..." : "Envoyer ma candidature"}
        </Button>
      </div>
    </form>
  );
};