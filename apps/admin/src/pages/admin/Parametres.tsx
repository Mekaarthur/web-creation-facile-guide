import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Save,
  Shield,
  CreditCard,
  Users,
  Bell,
  RefreshCw,
  UserCheck,
  Target,
  FileCheck,
  User
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformSettings } from './settings/types';
import { GeneralTab } from './settings/GeneralTab';
import { PaymentsTab } from './settings/PaymentsTab';
import { NotificationsTab } from './settings/NotificationsTab';
import { SecurityTab } from './settings/SecurityTab';
import { BusinessTab } from './settings/BusinessTab';
import { QualificationTab } from './settings/QualificationTab';
import { MatchingTab } from './settings/MatchingTab';
import { ValidationTab } from './settings/ValidationTab';
import { ClientRulesTab } from './settings/ClientRulesTab';

const SETTINGS_KEY = ['platform-settings'] as const;

async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const { data, error } = await supabase.functions.invoke('platform-settings', {
    body: { action: 'get' },
  });
  if (error) throw error;
  if (!data?.success) throw new Error('Failed to load settings');
  return data.settings;
}

const Parametres = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: serverSettings, isLoading } = useQuery<PlatformSettings>({
    queryKey: SETTINGS_KEY,
    queryFn: fetchPlatformSettings,
  });

  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    if (serverSettings) setSettings(serverSettings);
  }, [serverSettings]);

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const { data, error } = await supabase.functions.invoke('platform-settings', {
        body: { action: 'update', settings },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Paramètres sauvegardés", description: `${data.updated_count || data.updatedCount} paramètres mis à jour avec succès.` });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: "Erreur", description: "Impossible de sauvegarder les paramètres", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      const { data, error } = await supabase.functions.invoke('platform-settings', {
        body: { action: 'reset' },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Paramètres réinitialisés", description: "Tous les paramètres ont été remis aux valeurs par défaut." });
        qc.invalidateQueries({ queryKey: SETTINGS_KEY });
      } else {
        throw new Error('Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({ title: "Erreur", description: "Impossible de réinitialiser les paramètres", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category: keyof PlatformSettings, key: string, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [category]: { ...settings[category], [key]: value } });
  };

  if (isLoading || !settings) {
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
              <CardHeader><div className="w-full h-4 bg-muted animate-pulse rounded" /></CardHeader>
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
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Sauvegarde...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Sauvegarder</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Settings className="w-4 h-4 mr-2" />Paramètres Généraux
            </CardTitle>
          </CardHeader>
          <CardContent><Badge variant="outline">5 configurations</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />Paiements
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
              <Bell className="w-4 h-4 mr-2" />Notifications
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
              <Shield className="w-4 h-4 mr-2" />Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={settings.security.two_factor_auth ? "default" : "outline"}>
              2FA {settings.security.two_factor_auth ? "Activé" : "Désactivé"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general"><Settings className="w-4 h-4 mr-2" />Général</TabsTrigger>
          <TabsTrigger value="payments"><CreditCard className="w-4 h-4 mr-2" />Paiements</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" />Notifications</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-4 h-4 mr-2" />Sécurité</TabsTrigger>
          <TabsTrigger value="business"><Users className="w-4 h-4 mr-2" />Business</TabsTrigger>
          <TabsTrigger value="qualification"><UserCheck className="w-4 h-4 mr-2" />Qualification</TabsTrigger>
          <TabsTrigger value="matching"><Target className="w-4 h-4 mr-2" />Appariement</TabsTrigger>
          <TabsTrigger value="validation"><FileCheck className="w-4 h-4 mr-2" />Validation</TabsTrigger>
          <TabsTrigger value="client_rules"><User className="w-4 h-4 mr-2" />Clients</TabsTrigger>
        </TabsList>

        <GeneralTab settings={settings} updateSetting={updateSetting} />
        <PaymentsTab settings={settings} updateSetting={updateSetting} />
        <NotificationsTab settings={settings} updateSetting={updateSetting} />
        <SecurityTab settings={settings} updateSetting={updateSetting} />
        <BusinessTab settings={settings} updateSetting={updateSetting} />
        <QualificationTab settings={settings} updateSetting={updateSetting} />
        <MatchingTab settings={settings} updateSetting={updateSetting} />
        <ValidationTab settings={settings} updateSetting={updateSetting} />
        <ClientRulesTab settings={settings} updateSetting={updateSetting} />
      </Tabs>
    </div>
  );
};

export default Parametres;
