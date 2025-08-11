import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EMAIL_TEMPLATES, NOTIFICATION_TEMPLATES, COMPANY_CONFIG, type EmailTemplateConfig, type NotificationConfig } from '@/utils/emailConfig';

export default function EmailConfigManager() {
  const [emailTemplates, setEmailTemplates] = useState(EMAIL_TEMPLATES);
  const [notificationTemplates, setNotificationTemplates] = useState(NOTIFICATION_TEMPLATES);
  const [companyConfig, setCompanyConfig] = useState(COMPANY_CONFIG);
  const [loading, setLoading] = useState(false);

  const updateEmailTemplate = (templateKey: string, field: keyof EmailTemplateConfig, value: string) => {
    setEmailTemplates(prev => ({
      ...prev,
      [templateKey]: {
        ...prev[templateKey],
        [field]: value
      }
    }));
  };

  const updateNotificationTemplate = (templateKey: string, field: keyof NotificationConfig, value: string) => {
    setNotificationTemplates(prev => ({
      ...prev,
      [templateKey]: {
        ...prev[templateKey],
        [field]: value
      }
    }));
  };

  const saveConfiguration = async () => {
    setLoading(true);
    try {
      // Sauvegarder dans localStorage pour le moment
      // Plus tard, on pourra sauvegarder en base de données
      localStorage.setItem('emailTemplates', JSON.stringify(emailTemplates));
      localStorage.setItem('notificationTemplates', JSON.stringify(notificationTemplates));
      localStorage.setItem('companyConfig', JSON.stringify(companyConfig));
      
      toast.success('Configuration sauvegardée avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error('Error saving config:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setEmailTemplates(EMAIL_TEMPLATES);
    setNotificationTemplates(NOTIFICATION_TEMPLATES);
    setCompanyConfig(COMPANY_CONFIG);
    toast.info('Configuration réinitialisée aux valeurs par défaut');
  };

  const previewEmail = (templateKey: string) => {
    const template = emailTemplates[templateKey];
    const previewWindow = window.open('', '_blank', 'width=600,height=800');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Aperçu Email - ${template.title}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: ${companyConfig.colors.primary}; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .button { background: ${companyConfig.colors.primary}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
              .footer { color: #666; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${template.title}</h1>
            </div>
            <div class="content">
              <p><strong>${template.greeting}</strong></p>
              <p>${template.content}</p>
              <a href="#" class="button">${template.buttonText}</a>
              <p style="color: #666;">${template.footer}</p>
              <p class="footer">
                Cordialement,<br>
                ${template.signature}
              </p>
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  // Charger la configuration sauvegardée au démarrage
  useEffect(() => {
    try {
      const savedEmailTemplates = localStorage.getItem('emailTemplates');
      const savedNotificationTemplates = localStorage.getItem('notificationTemplates');
      const savedCompanyConfig = localStorage.getItem('companyConfig');

      if (savedEmailTemplates) {
        setEmailTemplates(JSON.parse(savedEmailTemplates));
      }
      if (savedNotificationTemplates) {
        setNotificationTemplates(JSON.parse(savedNotificationTemplates));
      }
      if (savedCompanyConfig) {
        setCompanyConfig(JSON.parse(savedCompanyConfig));
      }
    } catch (error) {
      console.error('Error loading saved config:', error);
    }
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuration des Messages</h1>
          <p className="text-muted-foreground">Personnalisez vos emails et notifications</p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={resetToDefaults}>
            Réinitialiser
          </Button>
          <Button onClick={saveConfiguration} disabled={loading}>
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="emails" className="space-y-4">
        <TabsList>
          <TabsTrigger value="emails">Templates Email</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="company">Configuration Entreprise</TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="space-y-4">
          {Object.entries(emailTemplates).map(([key, template]) => (
            <Card key={key}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    {template.title}
                    <Badge variant="secondary">{key}</Badge>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => previewEmail(key)}>
                    Aperçu
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`${key}-subject`}>Sujet</Label>
                    <Input
                      id={`${key}-subject`}
                      value={template.subject}
                      onChange={(e) => updateEmailTemplate(key, 'subject', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${key}-title`}>Titre</Label>
                    <Input
                      id={`${key}-title`}
                      value={template.title}
                      onChange={(e) => updateEmailTemplate(key, 'title', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${key}-greeting`}>Salutation</Label>
                    <Input
                      id={`${key}-greeting`}
                      value={template.greeting}
                      onChange={(e) => updateEmailTemplate(key, 'greeting', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${key}-button`}>Texte du bouton</Label>
                    <Input
                      id={`${key}-button`}
                      value={template.buttonText}
                      onChange={(e) => updateEmailTemplate(key, 'buttonText', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`${key}-content`}>Contenu principal</Label>
                    <Textarea
                      id={`${key}-content`}
                      value={template.content}
                      onChange={(e) => updateEmailTemplate(key, 'content', e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${key}-footer`}>Pied de page</Label>
                    <Textarea
                      id={`${key}-footer`}
                      value={template.footer}
                      onChange={(e) => updateEmailTemplate(key, 'footer', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${key}-signature`}>Signature</Label>
                    <Input
                      id={`${key}-signature`}
                      value={template.signature}
                      onChange={(e) => updateEmailTemplate(key, 'signature', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          {Object.entries(notificationTemplates).map(([key, notification]) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {notification.title}
                  <Badge variant="secondary">{key}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`notif-${key}-title`}>Titre</Label>
                  <Input
                    id={`notif-${key}-title`}
                    value={notification.title}
                    onChange={(e) => updateNotificationTemplate(key, 'title', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`notif-${key}-message`}>Message</Label>
                  <Textarea
                    id={`notif-${key}-message`}
                    value={notification.message}
                    onChange={(e) => updateNotificationTemplate(key, 'message', e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor={`notif-${key}-action`}>Texte d'action</Label>
                  <Input
                    id={`notif-${key}-action`}
                    value={notification.actionText || ''}
                    onChange={(e) => updateNotificationTemplate(key, 'actionText', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration de l'entreprise</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-name">Nom de l'entreprise</Label>
                <Input
                  id="company-name"
                  value={companyConfig.name}
                  onChange={(e) => setCompanyConfig(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="company-domain">Domaine</Label>
                <Input
                  id="company-domain"
                  value={companyConfig.domain}
                  onChange={(e) => setCompanyConfig(prev => ({ ...prev, domain: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="company-email">Email principal</Label>
                <Input
                  id="company-email"
                  value={companyConfig.email}
                  onChange={(e) => setCompanyConfig(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="support-email">Email support</Label>
                <Input
                  id="support-email"
                  value={companyConfig.supportEmail}
                  onChange={(e) => setCompanyConfig(prev => ({ ...prev, supportEmail: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="website-url">URL du site</Label>
                <Input
                  id="website-url"
                  value={companyConfig.websiteUrl}
                  onChange={(e) => setCompanyConfig(prev => ({ ...prev, websiteUrl: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="logo-url">URL du logo</Label>
                <Input
                  id="logo-url"
                  value={companyConfig.logoUrl}
                  onChange={(e) => setCompanyConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}