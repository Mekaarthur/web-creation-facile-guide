import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface EmailTest {
  id: string;
  type: string;
  status: 'pending' | 'sent' | 'failed';
  recipient: string;
  timestamp: Date;
  error?: string;
}

const EMAIL_TEMPLATES = [
  { value: 'booking_confirmation', label: 'Confirmation de réservation' },
  { value: 'booking_accepted', label: 'Réservation acceptée' },
  { value: 'booking_rejected', label: 'Réservation refusée' },
  { value: 'booking_reminder', label: 'Rappel de réservation' },
  { value: 'booking_completed', label: 'Service terminé' },
  { value: 'password_reset', label: 'Réinitialisation mot de passe' },
  { value: 'provider_signup', label: 'Inscription prestataire' },
  { value: 'welcome', label: 'Bienvenue' },
];

export const EmailTestPanel: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [recipient, setRecipient] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<EmailTest[]>([]);
  const { toast } = useToast();

  const sendTestEmail = async () => {
    if (!selectedTemplate || !recipient) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un template et un destinataire",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const testId = Math.random().toString(36).substring(2);
    
    const newTest: EmailTest = {
      id: testId,
      type: selectedTemplate,
      status: 'pending',
      recipient,
      timestamp: new Date(),
    };

    setTests(prev => [newTest, ...prev]);

    try {
      // Données de test selon le template
      const testData = {
        booking_confirmation: {
          recipientEmail: recipient,
          recipientName: "Utilisateur Test",
          bookingDetails: {
            id: "test-123",
            serviceName: "Service Test",
            date: new Date().toLocaleDateString('fr-FR'),
            time: "14:00",
            location: "Paris, France",
            price: 50,
          }
        },
        password_reset: {
          email: recipient,
          resetUrl: `${window.location.origin}/reset-password?token=test-token`,
        },
        provider_signup: {
          providerName: "Prestataire Test",
          adminEmail: recipient,
        },
        welcome: {
          recipientEmail: recipient,
          recipientName: "Nouvel Utilisateur",
        }
      };

      // Sélectionner les données appropriées
      const emailData = testData[selectedTemplate as keyof typeof testData] || {
        recipientEmail: recipient,
        subject: customSubject || 'Email de test',
        message: customMessage || 'Ceci est un email de test',
      };

      // Déterminer quelle fonction edge utiliser
      let functionName = 'send-notification';
      
      switch (selectedTemplate) {
        case 'password_reset':
          functionName = 'send-password-reset';
          break;
        case 'provider_signup':
          functionName = 'send-provider-signup-notification';
          break;
        default:
          functionName = 'send-notification';
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: emailData
      });

      if (error) {
        throw error;
      }

      // Mettre à jour le test comme réussi
      setTests(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'sent' as const }
          : test
      ));

      toast({
        title: "Email envoyé",
        description: `Email de test envoyé à ${recipient}`,
      });

    } catch (error) {
      console.error('Erreur envoi email:', error);
      
      // Mettre à jour le test comme échoué
      setTests(prev => prev.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: 'failed' as const, 
              error: error instanceof Error ? error.message : 'Erreur inconnue' 
            }
          : test
      ));

      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email de test",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: EmailTest['status']) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }
  };

  const getStatusBadge = (status: EmailTest['status']) => {
    const variants = {
      sent: 'default',
      failed: 'destructive',
      pending: 'secondary'
    } as const;

    const labels = {
      sent: 'Envoyé',
      failed: 'Échoué',
      pending: 'En cours'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Test d'envoi d'emails
          </CardTitle>
          <CardDescription>
            Testez les différents templates d'emails pour vérifier leur fonctionnement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Template d'email</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un template" />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map((template) => (
                    <SelectItem key={template.value} value={template.value}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email destinataire</label>
              <Input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
          </div>

          {selectedTemplate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Sujet personnalisé (optionnel)</label>
                <Input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Sujet de l'email de test"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Message personnalisé (optionnel)</label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Message personnalisé pour le test"
                  rows={3}
                />
              </div>
            </div>
          )}

          <Button 
            onClick={sendTestEmail} 
            disabled={loading || !selectedTemplate || !recipient}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Envoyer l'email de test
          </Button>
        </CardContent>
      </Card>

      {tests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <p className="font-medium text-foreground">
                        {EMAIL_TEMPLATES.find(t => t.value === test.type)?.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {test.recipient} • {test.timestamp.toLocaleTimeString('fr-FR')}
                      </p>
                      {test.error && (
                        <p className="text-sm text-red-600 mt-1">{test.error}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(test.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};