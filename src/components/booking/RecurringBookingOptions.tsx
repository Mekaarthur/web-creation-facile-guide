import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RepeatIcon, Info } from 'lucide-react';

export interface RecurringOptions {
  enabled: boolean;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek: string;
  endDate: string;
  preferSameProvider: boolean;
}

export const defaultRecurringOptions = (): RecurringOptions => ({
  enabled: false,
  frequency: 'weekly',
  dayOfWeek: 'Lundi',
  endDate: '',
  preferSameProvider: true,
});

interface Props {
  value: RecurringOptions;
  onChange: (opts: RecurringOptions) => void;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const FREQ_LABELS: Record<RecurringOptions['frequency'], string> = {
  weekly:    'Chaque semaine',
  biweekly:  'Toutes les 2 semaines',
  monthly:   '1 fois par mois',
};

export const RecurringBookingOptions = ({ value, onChange }: Props) => {
  const set = (patch: Partial<RecurringOptions>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      {/* Toggle principal */}
      <div className="flex items-center justify-between py-1">
        <Label htmlFor="recurring-toggle" className="flex items-center gap-2 cursor-pointer">
          <RepeatIcon className="w-4 h-4 text-primary" />
          <span>Réservation récurrente</span>
        </Label>
        <Switch
          id="recurring-toggle"
          checked={value.enabled}
          onCheckedChange={v => set({ enabled: v })}
        />
      </div>

      {value.enabled && (
        <div className="pl-4 sm:pl-6 space-y-3 border-l-2 border-primary/20">

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Fréquence</Label>
              <Select
                value={value.frequency}
                onValueChange={v => set({ frequency: v as RecurringOptions['frequency'] })}
              >
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(FREQ_LABELS) as [RecurringOptions['frequency'], string][]).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {value.frequency !== 'monthly' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Jour préféré</Label>
                <Select value={value.dayOfWeek} onValueChange={v => set({ dayOfWeek: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Fin de la récurrence <span className="text-muted-foreground">(optionnel)</span></Label>
            <Input
              type="date"
              value={value.endDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => set({ endDate: e.target.value })}
              className="h-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="same-provider"
              checked={value.preferSameProvider}
              onCheckedChange={v => set({ preferSameProvider: v })}
            />
            <Label htmlFor="same-provider" className="text-sm cursor-pointer">
              Préférer le même prestataire à chaque session
            </Label>
          </div>

          <Alert className="border-blue-200 bg-blue-50 py-2">
            <Info className="h-3.5 w-3.5 text-blue-600" />
            <AlertDescription className="text-blue-800 text-xs">
              Les sessions récurrentes seront confirmées sous 48h. Un email de confirmation sera envoyé pour chaque session planifiée.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default RecurringBookingOptions;
