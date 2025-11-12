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

  // Préremplir avec le profil utilisateur si disponible
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('[CHECKOUT] User profile loaded:', user.user_metadata);
          
          // Récupérer aussi depuis la table profiles si elle existe
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          setClientInfo({
            email: user.email || '',
            firstName: profile?.first_name || user.user_metadata?.first_name || '',
            lastName: profile?.last_name || user.user_metadata?.last_name || '',
            phone: profile?.phone || user.user_metadata?.phone || '',
            address: profile?.address || user.user_metadata?.address || '',
          });
        }
      } catch (error) {
        console.error('[CHECKOUT] Error loading profile:', error);
      }
    })();
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
    // Normaliser et vérifier les champs requis
    const firstName = clientInfo.firstName.trim();
    const lastName = clientInfo.lastName.trim();
    const email = clientInfo.email.trim();
    const address = clientInfo.address.trim();

    // Nettoyage numéro (autoriser espaces, tirets, points, +33)
    const rawPhone = clientInfo.phone;
    const digits = rawPhone.replace(/\D/g, "");
    const isFrWithPrefix = digits.startsWith("33") && digits.length === 11; // +33 puis 9 chiffres
    const isFrTen = digits.length === 10; // 06XXXXXXXX

    const missing: string[] = [];
    if (!firstName) missing.push("Prénom");
    if (!lastName) missing.push("Nom");
    if (!email) missing.push("Email");
    if (!rawPhone) missing.push("Téléphone");
    if (!address) missing.push("Adresse");

    if (missing.length > 0) {
      console.log("[CHECKOUT] Champs manquants:", { clientInfo });
      toast({
        title: "Formulaire incomplet",
        description: `Veuillez renseigner: ${missing.join(", ")}`,
        variant: "destructive",
      });
      // Focus sur le premier champ manquant
      const firstMissingId = [
        { id: "firstName", ok: !!firstName },
        { id: "lastName", ok: !!lastName },
        { id: "email", ok: !!email },
        { id: "phone", ok: !!rawPhone },
        { id: "address", ok: !!address },
      ].find((f) => !f.ok)?.id;
      if (firstMissingId) {
        document.getElementById(firstMissingId)?.scrollIntoView({ behavior: "smooth", block: "center" });
        (document.getElementById(firstMissingId) as HTMLInputElement | null)?.focus();
      }
      return false;
    }

    // Validation email (simple)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Email invalide",
        description: "Veuillez saisir une adresse email valide",
        variant: "destructive",
      });
      document.getElementById("email")?.scrollIntoView({ behavior: "smooth", block: "center" });
      (document.getElementById("email") as HTMLInputElement | null)?.focus();
      return false;
    }

    // Validation téléphone FR (10 chiffres, ou +33 puis 9 chiffres)
    if (!(isFrTen || isFrWithPrefix)) {
      toast({
        title: "Téléphone invalide",
        description: "Format accepté: 06XXXXXXXX ou +33 X XX XX XX XX",
        variant: "destructive",
      });
      document.getElementById("phone")?.scrollIntoView({ behavior: "smooth", block: "center" });
      (document.getElementById("phone") as HTMLInputElement | null)?.focus();
      return false;
    }

    // Validation des dates (toutes doivent être dans le futur)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const invalidDates = cartItems.filter((item) => {
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
    const invalidDurations = cartItems.filter((item) => item.quantity <= 0);
    if (invalidDurations.length > 0) {
      toast({
        title: "Durées invalides",
        description: "Toutes les durées doivent être supérieures à 0 heure",
        variant: "destructive",
      });
      return false;
    }

    console.log("[CHECKOUT] Validation OK", { clientInfo, phoneDigits: digits });
    return true;
  };

  const handleSubmitBooking = async () => {
    console.log('[CHECKOUT] Submit clicked with clientInfo:', clientInfo);
    console.log('[CHECKOUT] Form validation starting...');
    
    if (!validateForm()) {
      console.log('[CHECKOUT] Validation failed, stopping submission');
      return;
    }
    
    console.log('[CHECKOUT] Validation passed, proceeding with payment...');

    setIsProcessing(true);

    let checkoutWindow: Window | null = null;
    try {
      // Ouvre un onglet vide immédiatement (évite les bloqueurs de pop-up)
      checkoutWindow = window.open('', '_blank');

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

      console.log('[CHECKOUT] create-payment response', { paymentData, paymentError });

      if (paymentError) {
        console.error('[CHECKOUT] Payment error:', paymentError);
        throw paymentError;
      }

      if (!paymentData?.url) {
        console.error('[CHECKOUT] No URL in response:', paymentData);
        throw new Error('URL de paiement non reçue');
      }

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

      // Redirect to Stripe checkout with robust fallbacks (iframe-safe)
      const go = (u: string) => {
        try {
          // Utilise l'onglet pré-ouvert si disponible (évite bloqueurs)
          // @ts-ignore
          if (checkoutWindow && !checkoutWindow.closed) {
            // @ts-ignore
            checkoutWindow.location.href = u;
            return;
          }
        } catch (e) {
          console.warn('[CHECKOUT] checkoutWindow navigation failed', e);
        }
        try {
          console.log('[CHECKOUT] Redirect via window.location.assign');
          window.location.assign(u);
          return;
        } catch (e) {
          console.warn('[CHECKOUT] assign failed', e);
        }
        try {
          if (window.top) {
            console.log('[CHECKOUT] Redirect via window.top.location');
            // @ts-ignore
            window.top.location.href = u;
            return;
          }
        } catch (e) {
          console.warn('[CHECKOUT] top.navigation failed', e);
        }
        console.log('[CHECKOUT] Redirect via anchor _blank fallback');
        const a = document.createElement('a');
        a.href = u;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        a.remove();
      };

      console.log('[CHECKOUT] Redirecting to:', paymentData.url);
      go(paymentData.url);

    } catch (error: any) {
      console.error('Error creating payment:', error);
      try { if (checkoutWindow && !checkoutWindow.closed) checkoutWindow.close(); } catch {}
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
      "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-40 sm:pb-32 pb-bottom-bar space-y-4 sm:space-y-6 transition-opacity duration-500 min-h-[100svh]",
      isVisible ? "opacity-100" : "opacity-0"
    )}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 animate-fade-in">
        <Button variant="ghost" onClick={onBack} disabled={isProcessing} className="hover-scale w-full sm:w-auto">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au panier
        </Button>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Finalisation de la réservation</h1>
      </div>

      {/* Récapitulatif mobile - En haut */}
      <div className="lg:hidden animate-fade-in">
        <Card className="border-primary/20 shadow-soft transition-all duration-200">
          <CardHeader className="bg-gradient-subtle p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              Récapitulatif de commande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            {hasIncompatibleServices() && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-xs sm:text-sm">
                  Services séparés en <strong>{getSeparatedBookingsCount()} réservations</strong>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
              {cartItems.map((item) => {
                const slot = formatTimeSlot(item.timeSlot);
                return (
                  <div key={item.id} className="p-2.5 sm:p-3 bg-muted/30 rounded-lg text-xs sm:text-sm">
                    <div className="font-medium text-sm sm:text-base">{item.serviceName}</div>
                    <div className="text-xs text-muted-foreground">{item.packageTitle}</div>
                    <div className="text-xs text-muted-foreground mt-1.5 sm:mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="line-clamp-1">{slot.date}</span>
                    </div>
                    <div className="mt-2 flex justify-between items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.price}€ × {item.quantity}h
                      </Badge>
                      <span className="font-medium text-sm sm:text-base whitespace-nowrap">{item.price * item.quantity}€</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span>Sous-total</span>
                <span className="font-medium">{getCartTotal()}€</span>
              </div>
              
              {/* Avance immédiate désactivée temporairement */}
              
              <div className="flex justify-between items-center text-lg sm:text-xl font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-primary">{getCartTotal()}€</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Client Information */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
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
                  inputMode="email"
                  autoComplete="email"
                  value={clientInfo.email}
                  onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                  placeholder="jean.dupont@example.com"
                  required
                  className="w-full"
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Adresse de prestation *
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={clientInfo.address}
                  onChange={(e) => {
                    setClientInfo({...clientInfo, address: e.target.value});
                    console.log('[CHECKOUT] Address changed:', e.target.value);
                  }}
                  placeholder="Ex: 15 rue de la Paix, 75001 Paris"
                  required
                  className={cn(
                    "w-full transition-all",
                    !clientInfo.address && "border-orange-300 bg-orange-50/50 focus:border-primary"
                  )}
                  disabled={isProcessing}
                  autoComplete="street-address"
                />
                {!clientInfo.address && (
                  <p className="text-xs text-orange-600">
                    ⚠️ Ce champ est obligatoire pour continuer
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  Téléphone *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  pattern="^(\+?33\s?|0)[1-9](?:[ .-]?\d{2}){4}$"
                  value={clientInfo.phone}
                  onChange={(e) => {
                    setClientInfo({...clientInfo, phone: e.target.value});
                    console.log('[CHECKOUT] Phone changed:', e.target.value);
                  }}
                  placeholder="Ex: 06 12 34 56 78"
                  required
                  className={cn(
                    "w-full transition-all",
                    !clientInfo.phone && "border-orange-300 bg-orange-50/50 focus:border-primary"
                  )}
                  disabled={isProcessing}
                  autoComplete="tel"
                />
                {!clientInfo.phone && (
                  <p className="text-xs text-orange-600">
                    ⚠️ Ce champ est obligatoire pour continuer
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Avance immédiate URSSAF — retirée temporairement */}
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
                
                {/* Avance immédiate désactivée temporairement */}
                
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span>Montant à payer</span>
                  <span className="text-primary">{getCartTotal()}€</span>
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
                    Confirmer et payer {getCartTotal()}€
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
      <div className="lg:hidden sticky bottom-0 left-0 right-0 p-3 bg-background/98 backdrop-blur-md border-t shadow-elegant z-50 safe-area-bottom">
        <div className="max-w-lg mx-auto space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Total à payer</span>
            <div className="text-right">
              <div className="font-bold text-primary text-lg">
                {getCartTotal()}€
              </div>
            </div>
          </div>
          <Button 
            onClick={handleSubmitBooking}
            className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200"
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
                Confirmer {getCartTotal()}€
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            🔒 Paiement sécurisé via Stripe
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingCheckout;
