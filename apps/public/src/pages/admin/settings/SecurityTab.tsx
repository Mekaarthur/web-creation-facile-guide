import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { SettingsTabProps } from "./types";

export function SecurityTab({ settings, updateSetting }: SettingsTabProps) {
  return (
    <TabsContent value="security">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de Sécurité</CardTitle>
          <CardDescription>Configurez la sécurité de votre plateforme</CardDescription>
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
  );
}
