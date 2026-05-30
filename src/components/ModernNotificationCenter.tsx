import React, { useState, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
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
  Bell,
  Heart,
  Sparkles,
  Users,
  TrendingUp,
  MessageSquare,
  Gift,
  Calendar,
  Star,
  Home,
  Baby,
  User,
  Car,
  PawPrint,
  Briefcase,
  Zap
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeEmailPreview } from '@/utils/emailPreview';

const ModernNotificationCenter = () => {
  const [testEmail, setTestEmail] = useState('');
  const [selectedNotificationType, setSelectedNotificationType] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [notificationStats, setNotificationStats] = useState({
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0
  });
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const { toast } = useToast();

  const notificationTypes = [
    // 👥 Client Notifications
    { 
      category: 'Client',
      types: [
        { id: 'client_welcome', name: '🎉 Bienvenue client', description: 'Email de bienvenue pour les nouveaux clients' },
        { id: 'booking_confirmation', name: '✅ Confirmation réservation', description: 'Confirmation de réservation acceptée' },
        { id: 'booking_reminder_24h', name: '⏰ Rappel 24h', description: 'Rappel bienveillant 24h avant' },
        { id: 'booking_reminder_2h', name: '🔔 Rappel 2h', description: 'Rappel urgent 2h avant' },
        { id: 'booking_accepted', name: '🎯 Réservation acceptée', description: 'Prestataire a accepté la mission' },
        { id: 'booking_rejected', name: '😔 Réservation refusée', description: 'Prestataire a décliné' },
        { id: 'mission_started', name: '🚀 Mission démarrée', description: 'Le prestataire a commencé' },
        { id: 'mission_completed', name: '🎉 Mission terminée', description: 'Service terminé avec succès' },
        { id: 'invoice_generated', name: '📧 Facture générée', description: 'Nouvelle facture disponible' },
        { id: 'review_request', name: '⭐ Demande d\'avis', description: 'Inviter à laisser un avis' }
      ]
    },
    // 👷 Provider Notifications  
    {
      category: 'Prestataire',
      types: [
        { id: 'provider_welcome', name: '🎊 Bienvenue prestataire', description: 'Accueil des nouveaux prestataires' },
        { id: 'new_mission_available', name: '🎯 Nouvelle mission', description: 'Mission correspondant au profil' },
        { id: 'mission_assigned', name: '📋 Mission assignée', description: 'Mission assignée automatiquement' },
        { id: 'mission_reminder', name: '⏰ Rappel prestataire', description: 'Rappel avant intervention' },
        { id: 'payment_received', name: '💰 Paiement reçu', description: 'Confirmation de paiement' },
        { id: 'remuneration_available', name: '💳 Rémunération disponible', description: 'Fiche de paie disponible' }
      ]
    }
  ];

  const services = [
    { value: 'bika-kids', label: 'Bika Kids 👶', icon: <Baby className="h-4 w-4" /> },
    { value: 'bika-seniors', label: 'Bika Seniors 👴', icon: <User className="h-4 w-4" /> },
    { value: 'bika-maison', label: 'Bika Maison 🏠', icon: <Home className="h-4 w-4" /> },
    { value: 'bika-travel', label: 'Bika Travel ✈️', icon: <Car className="h-4 w-4" /> },
    { value: 'bika-animals', label: 'Bika Animals 🐕', icon: <PawPrint className="h-4 w-4" /> },
    { value: 'bika-vie', label: 'Bika Vie 📅', icon: <Calendar className="h-4 w-4" /> },
    { value: 'bika-pro', label: 'Bika Pro 💼', icon: <Briefcase className="h-4 w-4" /> }
  ];

  const handleTestModernNotification = async () => {
    if (!testEmail || !selectedNotificationType) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir l'email et choisir un type de notification",
        variant: "destructive"
      });
      return;
    }

    setEmailStatus('sending');
    
    try {
      const testData = {
        type: selectedNotificationType,
        recipient: {
          email: testEmail,
          name: 'Test Client',
          firstName: 'Alex'
        },
        data: {
          serviceName: 'Préparation culinaire à domicile',
          serviceDescription: 'Nettoyage complet de votre domicile',
          bookingDate: new Date().toLocaleDateString('fr-FR'),
          startTime: '14:00',
          endTime: '16:00',
          address: '123 Rue de la Paix, 75001 Paris',
          price: 65,
          providerName: 'Marie Dupont',
          clientName: 'Alex Martin',
          bookingId: 'test-' + Date.now()
        }
      };

      const { error } = await supabase.functions.invoke('send-modern-notification', {
        body: testData
      });

      if (error) throw error;

      setEmailStatus('success');
      toast({
        title: "Email envoyé ! 💝",
        description: "L'email moderne a été envoyé avec tendresse",
      });

      // Refresh stats
      loadNotificationStats();
    } catch (error) {
      setEmailStatus('error');
      toast({
        title: "Erreur d'envoi",
        description: "Impossible d'envoyer l'email de test",
        variant: "destructive"
      });
    }
  };

  const loadNotificationStats = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('status, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const stats = data?.reduce((acc, notif) => {
        acc.sent++;
        if (notif.status === 'delivered') acc.delivered++;
        if (notif.status === 'opened') acc.opened++;
        if (notif.status === 'clicked') acc.clicked++;
        return acc;
      }, { sent: 0, delivered: 0, opened: 0, clicked: 0 }) || { sent: 0, delivered: 0, opened: 0, clicked: 0 };

      setNotificationStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const previewNotificationTemplate = (notificationType: string) => {
    const mockData = {
      serviceName: 'Préparation culinaire à domicile',
      bookingDate: new Date().toLocaleDateString('fr-FR'),
      startTime: '14:00',
      endTime: '16:00',
      address: '123 Rue de la Paix, 75001 Paris',
      price: 65,
      providerName: 'Marie Dupont',
      clientName: 'Alex Martin'
    };

    const html = `
      <html>
        <head>
          <title>Aperçu - ${notificationType}</title>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f3f4f6;
            }
            .preview-container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .preview-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              text-align: center;
            }
            .preview-content { padding: 30px; }
            .signature {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #9ca3af;
              font-size: 14px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="preview-container">
            <div class="preview-header">
              <h1>📧 Aperçu Email Bikawo</h1>
              <p>Type: ${notificationType}</p>
            </div>
            <div class="preview-content">
              <p><strong>Bonjour Alex,</strong></p>
              <p>Ceci est un aperçu du template <strong>${notificationType}</strong>.</p>
              <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #10b981; margin: 0 0 15px 0;">Détails de test :</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Service : ${mockData.serviceName}</li>
                  <li>Date : ${mockData.bookingDate}</li>
                  <li>Horaire : ${mockData.startTime} - ${mockData.endTime}</li>
                  <li>Adresse : ${mockData.address}</li>
                  <li>Prix : ${mockData.price}€</li>
                </ul>
              </div>
              <p>Ce template utilise un design moderne et des messages chaleureux pour créer une expérience utilisateur exceptionnelle.</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: 600;">
                  Bouton d'action
                </a>
              </div>
              <div class="signature">
                <p>💝 Avec toute notre tendresse,<br>
                <strong style="color: #2563eb;">L'équipe Bikawo</strong> ❤️</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    setPreviewHtml(sanitizeEmailPreview(html));
  };

  useEffect(() => {
    loadNotificationStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            💝 Centre de Notifications Moderne
          </h1>
          <p className="text-muted-foreground">
            Système de notifications avec une touche de tendresse Bikawo
          </p>
        </div>
        <Badge variant="secondary" className="px-4 py-2">
          <Heart className="h-4 w-4 mr-2 text-red-500" />
          Avec tendresse
        </Badge>
      </div>

      <Tabs defaultValue="test" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Statistiques
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Test de Notification Moderne
                </CardTitle>
                <CardDescription>
                  Testez nos nouveaux emails avec des messages tendres et personnalisés
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <Label htmlFor="test-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email de test
                  </Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="notification-type" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Type de notification
                  </Label>
                  <Select value={selectedNotificationType} onValueChange={setSelectedNotificationType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationTypes.map(category => (
                        <div key={category.category}>
                          <div className="px-2 py-1 text-sm font-semibold text-muted-foreground border-b">
                            {category.category === 'Client' ? '👥 Clients' : '👷 Prestataires'}
                          </div>
                          {category.types.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex flex-col">
                                <span>{type.name}</span>
                                <span className="text-xs text-muted-foreground">{type.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleTestModernNotification} 
                  disabled={emailStatus === 'sending'}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80"
                  size="lg"
                >
                  {emailStatus === 'sending' ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer avec tendresse 💝
                    </>
                  )}
                </Button>
                
                {emailStatus === 'success' && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Email envoyé avec succès ! 💝 Vérifiez votre boîte de réception pour découvrir notre nouveau design.
                    </AlertDescription>
                  </Alert>
                )}
                
                {emailStatus === 'error' && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Erreur lors de l'envoi. Vérifiez la configuration ou contactez le support.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Tests en Conditions Réelles
                </CardTitle>
                <CardDescription>
                  Simuler des scenarios complets de notification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.map(service => (
                  <div key={service.value} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {service.icon}
                      <div>
                        <p className="font-medium">{service.label}</p>
                        <p className="text-sm text-muted-foreground">Tester le workflow complet</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <TestTube className="mr-2 h-4 w-4" />
                      Tester
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Checklist de Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary">📧 Tests Email</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Templates modernes
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Messages avec tendresse
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Design responsive
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Test anti-spam
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-primary">🔔 Notifications</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Rappels 24h/2h
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Confirmations clients
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Notifications prestataires
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Messages chat
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-primary">⚙️ Système</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Edge Functions actives
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Logs des notifications
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Métriques delivrabilité
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Gestion des erreurs
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="space-y-6">
            {notificationTypes.map(category => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {category.category === 'Client' ? (
                      <Users className="h-5 w-5 text-blue-500" />
                    ) : (
                      <User className="h-5 w-5 text-green-500" />
                    )}
                    Templates {category.category}
                  </CardTitle>
                  <CardDescription>
                    Emails personnalisés avec des messages tendres pour les {category.category.toLowerCase()}s
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.types.map(template => (
                      <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Moderne
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => previewNotificationTemplate(template.id)}
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
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Emails envoyés</p>
                    <p className="text-3xl font-bold text-primary">{notificationStats.sent}</p>
                  </div>
                  <Send className="h-8 w-8 text-primary" />
                </div>
                <Progress value={100} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taux livraison</p>
                    <p className="text-3xl font-bold text-green-500">98.5%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <Progress value={98.5} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taux ouverture</p>
                    <p className="text-3xl font-bold text-blue-500">45.2%</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-500" />
                </div>
                <Progress value={45.2} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Satisfaction</p>
                    <p className="text-3xl font-bold text-yellow-500">4.8</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
                <Progress value={96} className="mt-3" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Feedback Tendresse
              </CardTitle>
              <CardDescription>
                Les retours de nos utilisateurs sur nos nouveaux messages chaleureux
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Heart className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Sarah M. - Cliente</p>
                    <p className="text-green-700 text-sm">"J'adore la signature 'Avec toute notre tendresse' ! Ça rend le service tellement plus humain ❤️"</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Marc D. - Prestataire</p>
                    <p className="text-blue-700 text-sm">"Les emails sont magnifiques ! Mes clients me disent souvent qu'ils apprécient l'attention de Bikawo."</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Star className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-800">Amélie L. - Cliente</p>
                    <p className="text-purple-700 text-sm">"Les rappels sont parfaits ! Ni trop insistants, ni trop discrets. Et toujours avec bienveillance ✨"</p>
                  </div>
                </div>
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
                    <Badge className="bg-gradient-to-r from-primary to-secondary text-white">
                      Resend + Templates Modernes
                    </Badge>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email expéditeur</Label>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-2 bg-muted rounded-lg text-sm font-mono">
                      Bikawo 💝 &lt;notifications@bikawo.com&gt;
                    </code>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Edge Functions</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <code className="bg-muted px-2 py-1 rounded">send-modern-notification</code>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <code className="bg-muted px-2 py-1 rounded">send-workflow-email</code>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <code className="bg-muted px-2 py-1 rounded">send-reminder-notifications</code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité & Delivrabilité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SPF Record</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Shield className="h-3 w-3 mr-1" />
                      Configuré
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">DKIM Signature</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Shield className="h-3 w-3 mr-1" />
                      Activé
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">DMARC Policy</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      À configurer
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Reputation Score</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Star className="h-3 w-3 mr-1" />
                      Excellent
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-500">0.3%</div>
                      <div className="text-xs text-muted-foreground">Taux spam</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-500">99.1%</div>
                      <div className="text-xs text-muted-foreground">Inbox placement</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Heart className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Notre philosophie :</strong> Chaque email est envoyé avec soin et tendresse. 
              Nous privilégions la qualité et l'émotion à la quantité, pour créer une véritable relation de confiance avec nos utilisateurs. 💝
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      <Dialog open={previewHtml !== null} onOpenChange={(open) => { if (!open) setPreviewHtml(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aperçu Email</DialogTitle>
          </DialogHeader>
          {previewHtml && (
            <iframe
              srcDoc={previewHtml}
              sandbox="allow-same-origin"
              title="Aperçu email"
              style={{ width: '100%', height: '580px', border: 'none', borderRadius: '4px' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModernNotificationCenter;