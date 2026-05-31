import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Clock } from 'lucide-react';
import type { FormData } from './types';

const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

interface Props {
  formData: FormData;
  onUpdate: (field: keyof FormData, value: any) => void;
}

export function ApplicationAvailabilityCard({ formData, onUpdate }: Props) {
  const toggleDay = (day: string) => {
    const updated = formData.availability_days.includes(day)
      ? formData.availability_days.filter((d) => d !== day)
      : [...formData.availability_days, day];
    onUpdate('availability_days', updated);
  };

  const addTimeSlot = () => {
    onUpdate('availability_time_slots', [
      ...formData.availability_time_slots,
      { day: '', start: '09:00', end: '18:00' },
    ]);
  };

  const updateTimeSlot = (index: number, field: string, value: string) => {
    const updated = formData.availability_time_slots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    onUpdate('availability_time_slots', updated);
  };

  const removeTimeSlot = (index: number) => {
    onUpdate('availability_time_slots', formData.availability_time_slots.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Disponibilités
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Jours disponibles *</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center space-x-2">
                <Checkbox
                  id={day}
                  checked={formData.availability_days.includes(day)}
                  onCheckedChange={() => toggleDay(day)}
                />
                <Label htmlFor={day} className="text-sm capitalize">{day}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="availability_hours">Horaires généraux</Label>
          <Select value={formData.availability_hours} onValueChange={(v) => onUpdate('availability_hours', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez vos horaires" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="09h00 - 18h00">09h00 - 18h00</SelectItem>
              <SelectItem value="08h00 - 17h00">08h00 - 17h00</SelectItem>
              <SelectItem value="10h00 - 19h00">10h00 - 19h00</SelectItem>
              <SelectItem value="Flexible">Flexible</SelectItem>
              <SelectItem value="Uniquement week-end">Uniquement week-end</SelectItem>
              <SelectItem value="Soirées et week-end">Soirées et week-end</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div>
          <Label>Créneaux spécifiques (optionnel)</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Ajoutez des créneaux précis par jour de la semaine
          </p>

          {formData.availability_time_slots.map((slot, index) => (
            <div key={index} className="flex items-center gap-2 mb-2 p-3 border rounded-lg">
              <Select value={slot.day} onValueChange={(v) => updateTimeSlot(index, 'day', v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Jour" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day} className="capitalize">{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={slot.start} onValueChange={(v) => updateTimeSlot(index, 'start', v)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Début" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>

              <span className="text-muted-foreground">à</span>

              <Select value={slot.end} onValueChange={(v) => updateTimeSlot(index, 'end', v)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Fin" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeTimeSlot(index)}
                className="text-red-600 hover:text-red-700"
              >
                Supprimer
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addTimeSlot} className="w-full mt-2">
            + Ajouter un créneau
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
