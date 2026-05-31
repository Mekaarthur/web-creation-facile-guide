import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase } from 'lucide-react';

interface Props {
  description: string;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function ProfilePresentationStep({ description, errors, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Briefcase className="h-5 w-5" />
          <span>Présentation</span>
        </CardTitle>
        <CardDescription>Présentez votre expertise et vos compétences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="description">Présentation et compétences *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Présentez-vous et décrivez vos compétences, votre expérience et vos spécialités..."
            rows={6}
            className="resize-none"
            maxLength={1000}
            required
          />
          {errors.description && (
            <p className="text-sm text-destructive font-medium">{errors.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {description.length}/1000 caractères - Cette description sera visible par les clients.
          </p>
          {description.length < 10 && (
            <p className="text-sm text-amber-600 dark:text-amber-500">
              ⚠️ Minimum 10 caractères requis pour la description
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
