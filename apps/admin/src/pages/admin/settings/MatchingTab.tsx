import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { SettingsTabProps } from "./types";

export function MatchingTab({ settings, updateSetting }: SettingsTabProps) {
  return (
    <TabsContent value="matching">
      <Card>
        <CardHeader>
          <CardTitle>Règles d'appariement - Matching Client ↔ Prestataire</CardTitle>
          <CardDescription>Configuration de l'algorithme de matching et des critères d'attribution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {[
              { id: 'geographic_zone_priority', label: 'Prioriser la zone géographique', desc: 'Matching basé sur la proximité géographique' },
              { id: 'availability_check_enabled', label: 'Vérifier les disponibilités', desc: 'Contrôler le planning du prestataire' },
              { id: 'service_type_matching', label: 'Correspondance exacte du type de service', desc: 'Type de prestation choisie par le client' },
              { id: 'provider_choice_enabled', label: 'Liberté de choix du prestataire', desc: 'Le prestataire peut accepter ou refuser' },
            ].map(({ id, label, desc }) => (
              <div key={id} className="flex items-center justify-between">
                <div>
                  <Label htmlFor={id}>{label}</Label>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  id={id}
                  checked={settings.matching?.[id as keyof typeof settings.matching] as boolean || false}
                  onCheckedChange={(checked) => updateSetting('matching', id, checked)}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_distance_km">Distance maximum (km)</Label>
              <Input id="max_distance_km" type="number" min="1"
                value={settings.matching?.max_distance_km || 25}
                onChange={(e) => updateSetting('matching', 'max_distance_km', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="response_timeout_hours">Délai de réponse (heures)</Label>
              <Input id="response_timeout_hours" type="number" min="1"
                value={settings.matching?.response_timeout_hours || 24}
                onChange={(e) => updateSetting('matching', 'response_timeout_hours', Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Poids de l'algorithme de matching (%)</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {[
                { id: 'rating_weight', label: 'Poids note', def: 30 },
                { id: 'distance_weight', label: 'Poids distance', def: 40 },
                { id: 'availability_weight', label: 'Poids disponibilité', def: 30 },
              ].map(({ id, label, def }) => (
                <div key={id} className="space-y-2">
                  <Label htmlFor={id}>{label}</Label>
                  <Input id={id} type="number" min="0" max="100"
                    value={settings.matching?.[id as keyof typeof settings.matching] as number || def}
                    onChange={(e) => updateSetting('matching', id, Number(e.target.value))} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
