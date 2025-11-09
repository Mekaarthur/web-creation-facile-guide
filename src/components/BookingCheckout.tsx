import { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";

interface BookingCheckoutProps {
  onBack: () => void;
}

const BookingCheckout = ({ onBack }: BookingCheckoutProps) => {
  const navigate = useNavigate();
  const { cartItems, separatedBookings, getCartTotal, clearCart, hasIncompatibleServices, getSeparatedBookingsCount } = useBikawoCart();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [urssafEnabled, setUrssafEnabled] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: ""
  });

  // Animation d'entrée + scroll en haut
  useEffect(() => {
    setIsVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
    // Validation des champs requis
    if (!clientInfo.firstName || !clientInfo.lastName || !clientInfo.email || 
        !clientInfo.phone || !clientInfo.address) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
      return false;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientInfo.email)) {
      toast({
        title: "Email invalide",
        description: "Veuillez saisir une adresse email valide",
        variant: "destructive",
      });
      return false;
    }

    // Validation téléphone
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(clientInfo.phone.replace(/\s/g, ''))) {
      toast({
        title: "Téléphone invalide",
        description: "Veuillez saisir un numéro de téléphone valide (10 chiffres)",
        variant: "destructive",
      });
      return false;
    }

    // Validation des dates (toutes doivent être dans le futur)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const invalidDates = cartItems.filter(item => {
      const itemDate = new Date(item.timeSlot.date);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate < today;
    });

    if (invalidDates.length > 0) {
      toast({
        title: "Dates invalides",
        description: "Toutes les dates de réservation doivent être dans le futur",
        variant: "destructive",
      });
      return false;
    }

    // Validation des durées (toutes > 0)
    const invalidDurations = cartItems.filter(item => item.quantity <= 0);
    if (invalidDurations.length > 0) {
      toast({
        title: "Durées invalides",
        description: "Toutes les durées doivent être supérieures à 0 heure",
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
          date: new Date(item.timeSlot.date).toISOString().split('T')[0],
          startTime: item.timeSlot.startTime,
          endTime: item.timeSlot.endTime,
          hours: item.quantity,
          notes: item.notes
        }
      }));

      const preferredDate = cartItems[0]?.timeSlot?.date ? new Date(cartItems[0].timeSlot.date).toISOString().split('T')[0] : undefined;
      const preferredTime = cartItems[0]?.timeSlot?.startTime;
      const totalAmount = getCartTotal();
      
      // Calculate amounts based on URSSAF immediate advance
      const clientAmount = urssafEnabled ? totalAmount * 0.5 : totalAmount;
      const stateAmount = urssafEnabled ? totalAmount * 0.5 : 0;

      // If URSSAF enabled, register with URSSAF first
      if (urssafEnabled) {
        const { data: urssafData, error: urssafError } = await supabase.functions.invoke('urssaf-register-service', {
          body: {
            clientInfo,
            services,
            totalAmount,
            clientAmount,
            stateAmount,
            preferredDate,
            preferredTime
          }
        });

        if (urssafError) {
          throw new Error(`Erreur URSSAF : ${urssafError.message}`);
        }

        console.log('URSSAF registration:', urssafData);
      }

      // Create Stripe payment session (only for client amount)
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: clientAmount,
          description: `Réservation Bikawo - ${services.length} service(s)${urssafEnabled ? ' (Avance immédiate 50%)' : ''}`,
          serviceName: services.map(s => s.serviceName).join(', '),
          guestEmail: clientInfo.email,
          metadata: {
            clientInfo: JSON.stringify(clientInfo),
            services: JSON.stringify(services),
            preferredDate,
            preferredTime,
            notes: cartItems.map(item => item.notes).filter(Boolean).join('; '),
            urssafEnabled: urssafEnabled.toString(),
            totalAmount: totalAmount.toString(),
            clientAmount: clientAmount.toString(),
            stateAmount: stateAmount.toString()
          }
        }
      });

      if (paymentError) throw paymentError;

      // Store pending booking in localStorage for recovery after payment
      const pendingBooking = {
        clientInfo,
        services,
        preferredDate,
        preferredTime,
        totalAmount,
        notes: cartItems.map(item => item.notes).filter(Boolean).join('; ')
      };
      localStorage.setItem('bikawo-pending-booking', JSON.stringify(pendingBooking));

      // Redirect to Stripe checkout
      if (paymentData?.url) {
        window.location.href = paymentData.url;
      } else {
        throw new Error('URL de paiement non reçue');
      }

    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du paiement",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className={cn(
      "max-w-5xl mx-auto px-4 py-8 pb-32 space-y-6 transition-opacity duration-500 min-h-screen",
      isVisible ? "opacity-100" : "opacity-0"
    )}>
      <div className="flex items-center gap-4 mb-6 animate-fade-in">
        <Button variant="ghost" onClick={onBack} disabled={isProcessing} className="hover-scale">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au panier
        </Button>
        <h1 className="text-2xl font-bold">Finalisation de la réservation</h1>
      </div>

      {/* Récapitulatif mobile - En haut */}
      <div className="lg:hidden animate-fade-in">
        <Card className="border-primary/20 shadow-elegant transition-all duration-200 hover:shadow-lg">
          <CardHeader className="bg-gradient-subtle">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5" />
              Récapitulatif de commande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {hasIncompatibleServices() && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  Services séparés en <strong>{getSeparatedBookingsCount()} réservations</strong>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3 max-h-60 overflow-y-auto">
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
                    <div className="mt-2 flex justify-between items-center">
                      <Badge variant="secondary" className="text-xs">
                        {item.price}€ × {item.quantity}h
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
              <div className="flex justify-between items-center text-xl font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-primary">{getCartTotal()}€</span>
              </div>
            </div>

            {/* CTA mobile (fallback si la barre fixe est masquée) */}
            <div className="mt-4 lg:hidden">
              <Button 
                onClick={handleSubmitBooking}
                className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200 hover-scale"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Confirmer et payer {urssafEnabled ? (getCartTotal() * 0.5).toFixed(2) : getCartTotal()}€
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Paiement sécurisé via Stripe
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Information */}
        <div className="lg:col-span-2 space-y-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
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
                    name="firstName"
                    value={clientInfo.firstName}
                    onChange={(e) => setClientInfo({...clientInfo, firstName: e.target.value})}
                    placeholder="Jean"
                    required
                    className="w-full"
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={clientInfo.lastName}
                    onChange={(e) => setClientInfo({...clientInfo, lastName: e.target.value})}
                    placeholder="Dupont"
                    required
                    className="w-full"
                    disabled={isProcessing}
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
                  name="email"
                  type="email"
                  value={clientInfo.email}
                  onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                  placeholder="jean.dupont@example.com"
                  required
                  className="w-full"
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Téléphone *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={clientInfo.phone}
                  onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                  placeholder="06 12 34 56 78"
                  required
                  className="w-full"
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adresse principale *
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={clientInfo.address}
                  onChange={(e) => setClientInfo({...clientInfo, address: e.target.value})}
                  placeholder="15 rue de la Paix, 75001 Paris"
                  required
                  className="w-full"
                  disabled={isProcessing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Avance immédiate URSSAF */}
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-green-600" />
                Avance immédiate du crédit d'impôt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <p className="text-sm text-muted-foreground mb-3">
                  En tant que particulier employeur, bénéficiez de <strong>50% de réduction immédiate</strong> grâce au dispositif URSSAF d'avance immédiate du crédit d'impôt.
                </p>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="urssaf-consent"
                    checked={urssafEnabled}
                    onChange={(e) => setUrssafEnabled(e.target.checked)}
                    disabled={isProcessing}
                    className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                  />
                  <Label htmlFor="urssaf-consent" className="text-sm cursor-pointer leading-relaxed">
                    J'autorise Bikawo à activer le service <strong>Avance Immédiate de l'URSSAF</strong> pour mes prestations et à déclarer ces services auprès de l'URSSAF. Je bénéficierai ainsi de 50% de réduction immédiate sur le montant total.
                  </Label>
                </div>
              </div>
              
              {urssafEnabled && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-sm">
                    ✅ Vous ne paierez que <strong>{(getCartTotal() * 0.5).toFixed(2)}€</strong> au lieu de {getCartTotal()}€. L'État prendra en charge les {(getCartTotal() * 0.5).toFixed(2)}€ restants.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary - Desktop uniquement */}
        <div className="hidden lg:block space-y-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <Card className="sticky top-24 transition-all duration-200 hover:shadow-md">
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
                
                {urssafEnabled && (
                  <>
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span>Avance immédiate (-50%)</span>
                      <span>-{(getCartTotal() * 0.5).toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Pris en charge par l'État</span>
                      <span>{(getCartTotal() * 0.5).toFixed(2)}€</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span>Montant à payer</span>
                  <span className="text-primary">
                    {urssafEnabled ? (getCartTotal() * 0.5).toFixed(2) : getCartTotal()}€
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleSubmitBooking}
                className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200 hover-scale"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Confirmer et payer {urssafEnabled ? (getCartTotal() * 0.5).toFixed(2) : getCartTotal()}€
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Paiement sécurisé via Stripe • Un conseiller vous contactera sous 24h
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bouton fixe mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t shadow-elegant z-50 animate-slide-in-bottom">
        <div className="mb-2 text-center text-sm font-semibold">
          {urssafEnabled ? (
            <>
              Total: <span className="text-muted-foreground line-through text-sm">{getCartTotal()}€</span>
              {' '}
              <span className="text-primary text-lg">{(getCartTotal() * 0.5).toFixed(2)}€</span>
              <span className="text-xs text-green-600 block">(-50% avance immédiate)</span>
            </>
          ) : (
            <>Total: <span className="text-primary text-lg">{getCartTotal()}€</span></>
          )}
        </div>
        <Button 
          onClick={handleSubmitBooking}
          className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200 hover-scale"
          size="lg"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Confirmer et payer {urssafEnabled ? (getCartTotal() * 0.5).toFixed(2) : getCartTotal()}€
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Paiement sécurisé via Stripe
        </p>
      </div>
    </div>
  );
};

export default BookingCheckout;
