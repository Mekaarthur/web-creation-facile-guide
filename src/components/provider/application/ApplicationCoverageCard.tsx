import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { MapPin } from 'lucide-react';
import type { FormData } from './types';

const INTERVENTION_ZONES = [
  'Paris 1er', 'Paris 2ème', 'Paris 3ème', 'Paris 4ème', 'Paris 5ème',
  'Paris 6ème', 'Paris 7ème', 'Paris 8ème', 'Paris 9ème', 'Paris 10ème',
  'Paris 11ème', 'Paris 12ème', 'Paris 13ème', 'Paris 14ème', 'Paris 15ème',
  'Paris 16ème', 'Paris 17ème', 'Paris 18ème', 'Paris 19ème', 'Paris 20ème',
  'Boulogne-Billancourt', 'Neuilly-sur-Seine', 'Levallois-Perret',
  'Issy-les-Moulineaux', 'Vincennes', 'Saint-Denis', 'Montreuil', 'Créteil',
];

const TRANSPORTATION_MODES = [
  { value: 'walking', label: 'À pied' },
  { value: 'bike', label: 'Vélo' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'car', label: 'Voiture' },
  { value: 'public_transport', label: 'Transport en commun' },
];

interface Props {
  formData: FormData;
  onUpdate: (field: keyof FormData, value: any) => void;
}

export function ApplicationCoverageCard({ formData, onUpdate }: Props) {
  const toggleZone = (zone: string) => {
    const updated = formData.intervention_zones.includes(zone)
      ? formData.intervention_zones.filter((z) => z !== zone)
      : [...formData.intervention_zones, zone];
    onUpdate('intervention_zones', updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Zone de couverture et déplacement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="coverage_address">Adresse de base</Label>
          <Input
            id="coverage_address"
            value={formData.coverage_address}
            onChange={(e) => onUpdate('coverage_address', e.target.value)}
            placeholder="Votre adresse de travail principale"
          />
        </div>

        <div>
          <Label>Rayon d'intervention (km)</Label>
          <Select
            value={formData.coverage_radius.toString()}
            onValueChange={(v) => onUpdate('coverage_radius', parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 20, 30, 50].map((km) => (
                <SelectItem key={km} value={km.toString()}>{km} km</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div>
          <Label>Zone(s) d'intervention *</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Sélectionnez les zones où vous souhaitez intervenir
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
            {INTERVENTION_ZONES.map((zone) => (
              <div key={zone} className="flex items-center space-x-2">
                <Checkbox
                  id={zone}
                  checked={formData.intervention_zones.includes(zone)}
                  onCheckedChange={() => toggleZone(zone)}
                />
                <Label htmlFor={zone} className="text-sm">{zone}</Label>
              </div>
            ))}
          </div>
          {formData.intervention_zones.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.intervention_zones.map((zone) => (
                <Badge key={zone} variant="secondary" className="text-xs">{zone}</Badge>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="other_intervention_zone">Autres zones (champ libre)</Label>
          <Input
            id="other_intervention_zone"
            value={formData.other_intervention_zone}
            onChange={(e) => onUpdate('other_intervention_zone', e.target.value)}
            placeholder="Précisez d'autres zones d'intervention..."
          />
        </div>

        <Separator />

        <div>
          <Label>Mode de déplacement *</Label>
          <Select
            value={formData.transportation_mode}
            onValueChange={(v) => onUpdate('transportation_mode', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez votre mode de déplacement" />
            </SelectTrigger>
            <SelectContent>
              {TRANSPORTATION_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="has_transport"
            checked={formData.has_transport}
            onCheckedChange={(checked) => onUpdate('has_transport', checked)}
          />
          <Label htmlFor="has_transport">Je dispose d'un véhicule personnel</Label>
        </div>
      </CardContent>
    </Card>
  );
}
