import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { SettingsTabProps } from "./types";

export function ValidationTab({ settings, updateSetting }: SettingsTabProps) {
  return (
    <TabsContent value="validation">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de validation</CardTitle>
          <CardDescription>Configuration du processus de validation des candidatures et documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto_validation_enabled">Validation automatique</Label>
                <p className="text-sm text-muted-foreground">Validation automatique des documents simples</p>
              </div>
              <Switch id="auto_validation_enabled"
                checked={settings.validation?.auto_validation_enabled || false}
                onCheckedChange={(checked) => updateSetting('validation', 'auto_validation_enabled', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="manual_review_required">Révision manuelle obligatoire</Label>
                <p className="text-sm text-muted-foreground">Toutes les candidatures nécessitent une révision</p>
              </div>
              <Switch id="manual_review_required"
                checked={settings.validation?.manual_review_required || false}
                onCheckedChange={(checked) => updateSetting('validation', 'manual_review_required', checked)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validation_timeout_days">Délai de validation (jours)</Label>
              <Input id="validation_timeout_days" type="number" min="1"
                value={settings.validation?.validation_timeout_days || 5}
                onChange={(e) => updateSetting('validation', 'validation_timeout_days', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejected_reapplication_days">Délai avant nouvelle candidature (jours)</Label>
              <Input id="rejected_reapplication_days" type="number" min="1"
                value={settings.validation?.rejected_reapplication_days || 30}
                onChange={(e) => updateSetting('validation', 'rejected_reapplication_days', Number(e.target.value))} />
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
