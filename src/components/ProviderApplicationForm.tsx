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
  mandat_facturation_accepte: boolean;
  
  // Services
  service_categories: string[];
  hourly_rate: number;
  
  // Disponibilités
  availability_days: string[];
  availability_hours: string;
  availability_time_slots: { day: string; start: string; end: string; }[];
  
  // Zone de couverture
  coverage_address: string;
  coverage_radius: number;
  intervention_zones: string[];
  other_intervention_zone: string;
  transportation_mode: string;
  
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
  'Préparation culinaire / batch cooking',
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

const INTERVENTION_ZONES = [
  'Paris 1er',
  'Paris 2ème',
  'Paris 3ème',
  'Paris 4ème',
  'Paris 5ème',
  'Paris 6ème',
  'Paris 7ème',
  'Paris 8ème',
  'Paris 9ème',
  'Paris 10ème',
  'Paris 11ème',
  'Paris 12ème',
  'Paris 13ème',
  'Paris 14ème',
  'Paris 15ème',
  'Paris 16ème',
  'Paris 17ème',
  'Paris 18ème',
  'Paris 19ème',
  'Paris 20ème',
  'Boulogne-Billancourt',
  'Neuilly-sur-Seine',
  'Levallois-Perret',
  'Issy-les-Moulineaux',
  'Vincennes',
  'Saint-Denis',
  'Montreuil',
  'Créteil'
];

const TRANSPORTATION_MODES = [
  { value: 'walking', label: 'À pied' },
  { value: 'bike', label: 'Vélo' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'car', label: 'Voiture' },
  { value: 'public_transport', label: 'Transport en commun' }
];

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
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
    mandat_facturation_accepte: false,
    service_categories: [],
    hourly_rate: 0,
    availability_days: [],
    availability_hours: '09h00 - 18h00',
    availability_time_slots: [],
    coverage_address: '',
    coverage_radius: 20,
    intervention_zones: [],
    other_intervention_zone: '',
    transportation_mode: '',
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

  const toggleInterventionZone = (zone: string) => {
    const current = formData.intervention_zones;
    const updated = current.includes(zone)
      ? current.filter(z => z !== zone)
      : [...current, zone];
    updateFormData('intervention_zones', updated);
  };

  const addTimeSlot = () => {
    const newSlot = { day: '', start: '09:00', end: '18:00' };
    updateFormData('availability_time_slots', [...formData.availability_time_slots, newSlot]);
  };

  const updateTimeSlot = (index: number, field: string, value: string) => {
    const updated = formData.availability_time_slots.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    );
    updateFormData('availability_time_slots', updated);
  };

  const removeTimeSlot = (index: number) => {
    const updated = formData.availability_time_slots.filter((_, i) => i !== index);
    updateFormData('availability_time_slots', updated);
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

      // Créer notification admin pour nouvelle candidature
      await supabase.functions.invoke('create-admin-notification', {
        body: {
          type: 'provider_application',
          title: '📋 Nouvelle candidature prestataire',
          message: `${formData.first_name} ${formData.last_name} a postulé pour devenir prestataire (${formData.service_categories.join(', ')})`,
          data: {
            provider_name: `${formData.first_name} ${formData.last_name}`,
            provider_email: formData.email,
            provider_phone: formData.phone,
            service_categories: formData.service_categories.join(', ')
          },
          priority: 'high'
        }
      });

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
        mandat_facturation_accepte: false,
        service_categories: [],
        hourly_rate: 0,
        availability_days: [],
        availability_hours: '09h00 - 18h00',
        availability_time_slots: [],
        coverage_address: '',
        coverage_radius: 20,
        intervention_zones: [],
        other_intervention_zone: '',
        transportation_mode: '',
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

          {/* Mandat de facturation */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="mandat_facturation"
                checked={formData.mandat_facturation_accepte || false}
                onCheckedChange={(checked) => updateFormData('mandat_facturation_accepte', checked)}
              />
              <div className="space-y-1">
                <Label 
                  htmlFor="mandat_facturation" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
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
            <Label htmlFor="availability_hours">Horaires généraux</Label>
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

          <Separator />

          <div>
            <Label>Créneaux spécifiques (optionnel)</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Ajoutez des créneaux précis par jour de la semaine
            </p>
            
            {formData.availability_time_slots.map((slot, index) => (
              <div key={index} className="flex items-center gap-2 mb-2 p-3 border rounded-lg">
                <Select
                  value={slot.day}
                  onValueChange={(value) => updateTimeSlot(index, 'day', value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Jour" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(day => (
                      <SelectItem key={day} value={day} className="capitalize">
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={slot.start}
                  onValueChange={(value) => updateTimeSlot(index, 'start', value)}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Début" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(time => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-muted-foreground">à</span>

                <Select
                  value={slot.end}
                  onValueChange={(value) => updateTimeSlot(index, 'end', value)}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Fin" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(time => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeTimeSlot(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Supprimer
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addTimeSlot}
              className="w-full mt-2"
            >
              + Ajouter un créneau
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Zone de couverture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Zone de couverture et déplacement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <Separator />

          <div>
            <Label>Zone(s) d'intervention *</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Sélectionnez les zones où vous souhaitez intervenir
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {INTERVENTION_ZONES.map(zone => (
                <div key={zone} className="flex items-center space-x-2">
                  <Checkbox
                    id={zone}
                    checked={formData.intervention_zones.includes(zone)}
                    onCheckedChange={() => toggleInterventionZone(zone)}
                  />
                  <Label htmlFor={zone} className="text-sm">
                    {zone}
                  </Label>
                </div>
              ))}
            </div>
            
            {formData.intervention_zones.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.intervention_zones.map(zone => (
                  <Badge key={zone} variant="secondary" className="text-xs">
                    {zone}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="other_intervention_zone">Autres zones (champ libre)</Label>
            <Input
              id="other_intervention_zone"
              value={formData.other_intervention_zone}
              onChange={(e) => updateFormData('other_intervention_zone', e.target.value)}
              placeholder="Précisez d'autres zones d'intervention..."
            />
          </div>

          <Separator />

          <div>
            <Label htmlFor="transportation_mode">Mode de déplacement *</Label>
            <Select 
              value={formData.transportation_mode} 
              onValueChange={(value) => updateFormData('transportation_mode', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre mode de déplacement" />
              </SelectTrigger>
              <SelectContent>
                {TRANSPORTATION_MODES.map(mode => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
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