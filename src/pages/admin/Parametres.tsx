import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
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
  RefreshCw,
  UserCheck,
  Target,
  FileCheck
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
  qualification: {
    legal_status_required: boolean;
    identity_verification: boolean;
    insurance_required: boolean;
    diploma_required_regulated: boolean;
    initial_selection_enabled: boolean;
    background_check_required: boolean;
    minimum_experience_years: number;
  };
  matching: {
    geographic_zone_priority: boolean;
    availability_check_enabled: boolean;
    service_type_matching: boolean;
    provider_choice_enabled: boolean;
    max_distance_km: number;
    response_timeout_hours: number;
    rating_weight: number;
    distance_weight: number;
    availability_weight: number;
  };
  validation: {
    auto_validation_enabled: boolean;
    manual_review_required: boolean;
    validation_timeout_days: number;
    rejected_reapplication_days: number;
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
          <TabsTrigger value="qualification">
            <UserCheck className="w-4 h-4 mr-2" />
            Qualification
          </TabsTrigger>
          <TabsTrigger value="matching">
            <Target className="w-4 h-4 mr-2" />
            Appariement
          </TabsTrigger>
          <TabsTrigger value="validation">
            <FileCheck className="w-4 h-4 mr-2" />
            Validation
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

        <TabsContent value="qualification">
          <Card>
            <CardHeader>
              <CardTitle>Règles d'entrée - Qualification des prestataires</CardTitle>
              <CardDescription>
                Configuration des critères de qualification pour garantir la qualité et la sécurité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="legal_status_required">Statut légal obligatoire</Label>
                    <p className="text-sm text-muted-foreground">Micro-entrepreneur, société... requis</p>
                  </div>
                  <Switch
                    id="legal_status_required"
                    checked={settings.qualification?.legal_status_required || false}
                    onCheckedChange={(checked) => updateSetting('qualification', 'legal_status_required', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="identity_verification">Vérification d'identité obligatoire</Label>
                    <p className="text-sm text-muted-foreground">Pièce d'identité requise et vérifiée</p>
                  </div>
                  <Switch
                    id="identity_verification"
                    checked={settings.qualification?.identity_verification || false}
                    onCheckedChange={(checked) => updateSetting('qualification', 'identity_verification', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="insurance_required">Assurance obligatoire</Label>
                    <p className="text-sm text-muted-foreground">Assurance responsabilité civile professionnelle</p>
                  </div>
                  <Switch
                    id="insurance_required"
                    checked={settings.qualification?.insurance_required || false}
                    onCheckedChange={(checked) => updateSetting('qualification', 'insurance_required', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="diploma_required_regulated">Diplômes pour métiers réglementés</Label>
                    <p className="text-sm text-muted-foreground">Vérification des qualifications professionnelles</p>
                  </div>
                  <Switch
                    id="diploma_required_regulated"
                    checked={settings.qualification?.diploma_required_regulated || false}
                    onCheckedChange={(checked) => updateSetting('qualification', 'diploma_required_regulated', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="initial_selection_enabled">Sélection initiale</Label>
                    <p className="text-sm text-muted-foreground">Processus de sélection pour garantir la qualité</p>
                  </div>
                  <Switch
                    id="initial_selection_enabled"
                    checked={settings.qualification?.initial_selection_enabled || false}
                    onCheckedChange={(checked) => updateSetting('qualification', 'initial_selection_enabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="background_check_required">Vérification des antécédents</Label>
                    <p className="text-sm text-muted-foreground">Contrôle des antécédents judiciaires</p>
                  </div>
                  <Switch
                    id="background_check_required"
                    checked={settings.qualification?.background_check_required || false}
                    onCheckedChange={(checked) => updateSetting('qualification', 'background_check_required', checked)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minimum_experience_years">Expérience minimum (années)</Label>
                <Input
                  id="minimum_experience_years"
                  type="number"
                  min="0"
                  value={settings.qualification?.minimum_experience_years || 0}
                  onChange={(e) => updateSetting('qualification', 'minimum_experience_years', Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matching">
          <Card>
            <CardHeader>
              <CardTitle>Règles d'appariement - Matching Client ↔ Prestataire</CardTitle>
              <CardDescription>
                Configuration de l'algorithme de matching et des critères d'attribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="geographic_zone_priority">Prioriser la zone géographique</Label>
                    <p className="text-sm text-muted-foreground">Matching basé sur la proximité géographique</p>
                  </div>
                  <Switch
                    id="geographic_zone_priority"
                    checked={settings.matching?.geographic_zone_priority || false}
                    onCheckedChange={(checked) => updateSetting('matching', 'geographic_zone_priority', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="availability_check_enabled">Vérifier les disponibilités</Label>
                    <p className="text-sm text-muted-foreground">Contrôler le planning du prestataire</p>
                  </div>
                  <Switch
                    id="availability_check_enabled"
                    checked={settings.matching?.availability_check_enabled || false}
                    onCheckedChange={(checked) => updateSetting('matching', 'availability_check_enabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="service_type_matching">Correspondance exacte du type de service</Label>
                    <p className="text-sm text-muted-foreground">Type de prestation choisie par le client</p>
                  </div>
                  <Switch
                    id="service_type_matching"
                    checked={settings.matching?.service_type_matching || false}
                    onCheckedChange={(checked) => updateSetting('matching', 'service_type_matching', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="provider_choice_enabled">Liberté de choix du prestataire</Label>
                    <p className="text-sm text-muted-foreground">Le prestataire peut accepter ou refuser</p>
                  </div>
                  <Switch
                    id="provider_choice_enabled"
                    checked={settings.matching?.provider_choice_enabled || false}
                    onCheckedChange={(checked) => updateSetting('matching', 'provider_choice_enabled', checked)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_distance_km">Distance maximum (km)</Label>
                  <Input
                    id="max_distance_km"
                    type="number"
                    min="1"
                    value={settings.matching?.max_distance_km || 25}
                    onChange={(e) => updateSetting('matching', 'max_distance_km', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="response_timeout_hours">Délai de réponse (heures)</Label>
                  <Input
                    id="response_timeout_hours"
                    type="number"
                    min="1"
                    value={settings.matching?.response_timeout_hours || 24}
                    onChange={(e) => updateSetting('matching', 'response_timeout_hours', Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Poids de l'algorithme de matching (%)</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="rating_weight">Poids note</Label>
                    <Input
                      id="rating_weight"
                      type="number"
                      min="0"
                      max="100"
                      value={settings.matching?.rating_weight || 30}
                      onChange={(e) => updateSetting('matching', 'rating_weight', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distance_weight">Poids distance</Label>
                    <Input
                      id="distance_weight"
                      type="number"
                      min="0"
                      max="100"
                      value={settings.matching?.distance_weight || 40}
                      onChange={(e) => updateSetting('matching', 'distance_weight', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availability_weight">Poids disponibilité</Label>
                    <Input
                      id="availability_weight"
                      type="number"
                      min="0"
                      max="100"
                      value={settings.matching?.availability_weight || 30}
                      onChange={(e) => updateSetting('matching', 'availability_weight', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de validation</CardTitle>
              <CardDescription>
                Configuration du processus de validation des candidatures et documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto_validation_enabled">Validation automatique</Label>
                    <p className="text-sm text-muted-foreground">Validation automatique des documents simples</p>
                  </div>
                  <Switch
                    id="auto_validation_enabled"
                    checked={settings.validation?.auto_validation_enabled || false}
                    onCheckedChange={(checked) => updateSetting('validation', 'auto_validation_enabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="manual_review_required">Révision manuelle obligatoire</Label>
                    <p className="text-sm text-muted-foreground">Toutes les candidatures nécessitent une révision</p>
                  </div>
                  <Switch
                    id="manual_review_required"
                    checked={settings.validation?.manual_review_required || false}
                    onCheckedChange={(checked) => updateSetting('validation', 'manual_review_required', checked)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validation_timeout_days">Délai de validation (jours)</Label>
                  <Input
                    id="validation_timeout_days"
                    type="number"
                    min="1"
                    value={settings.validation?.validation_timeout_days || 5}
                    onChange={(e) => updateSetting('validation', 'validation_timeout_days', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rejected_reapplication_days">Délai avant nouvelle candidature (jours)</Label>
                  <Input
                    id="rejected_reapplication_days"
                    type="number"
                    min="1"
                    value={settings.validation?.rejected_reapplication_days || 30}
                    onChange={(e) => updateSetting('validation', 'rejected_reapplication_days', Number(e.target.value))}
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