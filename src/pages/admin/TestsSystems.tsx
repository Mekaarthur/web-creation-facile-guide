import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Upload, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  TestTube,
  Zap
} from 'lucide-react';

import { EmailTestPanel } from '@/components/ui/email-test-panel';
import { EnhancedFileUpload } from '@/components/ui/enhanced-file-upload';
import { EnhancedBookingForm } from '@/components/ui/enhanced-booking-form';
import { ValidatedForm, FormFieldConfig } from '@/components/ui/validated-form';
import { contactSchema, ContactForm } from '@/lib/validations';
import { supabase } from '@/integrations/supabase/client';

const TestsSystems: React.FC = () => {
  const [testResults, setTestResults] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  const runValidationTest = () => {
    try {
      // Test de validation avec des données correctes
      const validData = {
        name: "Test User",
        email: "test@example.com",
        subject: "Test Subject",
        message: "This is a test message with enough characters"
      };
      
      const result = contactSchema.safeParse(validData);
      
      if (result.success) {
        setTestResults(prev => ({ ...prev, validation: true }));
        toast({
          title: "Test de validation réussi",
          description: "Le schéma de validation fonctionne correctement",
        });
      } else {
        throw new Error(result.error.message);
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, validation: false }));
      toast({
        title: "Test de validation échoué",
        description: "Erreur dans le schéma de validation",
        variant: "destructive",
      });
    }
  };

  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) throw error;
      
      setTestResults(prev => ({ ...prev, supabase: true }));
      toast({
        title: "Connexion Supabase OK",
        description: "La connexion à la base de données fonctionne",
      });
    } catch (error) {
      setTestResults(prev => ({ ...prev, supabase: false }));
      toast({
        title: "Erreur Supabase",
        description: "Problème de connexion à la base de données",
        variant: "destructive",
      });
    }
  };

  const handleContactFormSubmit = async (data: ContactForm) => {
    toast({
      title: "Formulaire soumis",
      description: `Message de ${data.name} : ${data.subject}`,
    });
    setTestResults(prev => ({ ...prev, forms: true }));
  };

  const handleBookingSubmit = async (data: any) => {
    toast({
      title: "Réservation test créée",
      description: "Le processus de réservation fonctionne",
    });
    setTestResults(prev => ({ ...prev, booking: true }));
  };

  const handleFileUpload = (url: string, fileName: string) => {
    toast({
      title: "Upload réussi",
      description: `Fichier ${fileName} uploadé`,
    });
    setTestResults(prev => ({ ...prev, upload: true }));
  };

  const contactFormFields: FormFieldConfig[] = [
    {
      name: 'name',
      label: 'Nom complet',
      type: 'text',
      placeholder: 'Votre nom complet',
      required: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'votre@email.com',
      required: true,
    },
    {
      name: 'phone',
      label: 'Téléphone',
      type: 'tel',
      placeholder: '06 12 34 56 78',
    },
    {
      name: 'subject',
      label: 'Sujet',
      type: 'text',
      placeholder: 'Sujet de votre message',
      required: true,
    },
    {
      name: 'message',
      label: 'Message',
      type: 'textarea',
      placeholder: 'Votre message...',
      required: true,
    },
  ];

  const getStatusIcon = (status?: boolean) => {
    if (status === undefined) return <TestTube className="h-4 w-4 text-muted-foreground" />;
    return status 
      ? <CheckCircle className="h-4 w-4 text-green-600" />
      : <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (status?: boolean) => {
    if (status === undefined) {
      return <Badge variant="outline">Non testé</Badge>;
    }
    return status 
      ? <Badge className="bg-green-100 text-green-800">OK</Badge>
      : <Badge variant="destructive">Erreur</Badge>;
  };

  // Services de test pour le formulaire de réservation
  const testServices = [
    {
      id: '1',
      name: 'Ménage à domicile',
      description: 'Service de ménage complet',
      price_per_hour: 25,
      category: 'Maison'
    },
    {
      id: '2',
      name: 'Garde d\'enfants',
      description: 'Garde d\'enfants à domicile',
      price_per_hour: 15,
      category: 'Enfants'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tests des Systèmes</h1>
        <p className="text-muted-foreground mt-2">
          Interface de test pour valider le bon fonctionnement des systèmes critiques
        </p>
      </div>

      {/* Tableau de bord des tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Statut des Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.validation)}
                <span className="text-sm font-medium">Validation</span>
              </div>
              {getStatusBadge(testResults.validation)}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.supabase)}
                <span className="text-sm font-medium">Supabase</span>
              </div>
              {getStatusBadge(testResults.supabase)}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.forms)}
                <span className="text-sm font-medium">Formulaires</span>
              </div>
              {getStatusBadge(testResults.forms)}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.upload)}
                <span className="text-sm font-medium">Upload</span>
              </div>
              {getStatusBadge(testResults.upload)}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.booking)}
                <span className="text-sm font-medium">Réservation</span>
              </div>
              {getStatusBadge(testResults.booking)}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Emails</span>
              </div>
              <Badge variant="outline">Manuel</Badge>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={runValidationTest} variant="outline" size="sm">
              Test Validation
            </Button>
            <Button onClick={testSupabaseConnection} variant="outline" size="sm">
              Test Supabase
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs pour les différents tests */}
      <Tabs defaultValue="validation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="uploads">Uploads</TabsTrigger>
          <TabsTrigger value="forms">Formulaires</TabsTrigger>
          <TabsTrigger value="booking">Réservation</TabsTrigger>
        </TabsList>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test de Validation</CardTitle>
              <CardDescription>
                Test des schémas Zod pour la validation des formulaires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Schémas disponibles:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• authSchema - Authentification</li>
                  <li>• profileSchema - Profil utilisateur</li>
                  <li>• bookingSchema - Réservations</li>
                  <li>• providerApplicationSchema - Candidature prestataire</li>
                  <li>• contactSchema - Contact</li>
                  <li>• fileUploadSchema - Upload de fichiers</li>
                </ul>
              </div>
              
              <Button onClick={runValidationTest}>
                Exécuter les tests de validation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails">
          <EmailTestPanel />
        </TabsContent>

        <TabsContent value="uploads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test d'Upload de Fichiers</CardTitle>
              <CardDescription>
                Test du composant d'upload avec Supabase Storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedFileUpload
                bucketName="documents"
                path="tests"
                title="Test d'upload de document"
                description="Testez l'upload de fichiers vers Supabase Storage"
                onUploadComplete={handleFileUpload}
                multiple={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test de Formulaire Validé</CardTitle>
              <CardDescription>
                Test du composant de formulaire avec validation Zod
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ValidatedForm
                schema={contactSchema}
                fields={contactFormFields}
                onSubmit={handleContactFormSubmit}
                submitText="Envoyer le message de test"
                defaultValues={{
                  name: "Utilisateur Test",
                  email: "test@example.com"
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="booking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test de Processus de Réservation</CardTitle>
              <CardDescription>
                Test du formulaire multi-étapes de réservation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedBookingForm
                services={testServices}
                onSubmit={handleBookingSubmit}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestsSystems;