import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, MapPin, Clock, MessageSquare, CheckCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  services: string[];
  coverage_zone: string;
  availability: string;
  motivation: string;
}

const SERVICES = [
  { id: 'bika_kids', label: 'Bika Kids (garde d\'enfants)' },
  { id: 'bika_maison', label: 'Bika Maison (ménage, courses)' },
  { id: 'bika_vie', label: 'Bika Vie (démarches admin)' },
  { id: 'bika_travel', label: 'Bika Travel (assistance voyage)' },
  { id: 'bika_animals', label: 'Bika Animals (soins animaux)' },
  { id: 'bika_seniors', label: 'Bika Seniors (aide personnes âgées)' },
  { id: 'bika_pro', label: 'Bika Pro (solutions entreprises)' }
];

const AVAILABILITY_OPTIONS = [
  'Temps plein (35h/semaine)',
  'Temps partiel (moins de 35h/semaine)',
  'Quelques heures par semaine',
  'Week-ends uniquement',
  'Soirées uniquement',
  'Flexible selon les besoins'
];

const ProviderSignup = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    services: [],
    coverage_zone: '',
    availability: '',
    motivation: ''
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation basique
      if (!formData.first_name || !formData.last_name || !formData.email || 
          !formData.phone || !formData.address || formData.services.length === 0 ||
          !formData.coverage_zone || !formData.availability) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires.",
          variant: "destructive"
        });
        return;
      }

      // Sauvegarder la candidature
      const { error } = await supabase
        .from('job_applications')
        .insert({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          postal_code: formData.postal_code,
          service_categories: formData.services,
          availability: formData.availability,
          motivation: formData.motivation,
          coverage_address: `${formData.address}, ${formData.city} ${formData.postal_code}`,
          coverage_radius: 20,
          status: 'pending',
          category: 'multi-services'
        });

      if (error) {
        console.error('Erreur lors de l\'insertion:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'envoi de votre candidature.",
          variant: "destructive"
        });
        return;
      }

      // Envoyer les notifications
      const servicesText = formData.services.map(s => SERVICES.find(service => service.id === s)?.label).join(', ');
      
      // Email de confirmation au candidat
      await supabase.functions.invoke('send-provider-signup-notification', {
        body: {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          services: servicesText,
          type: 'candidate'
        }
      });

      // Notification admin
      await supabase.functions.invoke('send-provider-signup-notification', {
        body: {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          services: servicesText,
          type: 'admin'
        }
      });

      setIsSubmitted(true);
      
      toast({
        title: "Candidature envoyée !",
        description: "Nous vous recontacterons sous 48h. Vérifiez vos emails.",
      });

    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-elegant p-8">
              <CheckCircle className="mx-auto h-16 w-16 text-success mb-6" />
              <h1 className="text-3xl font-bold text-primary mb-4">
                Candidature envoyée avec succès !
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Merci pour votre intérêt ! Nous avons bien reçu votre candidature 
                et vous recontacterons sous 48h.
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Un email de confirmation vous a été envoyé à l'adresse : <strong>{formData.email}</strong>
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-primary hover:bg-primary/90"
              >
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Rejoignez l'équipe Bikawo
            </h1>
            <p className="text-xl text-muted-foreground">
              Devenez prestataire et aidez les familles au quotidien
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
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
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Adresse complète *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    placeholder="Numéro, rue, ville, code postal"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => updateFormData('postal_code', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services proposés */}
            <Card>
              <CardHeader>
                <CardTitle>Services proposés *</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez tous les services que vous souhaitez proposer
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SERVICES.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={formData.services.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <Label htmlFor={service.id} className="cursor-pointer">
                        {service.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Zone géographique et disponibilités */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Zone géographique et disponibilités
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="coverage_zone">Zone géographique d'intervention *</Label>
                  <Input
                    id="coverage_zone"
                    value={formData.coverage_zone}
                    onChange={(e) => updateFormData('coverage_zone', e.target.value)}
                    placeholder="Ex: Paris et proche banlieue, Hauts-de-Seine..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="availability">Disponibilités *</Label>
                  <Select 
                    value={formData.availability} 
                    onValueChange={(value) => updateFormData('availability', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez vos disponibilités" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABILITY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Message de motivation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Message de motivation
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Optionnel - Parlez-nous de votre expérience et motivation
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.motivation}
                  onChange={(e) => updateFormData('motivation', e.target.value)}
                  placeholder="Décrivez votre expérience, vos motivations et pourquoi vous souhaitez rejoindre Bikawo..."
                  rows={5}
                />
              </CardContent>
            </Card>

            <Separator />

            <div className="flex flex-col items-center gap-4">
              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary/90"
              >
                {isLoading ? 'Envoi en cours...' : 'Envoyer ma candidature'}
              </Button>
              
              <p className="text-sm text-muted-foreground text-center">
                En soumettant ce formulaire, vous acceptez d'être recontacté par notre équipe
                dans les 48h suivant votre candidature.
              </p>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProviderSignup;