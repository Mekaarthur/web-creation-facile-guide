import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Info, TrendingUp } from 'lucide-react';

const SERVICES: Record<string, { label: string; clientRate: number; providerRate: number }> = {
  bika_maison:   { label: 'Bika Maison',   clientRate: 25, providerRate: 18 },
  bika_kids:     { label: 'Bika Kids',     clientRate: 25, providerRate: 18 },
  bika_vie:      { label: 'Bika Vie',      clientRate: 25, providerRate: 18 },
  bika_animals:  { label: 'Bika Animals',  clientRate: 25, providerRate: 18 },
  bika_seniors:  { label: 'Bika Seniors',  clientRate: 30, providerRate: 22 },
  bika_travel:   { label: 'Bika Travel',   clientRate: 30, providerRate: 22 },
  bika_pro:      { label: 'Bika Pro',      clientRate: 40, providerRate: 29 },
};

const FREQUENCIES: Record<string, { label: string; sessionsPerMonth: number }> = {
  '1x_semaine':  { label: '1× par semaine',     sessionsPerMonth: 4  },
  '2x_semaine':  { label: '2× par semaine',      sessionsPerMonth: 8  },
  '3x_semaine':  { label: '3× par semaine',      sessionsPerMonth: 12 },
  '1x_quinzaine':{ label: '1× par quinzaine',    sessionsPerMonth: 2  },
  '1x_mois':     { label: '1× par mois',         sessionsPerMonth: 1  },
};

// Taux URSSAF micro-entrepreneur SAP (services à la personne) = 13,3 %
const URSSAF_RATE = 0.133;

export const EarningsSimulator = () => {
  const [serviceKey, setServiceKey] = useState('bika_maison');
  const [hours, setHours] = useState(3);
  const [freqKey, setFreqKey] = useState('1x_semaine');
  const [avanceImmediate, setAvanceImmediate] = useState(false);

  const svc  = SERVICES[serviceKey];
  const freq = FREQUENCIES[freqKey];

  const grossPerSession = svc.providerRate * hours;
  const sessionsPerMonth = freq.sessionsPerMonth;

  const grossPerMonth = grossPerSession * sessionsPerMonth;
  const grossPerYear  = grossPerMonth * 12;

  const urssafPerMonth = Math.round(grossPerMonth * URSSAF_RATE);
  const netPerMonth    = grossPerMonth - urssafPerMonth;
  const netPerYear     = grossPerYear  - urssafPerMonth * 12;

  // Avec avance immédiate : le client ne paie que 50%, URSSAF comble,
  // le revenu brut du prestataire reste le même
  const marginPct = Math.round(((svc.clientRate - svc.providerRate) / svc.clientRate) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Simulateur de revenus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Paramètres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Type de service</Label>
            <Select value={serviceKey} onValueChange={setServiceKey}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SERVICES).map(([k, { label }]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Heures par session</Label>
            <Input
              type="number" min={1} max={12}
              value={hours}
              onChange={e => setHours(Math.max(1, Math.min(12, Number(e.target.value))))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Fréquence</Label>
            <Select value={freqKey} onValueChange={setFreqKey}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(FREQUENCIES).map(([k, { label }]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Avance Immédiate URSSAF</Label>
            <div className="flex items-center gap-3 h-10">
              <Switch
                checked={avanceImmediate}
                onCheckedChange={setAvanceImmediate}
                id="avance-sim"
              />
              <label htmlFor="avance-sim" className="text-sm text-muted-foreground cursor-pointer">
                {avanceImmediate ? 'Activée (client paie 50%)' : 'Non activée'}
              </label>
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Par session</p>
            <p className="text-2xl font-bold text-primary">{grossPerSession}€</p>
            <p className="text-xs text-muted-foreground">brut</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Par mois (net)</p>
            <p className="text-2xl font-bold text-green-700">{netPerMonth}€</p>
            <p className="text-xs text-muted-foreground">{sessionsPerMonth} session{sessionsPerMonth > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Par an (net)</p>
            <p className="text-xl font-bold text-blue-700">{netPerYear.toLocaleString('fr-FR')}€</p>
            <p className="text-xs text-muted-foreground">estimé</p>
          </div>
        </div>

        {/* Détail */}
        <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">Détail mensuel</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tarif prestataire</span>
            <span>{svc.providerRate}€/h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Revenu brut ({sessionsPerMonth} × {hours}h)</span>
            <span className="font-medium">{grossPerMonth}€</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>Cotisations URSSAF (~13,3 %)</span>
            <span>- {urssafPerMonth}€</span>
          </div>
          <div className="flex justify-between font-bold text-green-700 border-t pt-2 mt-1">
            <span>Revenu net estimé</span>
            <span>{netPerMonth}€</span>
          </div>
        </div>

        <Alert className="border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-xs">
            Tarif client : <strong>{svc.clientRate}€/h</strong> · Tarif prestataire : <strong>{svc.providerRate}€/h</strong> · Marge Bikawo : {marginPct}%.
            Cotisations micro-entrepreneur SAP (13,3 %). L'avance immédiate n'affecte pas votre revenu brut.
            Estimation indicative — consultez un expert-comptable pour votre situation personnelle.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default EarningsSimulator;
