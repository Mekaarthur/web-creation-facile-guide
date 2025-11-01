import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  AlertTriangle,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { useBikawoCart } from "@/hooks/useBikawoCart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BookingCheckoutProps {
  onBack: () => void;
}

const BookingCheckout = ({ onBack }: BookingCheckoutProps) => {
  const navigate = useNavigate();
  const { cartItems, separatedBookings, getCartTotal, clearCart, hasIncompatibleServices, getSeparatedBookingsCount } = useBikawoCart();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: ""
  });

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

  const validateForm = () => {
    if (!clientInfo.firstName || !clientInfo.lastName || !clientInfo.email || 
        !clientInfo.phone || !clientInfo.address) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientInfo.email)) {
      toast({
        title: "Email invalide",
        description: "Veuillez saisir une adresse email valide",
        variant: "destructive",
      });
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(clientInfo.phone.replace(/\s/g, ''))) {
      toast({
        title: "Téléphone invalide",
        description: "Veuillez saisir un numéro de téléphone valide (10 chiffres)",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmitBooking = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      // Prepare booking data
      const services = cartItems.map(item => ({
        serviceName: item.serviceName,
        packageTitle: item.packageTitle,
        category: item.serviceCategory,
        price: item.price,
        quantity: item.quantity,
        customBooking: {
          date: item.timeSlot.date.toISOString().split('T')[0],
          startTime: item.timeSlot.startTime,
          endTime: item.timeSlot.endTime,
          hours: item.quantity,
          notes: item.notes
        }
      }));

      // Use the first item's date as preferred date
      const preferredDate = cartItems[0]?.timeSlot.date.toISOString().split('T')[0];
      const preferredTime = cartItems[0]?.timeSlot.startTime;

      // Call edge function to create booking
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: {
          clientInfo,
          services,
          preferredDate,
          preferredTime,
          totalAmount: getCartTotal(),
          notes: cartItems.map(item => item.notes).filter(Boolean).join('; ')
        }
      });

      if (error) throw error;

      // Send confirmation email
      const bookingId = data.bookings?.[0]?.id || `BKW-${Date.now()}`;
      
      await supabase.functions.invoke('send-booking-confirmation', {
        body: {
          to: clientInfo.email,
          clientName: `${clientInfo.firstName} ${clientInfo.lastName}`,
          services: services.map(s => ({
            serviceName: s.serviceName,
            packageTitle: s.packageTitle,
            price: s.price
          })),
          bookingId,
          preferredDate,
          totalAmount: getCartTotal()
        }
      });

      // Clear cart
      clearCart();

      // Show success and redirect
      toast({
        title: "🎉 Réservation confirmée !",
        description: "Un email de confirmation vous a été envoyé",
      });

      // Store reservation in localStorage for confirmation page
      const reservation = {
        id: bookingId,
        clientInfo,
        preferredDate,
        preferredTime,
        services: services.map(s => ({
          serviceName: s.serviceName,
          packageTitle: s.packageTitle,
          price: s.price,
          customBooking: s.customBooking
        })),
        totalEstimated: getCartTotal(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const existingReservations = JSON.parse(localStorage.getItem('bikawo-reservations') || '[]');
      localStorage.setItem('bikawo-reservations', JSON.stringify([...existingReservations, reservation]));

      // Navigate to confirmation page
      setTimeout(() => {
        navigate('/reservation-confirmee', { state: { reservationId: bookingId } });
      }, 1000);

    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de la réservation",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} disabled={isProcessing}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au panier
        </Button>
        <h1 className="text-2xl font-bold">Finalisation de la réservation</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Vos informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={clientInfo.firstName}
                    onChange={(e) => setClientInfo({...clientInfo, firstName: e.target.value})}
                    placeholder="Jean"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={clientInfo.lastName}
                    onChange={(e) => setClientInfo({...clientInfo, lastName: e.target.value})}
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={clientInfo.email}
                  onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                  placeholder="jean.dupont@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Téléphone *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={clientInfo.phone}
                  onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                  placeholder="06 12 34 56 78"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adresse principale *
                </Label>
                <Input
                  id="address"
                  value={clientInfo.address}
                  onChange={(e) => setClientInfo({...clientInfo, address: e.target.value})}
                  placeholder="15 rue de la Paix, 75001 Paris"
                  required
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Récapitulatif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasIncompatibleServices() && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-xs">
                    Services séparés en <strong>{getSeparatedBookingsCount()} réservations</strong>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cartItems.map((item) => {
                  const slot = formatTimeSlot(item.timeSlot);
                  return (
                    <div key={item.id} className="p-3 bg-muted/30 rounded-lg text-sm">
                      <div className="font-medium">{item.serviceName}</div>
                      <div className="text-xs text-muted-foreground">{item.packageTitle}</div>
                      <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {slot.date}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.address}
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <Badge variant="secondary" className="text-xs">
                          {item.price}€ × {item.quantity}
                        </Badge>
                        <span className="font-medium">{item.price * item.quantity}€</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Sous-total</span>
                  <span>{getCartTotal()}€</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span className="text-primary">{getCartTotal()}€</span>
                </div>
              </div>

              <Button 
                onClick={handleSubmitBooking}
                className="w-full"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  `Confirmer la réservation`
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Un conseiller vous contactera sous 24h pour confirmer
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingCheckout;
