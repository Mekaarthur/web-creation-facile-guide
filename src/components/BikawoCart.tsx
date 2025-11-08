import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ShoppingCart, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  MapPin,
  ArrowRight
} from "lucide-react";
import { useBikawoCart } from "@/hooks/useBikawoCart";
import { useToast } from "@/hooks/use-toast";
import BookingCheckout from "./BookingCheckout";
import { cn } from "@/lib/utils";

interface BikawoCartProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const BikawoCart = ({ isOpen = false, onClose }: BikawoCartProps) => {
  const { 
    cartItems, 
    separatedBookings, 
    removeFromCart, 
    clearCart, 
    getCartTotal, 
    hasIncompatibleServices,
    getSeparatedBookingsCount
  } = useBikawoCart();
  
  const [isPaymentMode, setIsPaymentMode] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  // Animation d'entrée
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const formatTimeSlot = (timeSlot: any) => {
    const date = new Date(timeSlot.date);
    return {
      date: date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: `${timeSlot.startTime} - ${timeSlot.endTime}`
    };
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Panier vide",
        description: "Ajoutez des services avant de procéder au paiement",
        variant: "destructive",
      });
      return;
    }

    setIsPaymentMode(true);
  };

  if (!isOpen && cartItems.length === 0) {
    return null;
  }

  if (isPaymentMode) {
    return <BookingCheckout onBack={() => setIsPaymentMode(false)} />;
  }

  return (
    <Card className={cn(
      "w-full max-w-md mx-auto transition-all duration-300",
      isVisible ? "animate-fade-in" : "opacity-0"
    )}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Panier Session ({cartItems.length})
        </CardTitle>
        {cartItems.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart} className="hover-scale">
            Vider
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Votre panier est vide</p>
            <p className="text-sm text-muted-foreground mt-1">
              Le panier est conservé pendant 30 minutes
            </p>
          </div>
        ) : (
          <>
            {/* Alerte si services incompatibles */}
            {hasIncompatibleServices() && (
              <Alert className="border-orange-200 bg-orange-50 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <AlertDescription className="text-sm">
                  Services incompatibles détectés. Ils seront séparés en <strong>{getSeparatedBookingsCount()} réservations</strong> distinctes.
                </AlertDescription>
              </Alert>
            )}

            {/* Tableau desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 text-sm font-semibold">Service</th>
                    <th className="text-left p-3 text-sm font-semibold">Date & Heure</th>
                    <th className="text-center p-3 text-sm font-semibold">Durée</th>
                    <th className="text-right p-3 text-sm font-semibold">Prix/h</th>
                    <th className="text-right p-3 text-sm font-semibold">Total</th>
                    <th className="text-center p-3 text-sm font-semibold w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => {
                    const slot = formatTimeSlot(item.timeSlot);
                    return (
                      <tr 
                        key={item.id}
                        className="border-b hover:bg-muted/20 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="p-3">
                          <div>
                            <p className="font-semibold text-sm">{item.serviceName}</p>
                            <p className="text-xs text-muted-foreground">{item.packageTitle}</p>
                            {item.address && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {item.address}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <p className="font-medium">{new Date(item.timeSlot.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                            <p className="text-xs text-muted-foreground">{item.timeSlot.startTime} - {item.timeSlot.endTime}</p>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary" className="text-xs">
                            {item.quantity}h
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-medium">
                          {item.price}€/h
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-lg font-bold text-primary">
                            {item.price * item.quantity}€
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => removeFromCart(item.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 hover-scale"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Vue mobile (cartes) */}
            <div className="md:hidden space-y-3 max-h-96 overflow-y-auto">
              {cartItems.map((item, index) => {
                const slot = formatTimeSlot(item.timeSlot);
                return (
                  <div 
                    key={item.id} 
                    className="p-4 bg-muted/50 rounded-lg transition-all duration-200 hover:shadow-md animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1">{item.serviceName}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{item.packageTitle}</p>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                            <div>
                              <p className="font-medium">{new Date(item.timeSlot.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                              <p className="text-xs text-muted-foreground">{item.timeSlot.startTime} - {item.timeSlot.endTime}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-sm">{item.address}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 hover-scale ml-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">
                          {item.quantity}h
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {item.price}€/h
                        </span>
                      </div>
                      <span className="text-xl font-bold text-primary">
                        {item.price * item.quantity}€
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="space-y-3 bg-gradient-subtle p-4 rounded-lg">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Sous-total</span>
                <span>{getCartTotal()}€</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total à payer</span>
                <span className="text-2xl font-bold text-primary">{getCartTotal()}€</span>
              </div>
              {hasIncompatibleServices() && (
                <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                  💳 Un seul paiement pour {getSeparatedBookingsCount()} réservations séparées
                </p>
              )}
            </div>

            <Button 
              onClick={proceedToCheckout} 
              className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200 hover-scale"
              size="lg"
            >
              <span>Procéder au paiement</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BikawoCart;