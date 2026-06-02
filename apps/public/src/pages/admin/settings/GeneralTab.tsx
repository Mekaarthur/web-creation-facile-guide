import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { SettingsTabProps } from "./types";

export function GeneralTab({ settings, updateSetting }: SettingsTabProps) {
  return (
    <TabsContent value="general">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres Généraux</CardTitle>
          <CardDescription>Configuration de base de votre plateforme</CardDescription>
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
  );
}
