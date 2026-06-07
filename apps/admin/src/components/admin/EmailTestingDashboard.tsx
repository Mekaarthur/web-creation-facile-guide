import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Mail, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type EmailTemplate = 
  | 'booking_confirmation'
  | 'provider_assigned'
  | 'booking_reminder'
  | 'mission_started'
  | 'mission_completed'
  | 'cancellation'
  | 'refund_processed'
  | 'account_created'
  | 'password_setup'
  | 'account_deleted'
  | 'review_request'
  | 'provider_new_mission'
  | 'provider_mission_confirmed'
  | 'provider_reminder'
  | 'provider_payment'
  | 'invoice_available'
  | 'provider_document_validated'
  | 'provider_document_rejected'
  | 'provider_training_reminder'
  | 'provider_account_activated';

interface TestResult {
  id: string;
  template: EmailTemplate;
  email: string;
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
  error?: string;
}

const EMAIL_TEMPLATES: { value: EmailTemplate; label: string; description: string }[] = [
  { value: 'booking_confirmation', label: '✅ Confirmation de réservation', description: 'Email envoyé à la création d\'une réservation' },
  { value: 'provider_assigned', label: '👤 Prestataire assigné', description: 'Email envoyé quand un prestataire est assigné' },
  { value: 'booking_reminder', label: '⏰ Rappel 24h avant', description: 'Email de rappel envoyé 24h avant la prestation' },
  { value: 'mission_started', label: '▶️ Mission commencée', description: 'Email envoyé au check-in du prestataire' },
  { value: 'mission_completed', label: '✔️ Mission terminée', description: 'Email envoyé au check-out + demande d\'avis' },
  { value: 'cancellation', label: '❌ Annulation', description: 'Email d\'annulation avec conditions de remboursement' },
  { value: 'refund_processed', label: '💰 Remboursement', description: 'Confirmation de remboursement' },
  { value: 'account_created', label: '🎉 Compte créé', description: 'Bienvenue + lien de connexion' },
  { value: 'password_setup', label: '🔐 Création mot de passe', description: 'Lien pour créer/configurer le mot de passe' },
  { value: 'account_deleted', label: '🗑️ Suppression de compte', description: 'Confirmation de suppression' },
  { value: 'review_request', label: '⭐ Demande d\'avis', description: 'Email pour inviter le client à laisser un avis' },
  { value: 'provider_new_mission', label: '🎯 Nouvelle mission (prestataire)', description: 'Notification d\'attribution de mission' },
  { value: 'provider_mission_confirmed', label: '✅ Mission confirmée (prestataire)', description: 'Confirmation par le client' },
  { value: 'provider_reminder', label: '⏰ Rappel mission (prestataire)', description: 'Rappel 24h avant pour prestataire' },
  { value: 'provider_payment', label: '💵 Paiement (prestataire)', description: 'Confirmation de paiement prestataire' },
  { value: 'invoice_available', label: '📄 Facture disponible', description: 'Notification de facture disponible' },
  { value: 'provider_document_validated', label: '✅ Documents validés', description: 'Validation des documents prestataire' },
  { value: 'provider_document_rejected', label: '⚠️ Documents refusés', description: 'Refus des documents avec raison' },
  { value: 'provider_training_reminder', label: '📚 Rappel formation', description: 'Rappel pour compléter la formation' },
  { value: 'provider_account_activated', label: '🎉 Compte activé', description: 'Activation du compte prestataire' },
];

const EmailTestingDashboard = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>('booking_confirmation');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const getMockData = (template: EmailTemplate) => {
    const baseData = {
      clientName: 'Test Client',
      serviceName: 'Garde d\'enfants',
      bookingDate: new Date().toLocaleDateString('fr-FR'),
      startTime: '14:00',
      endTime: '18:00',
      address: '123 Rue de Test, 75001 Paris',
      totalPrice: 75.00,
      bookingId: 'test-' + Date.now()
    };

    switch (template) {
      case 'provider_assigned':
        return {
          ...baseData,
          providerName: 'Marie Dupont',
          providerRating: 4.8
        };
      case 'mission_started':
      case 'mission_completed':
        return {
          ...baseData,
          providerName: 'Marie Dupont',
          checkInTime: '14:05'
        };
      case 'cancellation':
        return {
          ...baseData,
          cancellationReason: 'Test d\'annulation',
          refundAmount: 75.00,
          refundPercentage: 100
        };
      case 'refund_processed':
        return {
          ...baseData,
          refundAmount: 75.00,
          originalAmount: 75.00,
          refundReason: 'Annulation de la prestation',
          refundMethod: 'Carte bancaire',
          refundDate: new Date().toLocaleDateString('fr-FR')
        };
      case 'account_created':
        return {
          clientName: 'Test Client',
          appUrl: 'https://bikawo.com'
        };
      case 'password_setup':
        return {
          clientName: 'Test Client',
          setupLink: 'https://bikawo.com/update-password'
        };
      case 'account_deleted':
        return {
          clientName: 'Test Client',
          deletionDate: new Date().toLocaleDateString('fr-FR')
        };
      case 'review_request':
        return {
          ...baseData,
          providerName: 'Marie Dupont',
          reviewLink: 'https://bikawo.com/espace-personnel'
        };
      case 'provider_new_mission':
        return {
          providerName: 'Marie Dupont',
          serviceName: 'Garde d\'enfants',
          bookingDate: new Date().toLocaleDateString('fr-FR'),
          startTime: '14:00',
          endTime: '18:00',
          address: '123 Rue de Test, 75001 Paris',
          clientNotes: 'Les enfants aiment les activités créatives',
          missionLink: 'https://bikawo.com/espace-prestataire'
        };
      case 'provider_mission_confirmed':
        return {
          providerName: 'Marie Dupont',
          serviceName: 'Garde d\'enfants',
          bookingDate: new Date().toLocaleDateString('fr-FR'),
          startTime: '14:00',
          clientName: 'Famille Dupont',
          address: '123 Rue de Test, 75001 Paris',
          missionLink: 'https://bikawo.com/espace-prestataire'
        };
      case 'provider_reminder':
        return {
          providerName: 'Marie Dupont',
          serviceName: 'Garde d\'enfants',
          bookingDate: new Date().toLocaleDateString('fr-FR'),
          startTime: '14:00',
          endTime: '18:00',
          address: '123 Rue de Test, 75001 Paris',
          clientPhone: '+33 6 12 34 56 78',
          missionLink: 'https://bikawo.com/espace-prestataire'
        };
      case 'provider_payment':
        return {
          providerName: 'Marie Dupont',
          serviceName: 'Garde d\'enfants',
          missionDate: new Date().toLocaleDateString('fr-FR'),
          hoursWorked: 4,
          grossAmount: 72.00,
          netAmount: 60.00,
          paymentDate: new Date().toLocaleDateString('fr-FR'),
          invoiceLink: 'https://bikawo.com/espace-prestataire'
        };
      case 'invoice_available':
        return {
          clientName: 'Test Client',
          invoiceNumber: 'INV-2025-001',
          serviceName: 'Garde d\'enfants',
          totalAmount: 75.00,
          invoiceDate: new Date().toLocaleDateString('fr-FR'),
          invoiceLink: 'https://bikawo.com/espace-personnel'
        };
      case 'provider_document_validated':
        return {
          providerName: 'Marie Dupont',
          documentType: 'Attestation d\'assurance professionnelle',
          nextStep: 'Formation obligatoire'
        };
      case 'provider_document_rejected':
        return {
          providerName: 'Marie Dupont',
          documentType: 'Carte d\'identité',
          rejectionReason: 'Document illisible - Merci de fournir un scan plus net'
        };
      case 'provider_training_reminder':
        return {
          providerName: 'Marie Dupont',
          trainingProgress: 45
        };
      case 'provider_account_activated':
        return {
          providerName: 'Marie Dupont',
          businessName: 'Services MD'
        };
      default:
        return baseData;
    }
  };

  const sendTestEmail = async () => {
    if (!recipientEmail) {
      toast.error('Veuillez entrer une adresse email');
      return;
    }

    const testId = Date.now().toString();
    const newTest: TestResult = {
      id: testId,
      template: selectedTemplate,
      email: recipientEmail,
      status: 'pending',
      timestamp: new Date()
    };

    setTestResults(prev => [newTest, ...prev]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          type: selectedTemplate,
          recipientEmail: recipientEmail,
          recipientName: 'Test User',
          data: getMockData(selectedTemplate)
        }
      });

      if (error) throw error;

      setTestResults(prev =>
        prev.map(test =>
          test.id === testId
            ? { ...test, status: 'success' }
            : test
        )
      );

      toast.success('Email de test envoyé avec succès !', {
        description: `Template: ${EMAIL_TEMPLATES.find(t => t.value === selectedTemplate)?.label}`
      });
    } catch (error: any) {
      console.error('Erreur envoi email test:', error);
      
      setTestResults(prev =>
        prev.map(test =>
          test.id === testId
            ? { ...test, status: 'error', error: error.message }
            : test
        )
      );

      toast.error('Échec de l\'envoi', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default' as const,
      error: 'destructive' as const,
      pending: 'secondary' as const
    };

    const labels = {
      success: 'Envoyé',
      error: 'Échec',
      pending: 'En cours...'
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Tests Emails Transactionnels</h1>
          <p className="text-muted-foreground">Testez tous vos templates d'emails avec Resend</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Formulaire de test */}
        <Card>
          <CardHeader>
            <CardTitle>Envoyer un email de test</CardTitle>
            <CardDescription>
              Sélectionnez un template et entrez une adresse email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Template d'email</Label>
              <Select
                value={selectedTemplate}
                onValueChange={(value) => setSelectedTemplate(value as EmailTemplate)}
              >
                <SelectTrigger id="template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map((template) => (
                    <SelectItem key={template.value} value={template.value}>
                      <div>
                        <div className="font-medium">{template.label}</div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Adresse email destinataire</Label>
              <Input
                id="email"
                type="email"
                placeholder="test@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            <Button
              onClick={sendTestEmail}
              disabled={isLoading}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Envoi en cours...' : 'Envoyer l\'email de test'}
            </Button>
          </CardContent>
        </Card>

        {/* Informations sur le template */}
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
            <CardDescription>
              À propos du template sélectionné
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Template actuel:</h3>
              <p className="text-sm text-muted-foreground">
                {EMAIL_TEMPLATES.find(t => t.value === selectedTemplate)?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {EMAIL_TEMPLATES.find(t => t.value === selectedTemplate)?.description}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Données de test:</h3>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-[200px]">
                {JSON.stringify(getMockData(selectedTemplate), null, 2)}
              </pre>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Les emails sont envoyés via Resend. Vérifiez vos logs Supabase pour plus de détails.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historique des tests */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des tests</CardTitle>
            <CardDescription>
              Résultats des {testResults.length} derniers tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium">
                        {EMAIL_TEMPLATES.find(t => t.value === result.template)?.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {result.email} • {result.timestamp.toLocaleTimeString('fr-FR')}
                      </p>
                      {result.error && (
                        <p className="text-xs text-red-500 mt-1">{result.error}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailTestingDashboard;