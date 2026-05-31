import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { SettingsTabProps } from "./types";

export function BusinessTab({ settings, updateSetting }: SettingsTabProps) {
  return (
    <TabsContent value="business">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres Business</CardTitle>
          <CardDescription>Configuration des règles métier</CardDescription>
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
  );
}
