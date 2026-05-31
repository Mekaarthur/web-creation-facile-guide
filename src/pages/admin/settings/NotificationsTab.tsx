import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { SettingsTabProps } from "./types";

export function NotificationsTab({ settings, updateSetting }: SettingsTabProps) {
  return (
    <TabsContent value="notifications">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de Notifications</CardTitle>
          <CardDescription>Configurez les types de notifications envoyées</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {[
              { id: 'email_notifications', label: 'Notifications email', desc: 'Envoyer des emails aux utilisateurs' },
              { id: 'sms_notifications', label: 'Notifications SMS', desc: 'Envoyer des SMS aux utilisateurs' },
              { id: 'push_notifications', label: 'Notifications push', desc: 'Notifications dans le navigateur' },
              { id: 'admin_alerts', label: 'Alertes admin', desc: 'Recevoir les alertes importantes' },
            ].map(({ id, label, desc }) => (
              <div key={id} className="flex items-center justify-between">
                <div>
                  <Label htmlFor={id}>{label}</Label>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  id={id}
                  checked={settings.notifications[id as keyof typeof settings.notifications]}
                  onCheckedChange={(checked) => updateSetting('notifications', id, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
