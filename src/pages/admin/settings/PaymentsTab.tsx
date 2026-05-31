import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { SettingsTabProps } from "./types";

export function PaymentsTab({ settings, updateSetting }: SettingsTabProps) {
  return (
    <TabsContent value="payments">
      <Card>
        <CardHeader>
          <CardTitle>Configuration des Paiements</CardTitle>
          <CardDescription>Gérez les paramètres de paiement et commissions</CardDescription>
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
  );
}
