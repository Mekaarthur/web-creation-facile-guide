import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Euro } from 'lucide-react';
import type { FormData } from './types';

const SERVICE_CATEGORIES = [
  'Préparation culinaire / batch cooking',
  "Garde d'enfants",
  'Aide aux seniors',
  'Coiffure',
  'Beauté',
  'Jardinage',
  'Bricolage',
  'Informatique',
  'Cours particuliers',
  'Livraison',
  'Déménagement',
  'Nettoyage auto',
  'Autre',
];

interface Props {
  formData: FormData;
  onUpdate: (field: keyof FormData, value: any) => void;
}

export function ApplicationServicesCard({ formData, onUpdate }: Props) {
  const toggleCategory = (category: string) => {
    const updated = formData.service_categories.includes(category)
      ? formData.service_categories.filter((c) => c !== category)
      : [...formData.service_categories, category];
    onUpdate('service_categories', updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro className="w-5 h-5" />
          Services et tarifs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Catégories de services *</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {SERVICE_CATEGORIES.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={category}
                  checked={formData.service_categories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                />
                <Label htmlFor={category} className="text-sm">{category}</Label>
              </div>
            ))}
          </div>
          {formData.service_categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.service_categories.map((cat) => (
                <Badge key={cat} variant="secondary">{cat}</Badge>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="hourly_rate">Tarif horaire souhaité (€/h)</Label>
          <Input
            id="hourly_rate"
            type="number"
            min="0"
            step="0.50"
            value={formData.hourly_rate}
            onChange={(e) => onUpdate('hourly_rate', parseFloat(e.target.value) || 0)}
          />
        </div>

        <div>
          <Label htmlFor="description">Description de vos services</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onUpdate('description', e.target.value)}
            placeholder="Décrivez votre expérience et vos compétences..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
