import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FormData } from './types';

interface Props {
  formData: FormData;
  onUpdate: (field: keyof FormData, value: any) => void;
}

export function ApplicationExperienceCard({ formData, onUpdate }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expérience et motivation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Années d'expérience</Label>
          <Select
            value={formData.experience_years.toString()}
            onValueChange={(v) => onUpdate('experience_years', parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez votre expérience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Débutant</SelectItem>
              <SelectItem value="1">1 an</SelectItem>
              <SelectItem value="2">2 ans</SelectItem>
              <SelectItem value="3">3-5 ans</SelectItem>
              <SelectItem value="5">5-10 ans</SelectItem>
              <SelectItem value="10">Plus de 10 ans</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="certifications">Certifications / Formations</Label>
          <Textarea
            id="certifications"
            value={formData.certifications}
            onChange={(e) => onUpdate('certifications', e.target.value)}
            placeholder="Listez vos certifications, formations ou qualifications..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="motivation">Lettre de motivation</Label>
          <Textarea
            id="motivation"
            value={formData.motivation}
            onChange={(e) => onUpdate('motivation', e.target.value)}
            placeholder="Expliquez pourquoi vous souhaitez rejoindre notre plateforme..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
