import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Palette, Heart, MessageSquare, Mail, Bell, Settings } from 'lucide-react';
import { EMAIL_TEMPLATES, NOTIFICATION_TEMPLATES, COMPANY_CONFIG, type EmailTemplateConfig, type NotificationConfig } from '@/utils/emailConfig';

export default function ConfigMessages() {
  const [emailTemplates, setEmailTemplates] = useState(EMAIL_TEMPLATES);
  const [notificationTemplates, setNotificationTemplates] = useState(NOTIFICATION_TEMPLATES);
  const [companyConfig, setCompanyConfig] = useState(COMPANY_CONFIG);
  const [loading, setLoading] = useState(false);

  // Variables disponibles pour personnalisation
  const availableVariables = [
    '{prenom_client}', '{prenom_prestataire}', '{type_prestation}',
    '{date}', '{heure}', '{lieu}', '{prix}', '{tarif}', '{duree}'
  ];

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

  const updateTonality = (field: string, value: any) => {
    setCompanyConfig(prev => ({
      ...prev,
      tonality: {
        ...prev.tonality,
        [field]: value
      }
    }));
  };

  const saveConfiguration = async () => {
    setLoading(true);
    try {
      localStorage.setItem('bikawo_email_templates', JSON.stringify(emailTemplates));
      localStorage.setItem('bikawo_notification_templates', JSON.stringify(notificationTemplates));
      localStorage.setItem('bikawo_company_config', JSON.stringify(companyConfig));
      
      toast.success('💛 Configuration sauvegardée avec tendresse !');
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
    toast.info('🔄 Configuration réinitialisée aux valeurs Bikawo');
  };

  const previewEmail = (templateKey: string) => {
    const template = emailTemplates[templateKey];
    const previewData = {
      prenom_client: "Marie",
      prenom_prestataire: "Sophie", 
      type_prestation: "Ménage à domicile",
      date: "15 août 2024",
      heure: "14h00",
      lieu: "Paris 15ème",
      prix: "45€",
      tarif: "15€/h",
      duree: "3h"
    };

    // Remplacer les variables dans le template
    let previewContent = template.content;
    let previewSubject = template.subject;
    let previewGreeting = template.greeting;

    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      previewContent = previewContent.replace(regex, value);
      previewSubject = previewSubject.replace(regex, value);
      previewGreeting = previewGreeting.replace(regex, value);
    });

    const previewWindow = window.open('', '_blank', 'width=600,height=800');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Aperçu Email Bikawo - ${template.title}</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                max-width: 600px; margin: 0 auto; padding: 20px; 
                background: #f8fafc;
              }
              .email-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              .header { 
                background: linear-gradient(135deg, ${companyConfig.colors.primary}, ${companyConfig.colors.secondary}); 
                color: white; padding: 30px; text-align: center; 
              }
              .content { padding: 30px; line-height: 1.6; }
              .greeting { font-size: 18px; font-weight: 600; color: #334155; margin-bottom: 20px; }
              .main-content { color: #475569; font-size: 16px; margin-bottom: 25px; }
              .button { 
                background: linear-gradient(135deg, ${companyConfig.colors.primary}, ${companyConfig.colors.secondary}); 
                color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; 
                display: inline-block; margin: 20px 0; font-weight: 600;
                transition: transform 0.2s;
              }
              .button:hover { transform: translateY(-1px); }
              .footer { color: #64748b; font-size: 14px; margin-top: 30px; }
              .signature { font-weight: 600; color: ${companyConfig.colors.primary}; margin-top: 20px; }
              .variables { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .variable-tag { background: white; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">💛 ${template.title}</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Sujet: ${previewSubject}</p>
              </div>
              <div class="content">
                <div class="greeting">${previewGreeting}</div>
                <div class="main-content">${previewContent}</div>
                <a href="#" class="button">${template.buttonText}</a>
                <div class="footer">${template.footer}</div>
                <div class="signature">${template.signature}</div>
                <div class="variables">
                  <strong>Variables utilisées dans l'aperçu :</strong><br>
                  ${Object.entries(previewData).map(([key, value]) => 
                    `<span class="variable-tag">{${key}} → ${value}</span>`
                  ).join(' ')}
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  // Charger la configuration sauvegardée
  useEffect(() => {
    try {
      const savedEmailTemplates = localStorage.getItem('bikawo_email_templates');
      const savedNotificationTemplates = localStorage.getItem('bikawo_notification_templates');
      const savedCompanyConfig = localStorage.getItem('bikawo_company_config');

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

  // Organiser les templates par catégorie
  const clientEmailTemplates = Object.entries(emailTemplates).filter(([key]) => key.startsWith('client_'));
  const providerEmailTemplates = Object.entries(emailTemplates).filter(([key]) => key.startsWith('provider_'));
  const systemEmailTemplates = Object.entries(emailTemplates).filter(([key]) => !key.startsWith('client_') && !key.startsWith('provider_'));

  const clientNotifications = Object.entries(notificationTemplates).filter(([key]) => key.startsWith('client_') || key.includes('client'));
  const providerNotifications = Object.entries(notificationTemplates).filter(([key]) => key.startsWith('provider_') || key.includes('provider'));
  const systemNotifications = Object.entries(notificationTemplates).filter(([key]) => !key.includes('client') && !key.includes('provider'));

  return (
    <>
      <Helmet>
        <title>Configuration des Messages - Bikawo Admin</title>
        <meta name="description" content="Personnalisez vos templates d'emails et notifications avec la tendresse Bikawo" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Heart className="w-8 h-8 text-primary" />
                Configuration des Messages Bikawo
              </h1>
              <p className="text-muted-foreground">Personnalisez vos emails et notifications avec tendresse</p>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={resetToDefaults}>
                <Settings className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
              <Button onClick={saveConfiguration} disabled={loading}>
                {loading ? 'Sauvegarde...' : '💛 Sauvegarder'}
              </Button>
            </div>
          </div>

          {/* Variables disponibles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Variables de personnalisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableVariables.map(variable => (
                  <Badge key={variable} variant="secondary" className="font-mono text-xs">
                    {variable}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Utilisez ces variables dans vos templates pour personnaliser automatiquement le contenu
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="emails" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="emails" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-mails
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="tonality" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Tonalité Bikawo
              </TabsTrigger>
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuration
              </TabsTrigger>
            </TabsList>

            <TabsContent value="emails" className="space-y-6">
              {/* E-mails Clients */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  E-mails Clients
                </h3>
                <div className="space-y-4">
                  {clientEmailTemplates.map(([key, template]) => (
                    <Card key={key}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="flex items-center gap-2">
                            {template.title}
                            <Badge variant="outline">{key}</Badge>
                          </CardTitle>
                          <Button variant="outline" size="sm" onClick={() => previewEmail(key)}>
                            👀 Aperçu
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
                              rows={3}
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
                </div>
              </div>

              {/* E-mails Prestataires */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  E-mails Prestataires
                </h3>
                <div className="space-y-4">
                  {providerEmailTemplates.map(([key, template]) => (
                    <Card key={key}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="flex items-center gap-2">
                            {template.title}
                            <Badge variant="outline">{key}</Badge>
                          </CardTitle>
                          <Button variant="outline" size="sm" onClick={() => previewEmail(key)}>
                            👀 Aperçu
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
                              rows={3}
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
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              {/* Notifications Clients */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-500" />
                  Notifications Clients
                </h3>
                <div className="grid gap-4">
                  {clientNotifications.map(([key, notification]) => (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {notification.title}
                          <Badge variant="outline">{key}</Badge>
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
                </div>
              </div>

              {/* Notifications Prestataires */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-green-500" />
                  Notifications Prestataires
                </h3>
                <div className="grid gap-4">
                  {providerNotifications.map(([key, notification]) => (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {notification.title}
                          <Badge variant="outline">{key}</Badge>
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
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tonality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                    Tonalité Bikawo - L'âme de nos communications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-pink-50 to-purple-50">
                    <div>
                      <h4 className="font-semibold">Mode Tonalité Bikawo</h4>
                      <p className="text-sm text-muted-foreground">
                        Active la personnalité tendre et chaleureuse dans tous les messages
                      </p>
                    </div>
                    <Switch
                      checked={companyConfig.tonality.enabled}
                      onCheckedChange={(value) => updateTonality('enabled', value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tonality-style">Style de communication</Label>
                        <Select
                          value={companyConfig.tonality.style}
                          onValueChange={(value) => updateTonality('style', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tendre">💛 Tendre et bienveillant</SelectItem>
                            <SelectItem value="professionnel">💼 Professionnel chaleureux</SelectItem>
                            <SelectItem value="décontracté">😊 Décontracté et amical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Utiliser des émojis</Label>
                          <p className="text-sm text-muted-foreground">Ajoute des émojis pour plus de douceur</p>
                        </div>
                        <Switch
                          checked={companyConfig.tonality.useEmojis}
                          onCheckedChange={(value) => updateTonality('useEmojis', value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Salutations chaleureuses</Label>
                          <p className="text-sm text-muted-foreground">Active les formules de politesse personnalisées</p>
                        </div>
                        <Switch
                          checked={companyConfig.tonality.warmGreetings}
                          onCheckedChange={(value) => updateTonality('warmGreetings', value)}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2">Aperçu du style sélectionné</h4>
                      <div className="space-y-2 text-sm">
                        {companyConfig.tonality.style === 'tendre' && (
                          <div>
                            <p><strong>Exemple :</strong> "Bonjour Marie 💛, nous avons trouvé votre perle rare ✨"</p>
                            <p className="text-muted-foreground">Ton : Doux, maternel, réconfortant</p>
                          </div>
                        )}
                        {companyConfig.tonality.style === 'professionnel' && (
                          <div>
                            <p><strong>Exemple :</strong> "Bonjour Marie, nous avons le plaisir de vous informer..."</p>
                            <p className="text-muted-foreground">Ton : Respectueux, efficace, rassurant</p>
                          </div>
                        )}
                        {companyConfig.tonality.style === 'décontracté' && (
                          <div>
                            <p><strong>Exemple :</strong> "Salut Marie 😊, super nouvelle ! On a trouvé quelqu'un de génial..."</p>
                            <p className="text-muted-foreground">Ton : Amical, accessible, détendu</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

              <Card>
                <CardHeader>
                  <CardTitle>Couleurs de la marque</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="color-primary">Couleur primaire</Label>
                    <Input
                      id="color-primary"
                      type="color"
                      value={companyConfig.colors.primary}
                      onChange={(e) => setCompanyConfig(prev => ({ 
                        ...prev, 
                        colors: { ...prev.colors, primary: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color-secondary">Couleur secondaire</Label>
                    <Input
                      id="color-secondary"
                      type="color"
                      value={companyConfig.colors.secondary}
                      onChange={(e) => setCompanyConfig(prev => ({ 
                        ...prev, 
                        colors: { ...prev.colors, secondary: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color-accent">Couleur d'accent</Label>
                    <Input
                      id="color-accent"
                      type="color"
                      value={companyConfig.colors.accent}
                      onChange={(e) => setCompanyConfig(prev => ({ 
                        ...prev, 
                        colors: { ...prev.colors, accent: e.target.value }
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}