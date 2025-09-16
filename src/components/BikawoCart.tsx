import { useState } from "react";
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
  CreditCard,
  Split
} from "lucide-react";
import { useBikawoCart } from "@/hooks/useBikawoCart";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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

  const proceedToPayment = () => {
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

  const handleGroupedPayment = () => {
    // Simulation du paiement groupé
    const totalAmount = getCartTotal();
    const bookingsCount = getSeparatedBookingsCount();

    toast({
      title: "🎉 Paiement validé !",
      description: `Paiement unique de ${totalAmount}€ pour ${bookingsCount} réservation${bookingsCount > 1 ? 's' : ''}.`,
    });

    // Vider le panier après paiement
    clearCart();
    setIsPaymentMode(false);
    if (onClose) onClose();
  };

  if (!isOpen && cartItems.length === 0) {
    return null;
  }

  if (isPaymentMode) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Paiement Groupé Bikawo
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Résumé des réservations séparées */}
          {hasIncompatibleServices() && (
            <Alert className="border-orange-200 bg-orange-50">
              <Split className="w-4 h-4" />
              <AlertDescription>
                Vos services ont été automatiquement séparés en <strong>{getSeparatedBookingsCount()} réservations</strong> en raison d'incompatibilités.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold">Détail des réservations :</h3>
            {separatedBookings.map((booking, index) => (
              <Card key={booking.id} className="p-4 bg-muted/30">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium">Réservation #{index + 1}</h4>
                  <Badge variant="secondary">{booking.totalPrice}€</Badge>
                </div>
                
                {booking.conflictReason && (
                  <Alert className="mb-3 border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription className="text-sm">
                      {booking.conflictReason}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  {booking.items.map((item) => {
                    const slot = formatTimeSlot(item.timeSlot);
                    return (
                      <div key={item.id} className="text-sm">
                        <div className="font-medium">{item.serviceName}</div>
                        <div className="text-muted-foreground flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {slot.date}, {slot.time}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          {item.address}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          <Separator />

          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total à payer :</span>
              <span className="text-primary">{getCartTotal()}€</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Un seul paiement pour toutes vos réservations
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsPaymentMode(false)}
              className="flex-1"
            >
              Retour au panier
            </Button>
            <Button 
              onClick={handleGroupedPayment}
              className="flex-1"
            >
              Payer {getCartTotal()}€
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Panier Session ({cartItems.length})
        </CardTitle>
        {cartItems.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart}>
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
              Panier temporaire - Se vide à la fermeture de l'onglet
            </p>
          </div>
        ) : (
          <>
            {/* Alerte si services incompatibles */}
            {hasIncompatibleServices() && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  Services incompatibles détectés. Ils seront séparés en <strong>{getSeparatedBookingsCount()} réservations</strong>.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {cartItems.map((item) => {
                const slot = formatTimeSlot(item.timeSlot);
                return (
                  <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.serviceName}</h4>
                        <p className="text-xs text-muted-foreground">{item.packageTitle}</p>
                        
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {slot.date}, {slot.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.address}
                          </div>
                          {item.notes && (
                            <p className="italic">{item.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">
                        {item.price}€ × {item.quantity}
                      </Badge>
                      <span className="text-sm font-medium">
                        {item.price * item.quantity}€
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total :</span>
                <span className="font-bold text-primary">{getCartTotal()}€</span>
              </div>
              {hasIncompatibleServices() && (
                <p className="text-xs text-muted-foreground">
                  Un seul paiement pour {getSeparatedBookingsCount()} réservations séparées
                </p>
              )}
            </div>

            <Button 
              onClick={proceedToPayment} 
              className="w-full"
              size="lg"
            >
              Procéder au paiement
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BikawoCart;