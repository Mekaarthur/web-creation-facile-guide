import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, MapPin, MessageSquare } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { providerCandidateSchema, type ProviderCandidateForm } from "@/lib/validations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ProviderSignupSuccess } from "@/components/provider/ProviderSignupSuccess";
import { SignupDocumentsCard } from "@/components/provider/SignupDocumentsCard";

const SERVICES = [
  { id: 'bika_kids', label: "Bika Kids (garde d'enfants)" },
  { id: 'bika_maison', label: 'Bika Maison (ménage, courses)' },
  { id: 'bika_vie', label: 'Bika Vie (démarches admin)' },
  { id: 'bika_travel', label: 'Bika Travel (assistance voyage)' },
  { id: 'bika_animals', label: 'Bika Animals (soins animaux)' },
  { id: 'bika_seniors', label: 'Bika Seniors (aide personnes âgées)' },
  { id: 'bika_pro', label: 'Bika Pro (solutions entreprises)' },
];

const AVAILABILITY_OPTIONS = [
  'Temps plein (35h/semaine)',
  'Temps partiel (moins de 35h/semaine)',
  'Quelques heures par semaine',
  'Week-ends uniquement',
  'Soirées uniquement',
  'Flexible selon les besoins',
];

const ProviderSignup = () => {
  const { toast } = useToast();
  const [submittedEmail, setSubmittedEmail] = useState('');

  const form = useForm<ProviderCandidateForm>({
    resolver: zodResolver(providerCandidateSchema),
    mode: 'onChange',
    defaultValues: {
      first_name: '', last_name: '', email: '', phone: '',
      address: '', city: '', postal_code: '',
      services: [], coverage_zone: '', availability: '', motivation: '',
      identity_document: null, criminal_record: null, criminal_record_date: undefined,
      siret_document: null, rib_iban: null, certification_nova: null, certifications: null,
    },
  });

  const toggleService = (serviceId: string) => {
    const current = form.getValues('services');
    form.setValue('services', current.includes(serviceId)
      ? current.filter(s => s !== serviceId)
      : [...current, serviceId]);
  };

  const onSubmit = async (data: ProviderCandidateForm) => {
    try {
      const applicationId = crypto.randomUUID();
      const uploadedDocs: Record<string, string> = {};

      const documentsToUpload = [
        { file: data.identity_document, key: 'identity_document_url', folder: 'identity' },
        { file: data.criminal_record, key: 'criminal_record_url', folder: 'criminal_record' },
        { file: data.siret_document, key: 'siret_document_url', folder: 'siret_document' },
        { file: data.rib_iban, key: 'rib_iban_url', folder: 'rib' },
        { file: data.certification_nova, key: 'certification_nova_url', folder: 'certification_nova' },
        ...(data.certifications ? [{ file: data.certifications, key: 'certifications_url', folder: 'certifications' }] : []),
      ];

      for (const doc of documentsToUpload) {
        if (doc.file instanceof File) {
          const fileExt = doc.file.name.split('.').pop()?.toLowerCase() || 'pdf';
          const safeFileName = `${applicationId}/${doc.folder}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('provider-applications')
            .upload(safeFileName, doc.file, { cacheControl: '3600', upsert: false, contentType: doc.file.type || 'application/octet-stream' });
          if (uploadError) throw new Error(`Erreur upload ${doc.folder}: ${uploadError.message}`);
          uploadedDocs[doc.key] = safeFileName;
        }
      }

      const { error } = await supabase.from('job_applications').insert({
        first_name: data.first_name, last_name: data.last_name,
        email: data.email, phone: data.phone,
        city: data.city, postal_code: data.postal_code,
        service_categories: data.services,
        availability: data.availability,
        motivation: data.motivation || '',
        coverage_address: `${data.address}, ${data.city} ${data.postal_code}`,
        coverage_radius: 20, status: 'pending', category: 'multi-services',
        siret_document_url: uploadedDocs.siret_document_url,
        identity_document_url: uploadedDocs.identity_document_url,
        criminal_record_url: uploadedDocs.criminal_record_url,
        criminal_record_date: data.criminal_record_date?.toISOString(),
        rib_iban_url: uploadedDocs.rib_iban_url,
        certifications_url: uploadedDocs.certification_nova_url || uploadedDocs.certifications_url,
        documents_complete: true,
      });

      if (error) {
        toast({ title: "Erreur", description: "Une erreur est survenue lors de l'envoi de votre candidature.", variant: "destructive" });
        return;
      }

      const servicesText = data.services.map(s => SERVICES.find(sv => sv.id === s)?.label).join(', ');

      await Promise.all([
        supabase.functions.invoke('send-modern-notification', {
          body: { type: 'provider_signup_candidate', recipient: { email: data.email, name: data.first_name, firstName: data.first_name }, data: { services: servicesText, clientName: `${data.first_name} ${data.last_name}` } },
        }),
        supabase.functions.invoke('send-modern-notification', {
          body: { type: 'provider_signup_admin', recipient: { email: 'contact@bikawo.com', name: 'Admin Bikawo' }, data: { clientName: `${data.first_name} ${data.last_name}`, contactEmail: data.email, services: servicesText } },
        }),
      ]);

      setSubmittedEmail(data.email);
      toast({ title: "Candidature envoyée !", description: "Nous vous recontacterons sous 48h. Vérifiez vos emails." });
    } catch (error) {
      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Une erreur inattendue est survenue.", variant: "destructive" });
    }
  };

  if (submittedEmail) {
    return <ProviderSignupSuccess email={submittedEmail} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">Rejoignez l'équipe Bikawo</h1>
            <p className="text-xl text-muted-foreground">Devenez prestataire et aidez les familles au quotidien</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="first_name" render={({ field }) => (
                      <FormItem><FormLabel>Prénom *</FormLabel><FormControl><Input {...field} placeholder="Jean" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="last_name" render={({ field }) => (
                      <FormItem><FormLabel>Nom *</FormLabel><FormControl><Input {...field} placeholder="Dupont" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email *</FormLabel><FormControl><Input {...field} type="email" placeholder="email@exemple.com" autoComplete="email" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Téléphone *</FormLabel><FormControl><Input {...field} type="tel" placeholder="+33 6 12 34 56 78" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Adresse complète *</FormLabel><FormControl><Input {...field} placeholder="Numéro, rue" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem><FormLabel>Ville *</FormLabel><FormControl><Input {...field} placeholder="Paris" data-testid="input-city" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="postal_code" render={({ field }) => (
                      <FormItem><FormLabel>Code postal *</FormLabel><FormControl><Input {...field} placeholder="75001" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Services proposés *</CardTitle>
                  <p className="text-sm text-muted-foreground">Sélectionnez tous les services que vous souhaitez proposer</p>
                </CardHeader>
                <CardContent>
                  <FormField control={form.control} name="services" render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {SERVICES.map((service) => (
                          <div key={service.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={service.id}
                              checked={form.watch('services').includes(service.id)}
                              onCheckedChange={() => toggleService(service.id)}
                            />
                            <Label htmlFor={service.id} className="cursor-pointer">{service.label}</Label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Zone géographique et disponibilités
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="coverage_zone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone géographique d'intervention *</FormLabel>
                      <FormControl><Input {...field} placeholder="Ex: Paris et proche banlieue, Hauts-de-Seine..." /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="availability" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponibilités *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Sélectionnez vos disponibilités" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AVAILABILITY_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Message de motivation
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Optionnel - Parlez-nous de votre expérience et motivation</p>
                </CardHeader>
                <CardContent>
                  <FormField control={form.control} name="motivation" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} placeholder="Décrivez votre expérience, vos motivations et pourquoi vous souhaitez rejoindre Bikawo..." rows={5} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <SignupDocumentsCard control={form.control} />

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
