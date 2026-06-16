import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, AlertTriangle } from 'lucide-react';

interface CartItem {
  id: string;
  serviceName: string;
  packageTitle: string;
  serviceCategory: string;
  price: number;
  quantity: number;
  address?: string;
  notes?: string;
  timeSlot: { date: Date | string; startTime: string; endTime: string };
  urssaf_eligible?: boolean;
}

interface Props {
  cartItems: CartItem[];
  hasIncompatibleServices: boolean;
  separatedBookingsCount: number;
  cartTotal: number;
  urssafEnabled: boolean;
  showAddress?: boolean;
  maxHeight?: string;
}

const formatTimeSlot = (timeSlot: CartItem['timeSlot']) => {
  const date = new Date(timeSlot.date);
  return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export function CartSummaryItems({ cartItems, hasIncompatibleServices, separatedBookingsCount, cartTotal, urssafEnabled, showAddress = false, maxHeight = 'max-h-60' }: Props) {
  // R-SEL-15: la réduction de 50% ne s'applique qu'aux services éligibles
  const eligibleTotal = cartItems.filter(i => i.urssaf_eligible).reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = urssafEnabled ? eligibleTotal * 0.5 : 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {hasIncompatibleServices && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-xs sm:text-sm">
            Services séparés en <strong>{separatedBookingsCount} réservations</strong>
          </AlertDescription>
        </Alert>
      )}

      <div className={`space-y-2 sm:space-y-3 ${maxHeight} overflow-y-auto`}>
        {cartItems.map((item) => (
          <div key={item.id} className="p-2.5 sm:p-3 bg-muted/30 rounded-lg text-xs sm:text-sm">
            <div className="font-medium text-sm sm:text-base" data-testid="checkout-recap-service">{item.serviceName}</div>
            <div className="text-xs text-muted-foreground">{item.packageTitle}</div>
            <div className="text-xs text-muted-foreground mt-1.5 sm:mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="line-clamp-1">{formatTimeSlot(item.timeSlot)}</span>
            </div>
            {showAddress && item.address && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {item.address}
              </div>
            )}
            <div className="mt-2 flex justify-between items-center gap-2">
              <Badge variant="secondary" className="text-xs">{item.price}€ × {item.quantity}h</Badge>
              <span className="font-medium text-sm sm:text-base whitespace-nowrap" data-testid="checkout-recap-item-total">{item.price * item.quantity}€</span>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span>Sous-total</span>
          <span className="font-medium">{cartTotal}€</span>
        </div>
        {urssafEnabled && discount > 0 && (
          <div className="flex justify-between items-center text-xs text-green-700 dark:text-green-400">
            <span>Crédit d'impôt (-50% sur services éligibles)</span>
            <span>-{discount.toFixed(2)}€</span>
          </div>
        )}
        <div className="flex justify-between items-center text-lg sm:text-xl font-bold border-t pt-2">
          <span>{urssafEnabled ? 'Votre part' : 'Total'}</span>
          <span className="text-primary">{(cartTotal - discount).toFixed(2)}€</span>
        </div>
      </div>
    </div>
  );
}
