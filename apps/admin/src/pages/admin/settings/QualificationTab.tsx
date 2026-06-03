import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { SettingsTabProps } from "./types";

export function QualificationTab({ settings, updateSetting }: SettingsTabProps) {
  const toggles = [
    { id: 'legal_status_required', label: 'Statut légal obligatoire', desc: 'Micro-entrepreneur, société... requis' },
    { id: 'identity_verification', label: "Vérification d'identité obligatoire", desc: "Pièce d'identité requise et vérifiée" },
    { id: 'insurance_required', label: 'Assurance obligatoire', desc: 'Assurance responsabilité civile professionnelle' },
    { id: 'diploma_required_regulated', label: 'Diplômes pour métiers réglementés', desc: 'Vérification des qualifications professionnelles' },
    { id: 'initial_selection_enabled', label: 'Sélection initiale', desc: 'Processus de sélection pour garantir la qualité' },
    { id: 'background_check_required', label: 'Vérification des antécédents', desc: 'Contrôle des antécédents judiciaires' },
  ] as const;

  return (
    <TabsContent value="qualification">
      <Card>
        <CardHeader>
          <CardTitle>Règles d'entrée - Qualification des prestataires</CardTitle>
          <CardDescription>Configuration des critères de qualification pour garantir la qualité et la sécurité</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {toggles.map(({ id, label, desc }) => (
              <div key={id} className="flex items-center justify-between">
                <div>
                  <Label htmlFor={id}>{label}</Label>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  id={id}
                  checked={settings.qualification?.[id] || false}
                  onCheckedChange={(checked) => updateSetting('qualification', id, checked)}
                />
              </div>
            ))}
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
  );
}
