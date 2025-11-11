import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, MapPin, MessageSquare, CheckCircle, AlertCircle, FileText, Upload } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { providerCandidateSchema, type ProviderCandidateForm } from "@/lib/validations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  
  const form = useForm<ProviderCandidateForm>({
    resolver: zodResolver(providerCandidateSchema),
    mode: 'onChange',
    defaultValues: {
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
      motivation: '',
      identity_document: null,
      criminal_record: null,
      criminal_record_date: undefined,
      siren_number: '',
      rib_iban: null,
      cv_file: null,
      certifications: null
    }
  });

  const toggleService = (serviceId: string) => {
    const currentServices = form.getValues('services');
    if (currentServices.includes(serviceId)) {
      form.setValue('services', currentServices.filter(s => s !== serviceId));
    } else {
      form.setValue('services', [...currentServices, serviceId]);
    }
  };

  const onSubmit = async (data: ProviderCandidateForm) => {
    try {
      // D'abord, télécharger tous les fichiers
      const userId = crypto.randomUUID(); // Identifiant temporaire
      const uploadedDocs: Record<string, string> = {};
      
      // Upload documents obligatoires
      const documentsToUpload = [
        { file: data.identity_document, key: 'identity_document_url', folder: 'identity' },
        { file: data.criminal_record, key: 'criminal_record_url', folder: 'criminal_record' },
        { file: data.rib_iban, key: 'rib_iban_url', folder: 'rib' },
        { file: data.cv_file, key: 'cv_file_url', folder: 'cv' },
      ];
      
      if (data.certifications) {
        documentsToUpload.push({ file: data.certifications, key: 'certifications_url', folder: 'certifications' });
      }
      
      for (const doc of documentsToUpload) {
        if (doc.file) {
          const fileName = `${userId}/${doc.folder}/${Date.now()}_${doc.file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('provider-documents')
            .upload(fileName, doc.file);
          
          if (uploadError) {
            throw new Error(`Erreur upload ${doc.folder}: ${uploadError.message}`);
          }
          
          // Stocker le chemin du fichier, pas l'URL publique (bucket privé)
          uploadedDocs[doc.key] = fileName;
        }
      }
      
      // Sauvegarder la candidature avec les documents
      const { error } = await supabase
        .from('job_applications')
        .insert({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          city: data.city,
          postal_code: data.postal_code,
          service_categories: data.services,
          availability: data.availability,
          motivation: data.motivation || '',
          coverage_address: `${data.address}, ${data.city} ${data.postal_code}`,
          coverage_radius: 20,
          status: 'pending',
          category: 'multi-services',
          siren_number: data.siren_number,
          identity_document_url: uploadedDocs.identity_document_url,
          criminal_record_url: uploadedDocs.criminal_record_url,
          criminal_record_date: data.criminal_record_date?.toISOString(),
          rib_iban_url: uploadedDocs.rib_iban_url,
          cv_file_url: uploadedDocs.cv_file_url,
          certifications_url: uploadedDocs.certifications_url,
          documents_complete: true
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
      const servicesText = data.services.map(s => SERVICES.find(service => service.id === s)?.label).join(', ');
      
      // Email de confirmation au candidat
      await supabase.functions.invoke('send-provider-signup-notification', {
        body: {
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          services: servicesText,
          type: 'candidate'
        }
      });

      // Notification admin
      await supabase.functions.invoke('send-provider-signup-notification', {
        body: {
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          services: servicesText,
          type: 'admin'
        }
      });

      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      
      toast({
        title: "Candidature envoyée !",
        description: "Nous vous recontacterons sous 48h. Vérifiez vos emails.",
      });

    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur inattendue est survenue.",
        variant: "destructive"
      });
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
                Un email de confirmation vous a été envoyé à l'adresse : <strong>{submittedEmail}</strong>
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Jean" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Dupont" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="email@exemple.com" autoComplete="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone *</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" placeholder="+33 6 12 34 56 78" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse complète *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Numéro, rue" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Paris" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="75001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                <FormField
                  control={form.control}
                  name="services"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {SERVICES.map((service) => (
                          <div key={service.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={service.id}
                              checked={form.watch('services').includes(service.id)}
                              onCheckedChange={() => toggleService(service.id)}
                            />
                            <Label htmlFor={service.id} className="cursor-pointer">
                              {service.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <FormField
                  control={form.control}
                  name="coverage_zone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone géographique d'intervention *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Paris et proche banlieue, Hauts-de-Seine..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponibilités *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez vos disponibilités" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AVAILABILITY_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <FormField
                  control={form.control}
                  name="motivation"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Décrivez votre expérience, vos motivations et pourquoi vous souhaitez rejoindre Bikawo..."
                          rows={5}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Documents obligatoires */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents obligatoires
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Documents obligatoires pour traiter votre candidature (CV facultatif)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pièce d'identité */}
                <FormField
                  control={form.control}
                  name="identity_document"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Pièce d'identité (CNI, passeport) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Casier judiciaire */}
                <FormField
                  control={form.control}
                  name="criminal_record"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Casier judiciaire (moins de 3 mois) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Numéro SIREN */}
                <FormField
                  control={form.control}
                  name="siren_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro SIREN *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123456789" maxLength={9} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* RIB/IBAN */}
                <FormField
                  control={form.control}
                  name="rib_iban"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        RIB / IBAN *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CV */}
                <FormField
                  control={form.control}
                  name="cv_file"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        CV (facultatif)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Certifications (optionnel) */}
                <FormField
                  control={form.control}
                  name="certifications"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Certifications (optionnel)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Diplômes, formations, certificats professionnels...
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-warning/10 border border-warning/20 rounded-md p-4">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    Formats acceptés
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, PDF - Taille maximale: 10 MB par fichier
                  </p>
                </div>
              </CardContent>
            </Card>

            <Separator />

            <div className="flex flex-col items-center gap-4">
              <Button
                type="submit"
                size="lg"
                disabled={form.formState.isSubmitting}
                className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary/90"
              >
                {form.formState.isSubmitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}
              </Button>
              
              <p className="text-sm text-muted-foreground text-center">
                En soumettant ce formulaire, vous acceptez d'être recontacté par notre équipe
                dans les 48h suivant votre candidature.
              </p>
            </div>
          </form>
          </Form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProviderSignup;