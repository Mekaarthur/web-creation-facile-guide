import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageSquare, Bell, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { pushNotificationService } from "@/services/pushNotificationService";
import { smsService } from "@/services/smsService";
import { supabase } from "@/integrations/supabase/client";

const CommunicationsManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Email Test
  const [emailType, setEmailType] = useState('booking_confirmation');
  const [recipientEmail, setRecipientEmail] = useState('');

  // SMS Test
  const [smsType, setSmsType] = useState('emergency_cancellation');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [smsMessage, setSmsMessage] = useState('');

  // Push Notification Test
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  const handleSendTestEmail = async () => {
    if (!recipientEmail) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir un email",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          type: emailType,
          recipientEmail,
          data: {
            clientName: 'Test Client',
            serviceName: 'Service Test',
            bookingDate: '15/01/2025',
            startTime: '14:00',
            address: '123 rue Test, Paris',
            price: 50,
            providerName: 'Test Provider'
          }
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Email envoyé",
        description: `Email de test ${emailType} envoyé à ${recipientEmail}`,
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "❌ Erreur",
        description: "Impossible d'envoyer l'email de test",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestSMS = async () => {
    if (!recipientPhone) {
      toast({
        title: "Téléphone requis",
        description: "Veuillez saisir un numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await smsService.sendCriticalSMS({
        type: smsType as any,
        recipientPhone,
        recipientName: 'Test',
        data: {
          serviceName: 'Service Test',
          bookingDate: '15/01/2025',
          startTime: '14:00',
          reason: 'Test'
        }
      });

      toast({
        title: "📱 SMS envoyé",
        description: `SMS de test envoyé à ${recipientPhone}`,
      });
    } catch (error) {
      console.error('Error sending test SMS:', error);
      toast({
        title: "❌ Erreur",
        description: "Impossible d'envoyer le SMS de test",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPushPermission = async () => {
    const permission = await pushNotificationService.requestPermission();
    setPushPermission(permission);
    
    if (permission === 'granted') {
      await pushNotificationService.subscribe();
      toast({
        title: "✅ Notifications activées",
        description: "Vous recevrez maintenant les notifications push",
      });
    } else {
      toast({
        title: "❌ Permission refusée",
        description: "Les notifications push sont désactivées",
        variant: "destructive"
      });
    }
  };

  const handleSendTestPush = async () => {
    if (!pushTitle || !pushBody) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir le titre et le message",
        variant: "destructive"
      });
      return;
    }

    const success = await pushNotificationService.sendTestNotification(pushTitle, pushBody);
    
    if (success) {
      toast({
        title: "🔔 Notification envoyée",
        description: "La notification push a été envoyée",
      });
    } else {
      toast({
        title: "❌ Erreur",
        description: "Impossible d'envoyer la notification",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestion des Communications</h1>
        <p className="text-muted-foreground">
          Gérez tous les canaux de communication : emails, SMS critiques et notifications push
        </p>
      </div>

      <Tabs defaultValue="emails" className="space-y-4">
        <TabsList>
          <TabsTrigger value="emails">
            <Mail className="w-4 h-4 mr-2" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="sms">
            <MessageSquare className="w-4 h-4 mr-2" />
            SMS Critiques
          </TabsTrigger>
          <TabsTrigger value="push">
            <Bell className="w-4 h-4 mr-2" />
            Push Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test d'envoi d'email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type d'email</label>
                <Select value={emailType} onValueChange={setEmailType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="booking_confirmation">Confirmation de réservation</SelectItem>
                    <SelectItem value="booking_rejected">Réservation refusée</SelectItem>
                    <SelectItem value="booking_rescheduled">Réservation reportée</SelectItem>
                    <SelectItem value="emergency_replacement">Remplacement d'urgence</SelectItem>
                    <SelectItem value="booking_reminder">Rappel réservation</SelectItem>
                    <SelectItem value="mission_completed">Mission terminée</SelectItem>
                    <SelectItem value="review_request">Demande d'avis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Email destinataire</label>
                <Input
                  type="email"
                  placeholder="client@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleSendTestEmail} 
                disabled={loading}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyer l'email de test
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Templates d'emails disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Badge variant="outline"><CheckCircle2 className="w-3 h-3 mr-1" />Confirmation réservation</Badge>
                <Badge variant="outline"><CheckCircle2 className="w-3 h-3 mr-1" />Prestataire assigné</Badge>
                <Badge variant="outline"><CheckCircle2 className="w-3 h-3 mr-1" />Rappel 24h</Badge>
                <Badge variant="outline"><CheckCircle2 className="w-3 h-3 mr-1" />Mission démarrée</Badge>
                <Badge variant="outline"><CheckCircle2 className="w-3 h-3 mr-1" />Mission terminée</Badge>
                <Badge variant="outline"><CheckCircle2 className="w-3 h-3 mr-1" />Demande d'avis</Badge>
                <Badge variant="outline"><CheckCircle2 className="w-3 h-3 mr-1" />Annulation</Badge>
                <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Réservation refusée (NOUVEAU)</Badge>
                <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Réservation reportée (NOUVEAU)</Badge>
                <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Remplacement urgence (NOUVEAU)</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test de SMS critique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type de SMS</label>
                <Select value={smsType} onValueChange={setSmsType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency_cancellation">Annulation d'urgence</SelectItem>
                    <SelectItem value="late_provider_absence">Absence prestataire</SelectItem>
                    <SelectItem value="urgent_replacement">Mission urgente</SelectItem>
                    <SelectItem value="security_alert">Alerte sécurité</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Numéro de téléphone</label>
                <Input
                  type="tel"
                  placeholder="+33612345678"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleSendTestSMS} 
                disabled={loading}
                className="w-full"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Envoyer le SMS de test
              </Button>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Configuration Twilio requise</strong><br />
                  Les SMS sont envoyés via Twilio. Configurez vos identifiants dans les secrets Supabase.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="push" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des notifications push</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Statut des notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Permission: {pushPermission === 'granted' ? '✅ Accordée' : pushPermission === 'denied' ? '❌ Refusée' : '⏳ En attente'}
                  </p>
                </div>
                <Button onClick={handleRequestPushPermission}>
                  Activer les notifications
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Titre</label>
                <Input
                  placeholder="Nouvelle mission disponible"
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  placeholder="Une nouvelle mission est disponible près de chez vous"
                  value={pushBody}
                  onChange={(e) => setPushBody(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleSendTestPush}
                disabled={pushPermission !== 'granted'}
                className="w-full"
              >
                <Bell className="w-4 h-4 mr-2" />
                Envoyer la notification test
              </Button>

              {pushPermission !== 'granted' && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>ℹ️ Permission requise</strong><br />
                    Veuillez d'abord autoriser les notifications pour tester l'envoi.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunicationsManager;
