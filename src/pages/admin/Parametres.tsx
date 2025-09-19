import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Save, 
  Palette, 
  Globe, 
  Shield, 
  Mail, 
  CreditCard,
  Users,
  Bell,
  Database,
  Zap,
  RefreshCw
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlatformSettings {
  general: {
    site_name: string;
    site_description: string;
    contact_email: string;
    default_language: string;
    timezone: string;
    maintenance_mode: boolean;
  };
  payments: {
    stripe_enabled: boolean;
    commission_rate: number;
    minimum_payout: number;
    auto_payout: boolean;
    currency: string;
  };
  notifications: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    admin_alerts: boolean;
  };
  security: {
    require_email_verification: boolean;
    two_factor_auth: boolean;
    session_timeout: number;
    password_min_length: number;
  };
  business: {
    auto_assignment: boolean;
    max_providers_per_request: number;
    request_timeout_hours: number;
    rating_required: boolean;
  };
}

const Parametres = () => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('platform-settings', {
        body: { action: 'get' }
      });

      if (error) throw error;

      if (data?.success) {
        setSettings(data.settings);
      } else {
        throw new Error('Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      
      const { data, error } = await supabase.functions.invoke('platform-settings', {
        body: { 
          action: 'update',
          settings 
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Paramètres sauvegardés",
          description: `${data.updatedCount} paramètres mis à jour avec succès.`,
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      
      const { data, error } = await supabase.functions.invoke('platform-settings', {
        body: { action: 'reset' }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Paramètres réinitialisés",
          description: "Tous les paramètres ont été remis aux valeurs par défaut.",
        });
        await loadSettings(); // Reload settings
      } else {
        throw new Error('Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de réinitialiser les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category: keyof PlatformSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    });
  };

  if (loading || !settings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
            <p className="text-muted-foreground">Configuration générale de la plateforme</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="w-full h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-muted animate-pulse rounded" />
                  <div className="w-3/4 h-3 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">Configuration générale de la plateforme</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres Généraux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">5 configurations</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={settings.payments.stripe_enabled ? "default" : "destructive"}>
              {settings.payments.stripe_enabled ? "Actif" : "Inactif"}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">
              {Object.values(settings.notifications).filter(Boolean).length}/4 activées
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={settings.security.two_factor_auth ? "default" : "outline"}>
              2FA {settings.security.two_factor_auth ? "Activé" : "Désactivé"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Configuration détaillée */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            Général
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="w-4 h-4 mr-2" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="business">
            <Users className="w-4 h-4 mr-2" />
            Business
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>
                Configuration de base de votre plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Nom du site</Label>
                  <Input
                    id="site_name"
                    value={settings.general.site_name}
                    onChange={(e) => updateSetting('general', 'site_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email de contact</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.general.contact_email}
                    onChange={(e) => updateSetting('general', 'contact_email', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="site_description">Description du site</Label>
                <Textarea
                  id="site_description"
                  value={settings.general.site_description}
                  onChange={(e) => updateSetting('general', 'site_description', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Langue par défaut</Label>
                  <Select 
                    value={settings.general.default_language}
                    onValueChange={(value) => updateSetting('general', 'default_language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fuseau horaire</Label>
                  <Select 
                    value={settings.general.timezone}
                    onValueChange={(value) => updateSetting('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenance_mode"
                  checked={settings.general.maintenance_mode}
                  onCheckedChange={(checked) => updateSetting('general', 'maintenance_mode', checked)}
                />
                <Label htmlFor="maintenance_mode">Mode maintenance</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des Paiements</CardTitle>
              <CardDescription>
                Gérez les paramètres de paiement et commissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="stripe_enabled"
                  checked={settings.payments.stripe_enabled}
                  onCheckedChange={(checked) => updateSetting('payments', 'stripe_enabled', checked)}
                />
                <Label htmlFor="stripe_enabled">Activer Stripe</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commission_rate">Taux de commission (%)</Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    value={settings.payments.commission_rate}
                    onChange={(e) => updateSetting('payments', 'commission_rate', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum_payout">Paiement minimum (€)</Label>
                  <Input
                    id="minimum_payout"
                    type="number"
                    value={settings.payments.minimum_payout}
                    onChange={(e) => updateSetting('payments', 'minimum_payout', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Devise</Label>
                  <Select 
                    value={settings.payments.currency}
                    onValueChange={(value) => updateSetting('payments', 'currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_payout"
                  checked={settings.payments.auto_payout}
                  onCheckedChange={(checked) => updateSetting('payments', 'auto_payout', checked)}
                />
                <Label htmlFor="auto_payout">Paiements automatiques</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Notifications</CardTitle>
              <CardDescription>
                Configurez les types de notifications envoyées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email_notifications">Notifications email</Label>
                    <p className="text-sm text-muted-foreground">Envoyer des emails aux utilisateurs</p>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={settings.notifications.email_notifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'email_notifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms_notifications">Notifications SMS</Label>
                    <p className="text-sm text-muted-foreground">Envoyer des SMS aux utilisateurs</p>
                  </div>
                  <Switch
                    id="sms_notifications"
                    checked={settings.notifications.sms_notifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'sms_notifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push_notifications">Notifications push</Label>
                    <p className="text-sm text-muted-foreground">Notifications dans le navigateur</p>
                  </div>
                  <Switch
                    id="push_notifications"
                    checked={settings.notifications.push_notifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'push_notifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="admin_alerts">Alertes admin</Label>
                    <p className="text-sm text-muted-foreground">Recevoir les alertes importantes</p>
                  </div>
                  <Switch
                    id="admin_alerts"
                    checked={settings.notifications.admin_alerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'admin_alerts', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Sécurité</CardTitle>
              <CardDescription>
                Configurez la sécurité de votre plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require_email_verification">Vérification email obligatoire</Label>
                    <p className="text-sm text-muted-foreground">Les utilisateurs doivent vérifier leur email</p>
                  </div>
                  <Switch
                    id="require_email_verification"
                    checked={settings.security.require_email_verification}
                    onCheckedChange={(checked) => updateSetting('security', 'require_email_verification', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="two_factor_auth">Authentification à deux facteurs</Label>
                    <p className="text-sm text-muted-foreground">Sécurité renforcée pour les comptes</p>
                  </div>
                  <Switch
                    id="two_factor_auth"
                    checked={settings.security.two_factor_auth}
                    onCheckedChange={(checked) => updateSetting('security', 'two_factor_auth', checked)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Timeout session (heures)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={settings.security.session_timeout}
                    onChange={(e) => updateSetting('security', 'session_timeout', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_min_length">Longueur min. mot de passe</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    value={settings.security.password_min_length}
                    onChange={(e) => updateSetting('security', 'password_min_length', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Business</CardTitle>
              <CardDescription>
                Configuration des règles métier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_assignment"
                  checked={settings.business.auto_assignment}
                  onCheckedChange={(checked) => updateSetting('business', 'auto_assignment', checked)}
                />
                <Label htmlFor="auto_assignment">Attribution automatique des missions</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_providers_per_request">Max prestataires par demande</Label>
                  <Input
                    id="max_providers_per_request"
                    type="number"
                    value={settings.business.max_providers_per_request}
                    onChange={(e) => updateSetting('business', 'max_providers_per_request', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="request_timeout_hours">Timeout demandes (heures)</Label>
                  <Input
                    id="request_timeout_hours"
                    type="number"
                    value={settings.business.request_timeout_hours}
                    onChange={(e) => updateSetting('business', 'request_timeout_hours', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating_required">Évaluation obligatoire</Label>
                  <Switch
                    id="rating_required"
                    checked={settings.business.rating_required}
                    onCheckedChange={(checked) => updateSetting('business', 'rating_required', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Parametres;