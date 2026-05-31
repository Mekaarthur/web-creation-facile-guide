import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { SettingsTabProps } from "./types";

export function ClientRulesTab({ settings, updateSetting }: SettingsTabProps) {
  return (
    <TabsContent value="client_rules">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Règles de création et gestion de compte</CardTitle>
            <CardDescription>Configuration des critères d'inscription et de gestion des comptes clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimum_age">Âge minimum requis</Label>
                <Input id="minimum_age" type="number" min="16" max="25"
                  value={settings.client_rules?.minimum_age || 18}
                  onChange={(e) => updateSetting('client_rules', 'minimum_age', Number(e.target.value))} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="cgu_acceptance_required"
                  checked={settings.client_rules?.cgu_acceptance_required || true}
                  onCheckedChange={(checked) => updateSetting('client_rules', 'cgu_acceptance_required', checked)} />
                <Label htmlFor="cgu_acceptance_required">Acceptation CGU obligatoire</Label>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="send_creation_notification"
                checked={settings.client_rules?.send_creation_notification || true}
                onCheckedChange={(checked) => updateSetting('client_rules', 'send_creation_notification', checked)} />
              <Label htmlFor="send_creation_notification">Notification de création de compte</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Règles de réservation</CardTitle>
            <CardDescription>Configuration des critères de réservation des prestations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimum_duration_hours">Durée minimum par service (heures)</Label>
                <Input id="minimum_duration_hours" type="number" min="1" max="8"
                  value={settings.client_rules?.minimum_duration_hours || 2}
                  onChange={(e) => updateSetting('client_rules', 'minimum_duration_hours', Number(e.target.value))} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="platform_only_booking"
                  checked={settings.client_rules?.platform_only_booking || true}
                  onCheckedChange={(checked) => updateSetting('client_rules', 'platform_only_booking', checked)} />
                <Label htmlFor="platform_only_booking">Réservation exclusivement via plateforme</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Règles de paiement</CardTitle>
            <CardDescription>Configuration des modalités de paiement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="preauthorization_at_booking">Préautorisation à la réservation</Label>
                  <p className="text-sm text-muted-foreground">Bloquer le montant au moment de la réservation</p>
                </div>
                <Switch id="preauthorization_at_booking"
                  checked={settings.client_rules?.preauthorization_at_booking || true}
                  onCheckedChange={(checked) => updateSetting('client_rules', 'preauthorization_at_booking', checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="charge_after_completion">Débit après réalisation</Label>
                  <p className="text-sm text-muted-foreground">Effectuer le débit uniquement après la prestation</p>
                </div>
                <Switch id="charge_after_completion"
                  checked={settings.client_rules?.charge_after_completion || true}
                  onCheckedChange={(checked) => updateSetting('client_rules', 'charge_after_completion', checked)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Règles d'annulation et absence</CardTitle>
            <CardDescription>Configuration des frais et délais d'annulation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="free_cancellation_hours">Annulation gratuite (heures avant)</Label>
                <Input id="free_cancellation_hours" type="number" min="1" max="72"
                  value={settings.client_rules?.free_cancellation_hours || 24}
                  onChange={(e) => updateSetting('client_rules', 'free_cancellation_hours', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modification_deadline_hours">Délai modification (heures)</Label>
                <Input id="modification_deadline_hours" type="number" min="1" max="48"
                  value={settings.client_rules?.modification_deadline_hours || 24}
                  onChange={(e) => updateSetting('client_rules', 'modification_deadline_hours', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="no_show_timeout_minutes">Délai d'attente absence (min)</Label>
                <Input id="no_show_timeout_minutes" type="number" min="10" max="60"
                  value={settings.client_rules?.no_show_timeout_minutes || 30}
                  onChange={(e) => updateSetting('client_rules', 'no_show_timeout_minutes', Number(e.target.value))} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="first_booking_exception"
                checked={settings.client_rules?.first_booking_exception || true}
                onCheckedChange={(checked) => updateSetting('client_rules', 'first_booking_exception', checked)} />
              <Label htmlFor="first_booking_exception">Exception commerciale pour premier rendez-vous</Label>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Barème des frais d'annulation :</h4>
              <ul className="text-sm space-y-1">
                <li>• Plus de 24h avant : aucun frais</li>
                <li>• Entre 8h et 24h avant : 5€ forfaitaires</li>
                <li>• Entre 4h et 8h avant : 10€ forfaitaires</li>
                <li>• Entre 2h et 4h avant : 50% du montant (max 15€)</li>
                <li>• Moins de 2h avant : 80% du montant (max 20€)</li>
                <li>• Après l'heure ou absence : 100% du montant (max 40€)</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                * Partage 50/50 entre prestataire et plateforme pour les annulations tardives
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
