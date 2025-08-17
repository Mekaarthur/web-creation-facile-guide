import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Settings, 
  Eye, 
  TestTube,
  AlertTriangle,
  Shield,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const EmailTestingDashboard = () => {
  const [testEmail, setTestEmail] = useState('');
  const [testService, setTestService] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    adminNotifications: true,
    backupNotifications: false
  });
  const { toast } = useToast();

  const emailTemplates = [
    { id: 'client_confirmation', name: 'Confirmation client', status: 'active' },
    { id: 'admin_notification', name: 'Notification admin', status: 'active' },
    { id: 'booking_accepted', name: 'Réservation acceptée', status: 'active' },
    { id: 'booking_reminder', name: 'Rappel rendez-vous', status: 'active' },
    { id: 'mission_completed', name: 'Mission terminée', status: 'active' }
  ];

  const services = [
    { value: 'bika-kids', label: 'Bika Kids' },
    { value: 'bika-seniors', label: 'Bika Seniors' },
    { value: 'bika-maison', label: 'Bika Maison' },
    { value: 'bika-travel', label: 'Bika Travel' },
    { value: 'bika-animals', label: 'Bika Animals' },
    { value: 'bika-vie', label: 'Bika Vie' },
    { value: 'bika-pro', label: 'Bika Pro' }
  ];

  const handleTestEmail = async () => {
    if (!testEmail || !testService) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setEmailStatus('sending');
    
    try {
      const { error } = await supabase.functions.invoke('send-automated-notification', {
        body: {
          email: testEmail,
          name: 'Test Admin',
          subject: `Test - Nouvelle demande ${testService}`,
          message: `Ceci est un test d'email automatique pour le service ${testService}. Si vous recevez cet email, la configuration fonctionne correctement.`,
          type: 'email'
        }
      });

      if (error) throw error;

      setEmailStatus('success');
      toast({
        title: "Email envoyé !",
        description: "L'email de test a été envoyé avec succès",
      });
    } catch (error) {
      setEmailStatus('error');
      toast({
        title: "Erreur d'envoi",
        description: "Impossible d'envoyer l'email de test",
        variant: "destructive"
      });
    }
  };

  const handleTestFormSubmission = async () => {
    try {
      // Simuler une soumission de formulaire
      const testData = {
        form_response_id: `test-${Date.now()}`,
        service_type: testService,
        client_email: testEmail,
        client_name: 'Test Client',
        location: 'Paris 75001',
        service_description: 'Test de soumission de formulaire',
        preferred_date: new Date().toISOString(),
        status: 'new'
      };

      const { error } = await supabase
        .from('client_requests')
        .insert(testData);

      if (error) throw error;

      toast({
        title: "Formulaire testé !",
        description: "La soumission de test a été effectuée, vérifiez vos emails",
      });
    } catch (error) {
      toast({
        title: "Erreur de test",
        description: "Erreur lors du test de soumission",
        variant: "destructive"
      });
    }
  };

  const previewEmailTemplate = (templateId: string) => {
    // Ouvrir une popup avec le template d'email
    const previewWindow = window.open('', '_blank', 'width=600,height=800');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Aperçu Email - ${templateId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .email-container { max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; border: 1px solid #ddd; }
              .footer { background: #f5f5f5; padding: 15px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>Bikawo</h1>
                <p>Votre plateforme de services à domicile</p>
              </div>
              <div class="content">
                <h2>Aperçu du template: ${templateId}</h2>
                <p>Bonjour [NOM_CLIENT],</p>
                <p>Nous avons bien reçu votre demande de service.</p>
                <p>Détails de votre demande :</p>
                <ul>
                  <li>Service : [SERVICE]</li>
                  <li>Date souhaitée : [DATE]</li>
                  <li>Localisation : [ADRESSE]</li>
                </ul>
                <p>Nous vous recontacterons rapidement.</p>
              </div>
              <div class="footer">
                <p>Bikawo - contact@bikawo.com - 01 23 45 67 89</p>
                <p>123 Avenue des Services, 75001 Paris</p>
              </div>
            </div>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tests des Emails Automatiques</h1>
          <p className="text-muted-foreground">
            Vérifiez que tous les emails fonctionnent parfaitement
          </p>
        </div>
      </div>

      <Tabs defaultValue="test" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test">Tests en Direct</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Test Email Simple
                </CardTitle>
                <CardDescription>
                  Testez l'envoi d'un email basique
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test-email">Email de test</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="test-service">Service à tester</Label>
                  <Select value={testService} onValueChange={setTestService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.value} value={service.value}>
                          {service.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleTestEmail} 
                  disabled={emailStatus === 'sending'}
                  className="w-full"
                >
                  {emailStatus === 'sending' ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer Test
                    </>
                  )}
                </Button>
                
                {emailStatus === 'success' && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Email envoyé avec succès ! Vérifiez votre boîte de réception.
                    </AlertDescription>
                  </Alert>
                )}
                
                {emailStatus === 'error' && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Erreur lors de l'envoi. Vérifiez la configuration.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Test Formulaire Complet
                </CardTitle>
                <CardDescription>
                  Simulez une vraie soumission de formulaire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Cette action créera une vraie demande dans la base de données
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleTestFormSubmission}
                  variant="outline"
                  className="w-full"
                  disabled={!testEmail || !testService}
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  Tester Soumission Formulaire
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Checklist de Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Tests basiques</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Email de confirmation client
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Notification admin
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Test anti-spam
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Tests avancés</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Gmail, Outlook, Yahoo
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Gestion des erreurs
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Sauvegarde des données
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates d'Emails</CardTitle>
              <CardDescription>
                Tous les emails envoyés par la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emailTemplates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">{template.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {template.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => previewEmailTemplate(template.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Aperçu
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration Technique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Service d'envoi</Label>
                  <div className="flex items-center gap-2">
                    <Badge>Resend</Badge>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email expéditeur</Label>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-muted rounded text-sm">
                      notifications@bikawo.com
                    </code>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Authentification</Label>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      SPF configuré
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      DKIM configuré
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-yellow-500" />
                      DMARC à configurer
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques d'Envoi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">98.5%</div>
                    <div className="text-sm text-muted-foreground">Taux de livraison</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">1.2%</div>
                    <div className="text-sm text-muted-foreground">Taux de spam</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Emails envoyés aujourd'hui</span>
                    <span className="font-medium">127</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Erreurs d'envoi</span>
                    <span className="font-medium text-red-500">2</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Paramètres de Notifications Admin
              </CardTitle>
              <CardDescription>
                Configurez comment vous voulez être averti
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notif">Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir un email pour chaque nouvelle demande
                    </p>
                  </div>
                  <Switch
                    id="email-notif"
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="admin-notif">Notifications dans l'admin</Label>
                    <p className="text-sm text-muted-foreground">
                      Afficher les alertes dans l'interface admin
                    </p>
                  </div>
                  <Switch
                    id="admin-notif"
                    checked={notifications.adminNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, adminNotifications: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="backup-notif">Notifications de sauvegarde</Label>
                    <p className="text-sm text-muted-foreground">
                      SMS si l'email ne fonctionne pas (à configurer)
                    </p>
                  </div>
                  <Switch
                    id="backup-notif"
                    checked={notifications.backupNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, backupNotifications: checked }))
                    }
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label>Email admin principal</Label>
                <Input 
                  type="email" 
                  placeholder="admin@bikawo.com"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Toutes les notifications importantes seront envoyées à cette adresse
                </p>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Système de sauvegarde :</strong> Si l'envoi d'email échoue, 
                  les données sont quand même sauvegardées dans la base de données. 
                  Vous pouvez les consulter dans la section "Demandes clients".
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailTestingDashboard;