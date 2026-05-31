import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

interface Props {
  clientInfo: ClientInfo;
  onChange: (info: ClientInfo) => void;
  isProcessing: boolean;
}

export function CheckoutClientInfoCard({ clientInfo, onChange, isProcessing }: Props) {
  const set = (field: keyof ClientInfo, value: string) => onChange({ ...clientInfo, [field]: value });

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <User className="w-4 h-4 sm:w-5 sm:h-5" />
          Vos informations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom *</Label>
            <Input id="firstName" name="firstName" value={clientInfo.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Jean" required disabled={isProcessing} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom *</Label>
            <Input id="lastName" name="lastName" value={clientInfo.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Dupont" required disabled={isProcessing} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4" />Email *</Label>
          <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" value={clientInfo.email} onChange={(e) => set('email', e.target.value)} placeholder="jean.dupont@example.com" required disabled={isProcessing} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Adresse de prestation *</Label>
          <Input
            id="address" name="address" value={clientInfo.address} onChange={(e) => set('address', e.target.value)}
            placeholder="Ex: 15 rue de la Paix, 75001 Paris" required disabled={isProcessing} autoComplete="street-address"
            className={cn('w-full transition-all', !clientInfo.address && 'border-orange-300 bg-orange-50/50 focus:border-primary')}
          />
          {!clientInfo.address && <p className="text-xs text-orange-600">⚠️ Ce champ est obligatoire pour continuer</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />Téléphone *</Label>
          <Input
            id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel"
            pattern="^(\+?33\s?|0)[1-9](?:[ .-]?\d{2}){4}$"
            value={clientInfo.phone} onChange={(e) => set('phone', e.target.value)}
            placeholder="Ex: 06 12 34 56 78" required disabled={isProcessing}
            className={cn('w-full transition-all', !clientInfo.phone && 'border-orange-300 bg-orange-50/50 focus:border-primary')}
          />
          {!clientInfo.phone && <p className="text-xs text-orange-600">⚠️ Ce champ est obligatoire pour continuer</p>}
        </div>
      </CardContent>
    </Card>
  );
}
