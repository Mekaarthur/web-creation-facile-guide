import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ArrowLeft, Loader2, UserPlus, UserCheck, Star, ShieldCheck } from "lucide-react";
import { useBikawoCart } from "@/hooks/useBikawoCart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { profileService } from "@/services/profileService";
import { bookingService } from "@/services/bookingService";
import { getBookingValidation, NIGHT_SERVICE_SLUGS } from "@/utils/workingHours";
import { cn } from "@/lib/utils";
import { CheckoutClientInfoCard, type ClientInfo } from "@/components/checkout/CheckoutClientInfoCard";
import { UrssafSection } from "@/components/checkout/UrssafSection";
import { CartSummaryItems } from "@/components/checkout/CartSummaryItems";

interface BookingCheckoutProps {
  onBack: () => void;
}

const BookingCheckout = ({ onBack }: BookingCheckoutProps) => {
  const { cartItems, getCartTotal, hasIncompatibleServices, getSeparatedBookingsCount } = useBikawoCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showUrssafDialog, setShowUrssafDialog] = useState(false);
  const [urssafEnabled, setUrssafEnabled] = useState(false);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({ firstName: '', lastName: '', email: '', phone: '', address: '' });
  // R-SEL-10: choix auth pour utilisateurs non-connectés ('pending' → choix affiché, 'guest' → continue sans compte)
  const [authChoice, setAuthChoice] = useState<'pending' | 'guest' | null>(null);

  useEffect(() => {
    setIsVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // R-SEL-11: pré-remplissage depuis profil si connecté
          const profile = await profileService.getProfile(user.id);
          setClientInfo({
            email: user.email || '',
            firstName: profile?.first_name || user.user_metadata?.first_name || '',
            lastName: profile?.last_name || user.user_metadata?.last_name || '',
            phone: profile?.phone || user.user_metadata?.phone || '',
            address: profile?.address || user.user_metadata?.address || '',
          });
          setAuthChoice(null); // connecté → pas de choix à afficher

        } else {
          setAuthChoice('pending'); // non-connecté → afficher le choix R-SEL-10
        }
      } catch (error) {
        console.error('[CHECKOUT] Error loading profile:', error);
        setAuthChoice('pending');
      }
    })();
  }, []);

  const validateForm = () => {
    const { firstName, lastName, email, phone, address } = clientInfo;
    const digits = phone.replace(/\D/g, '');
    const isFrWithPrefix = digits.startsWith('33') && digits.length === 11;
    const isFrTen = digits.length === 10;

    const missing: string[] = [];
    if (!firstName.trim()) missing.push('Prénom');
    if (!lastName.trim()) missing.push('Nom');
    if (!email.trim()) missing.push('Email');
    if (!phone) missing.push('Téléphone');
    if (!address.trim()) missing.push('Adresse');

    if (missing.length > 0) {
      toast({ title: 'Formulaire incomplet', description: `Veuillez renseigner: ${missing.join(', ')}`, variant: 'destructive' });
      const firstId = [['firstName', firstName.trim()], ['lastName', lastName.trim()], ['email', email.trim()], ['phone', phone], ['address', address.trim()]].find(([, v]) => !v)?.[0];
      if (firstId) {
        const el = document.getElementById(firstId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (el as HTMLInputElement | null)?.focus();
      }
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast({ title: 'Email invalide', description: 'Veuillez saisir une adresse email valide', variant: 'destructive' });
      return false;
    }
    if (!(isFrTen || isFrWithPrefix)) {
      toast({ title: 'Téléphone invalide', description: 'Format accepté: 06XXXXXXXX ou +33 X XX XX XX XX', variant: 'destructive' });
      return false;
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (cartItems.some(item => { const d = new Date(item.timeSlot.date); d.setHours(0, 0, 0, 0); return d < today; })) {
      toast({ title: 'Dates invalides', description: 'Toutes les dates de réservation doivent être dans le futur', variant: 'destructive' });
      return false;
    }
    if (cartItems.some(item => item.quantity <= 0)) {
      toast({ title: 'Durées invalides', description: 'Toutes les durées doivent être supérieures à 0 heure', variant: 'destructive' });
      return false;
    }
    return true;
  };

  // R-SEL-12: vérifications avant création de la session Stripe
  const runPreflightChecks = async (): Promise<string | null> => {
    const cartTimestamp = localStorage.getItem('bikawo-cart-timestamp');
    if (cartTimestamp && Date.now() - parseInt(cartTimestamp, 10) > 30 * 60 * 1000) {
      return "Votre panier a expiré (plus de 30 minutes). Veuillez recommencer votre sélection.";
    }

    if (!getCartTotal() || getCartTotal() <= 0) {
      return "Le montant de la réservation doit être supérieur à 0€.";
    }

    // R-SEL-06 final: délai minimum de 5h ouvrées (8h-20h, 7j/7) — exempté pour les services nuit/urgence
    for (const item of cartItems) {
      const isNightService = !!item.slug && NIGHT_SERVICE_SLUGS.includes(item.slug);
      if (!isNightService) {
        const validation = getBookingValidation(new Date(item.timeSlot.date), item.timeSlot.startTime);
        if (!validation.isValid) {
          return validation.errorMessage || `Ce créneau n'est plus disponible pour "${item.serviceName}".`;
        }
      }
      if (!item.address?.trim()) {
        return `Adresse manquante pour "${item.serviceName}".`;
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    for (const item of cartItems) {
      try {
        const conflict = await bookingService.hasConflictingBooking({
          userId: user?.id,
          email: !user?.id ? clientInfo.email : undefined,
          bookingDate: new Date(item.timeSlot.date).toISOString().split('T')[0],
          startTime: item.timeSlot.startTime,
          endTime: item.timeSlot.endTime,
        });
        if (conflict) {
          return `Vous avez déjà une réservation sur ce créneau pour "${item.serviceName}". Modifiez la date ou l'heure.`;
        }
      } catch {
        // vérification technique non bloquante
      }
    }

    return null;
  };

  const handleSubmitBooking = async () => {
    if (!validateForm()) return;
    setIsProcessing(true);

    const preflightError = await runPreflightChecks();
    if (preflightError) {
      toast({ title: 'Vérification impossible', description: preflightError, variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    try {
      const services = cartItems.map(item => ({
        serviceName: item.serviceName, packageTitle: item.packageTitle, category: item.serviceCategory,
        price: item.price, quantity: item.quantity,
        financialCategory: item.financialCategory,
        urssaf_eligible: item.urssaf_eligible,
        slug: item.slug,
        customBooking: { date: new Date(item.timeSlot.date).toISOString().split('T')[0], startTime: item.timeSlot.startTime, endTime: item.timeSlot.endTime, hours: item.quantity, notes: item.notes },
      }));

      // R-SEL-06 final: créneau < 10h ouvrées (ou service nuit/urgence) → alerte admin priorité
      const isUrgent = cartItems.some(item => {
        const isNightService = !!item.slug && NIGHT_SERVICE_SLUGS.includes(item.slug);
        if (isNightService) return true;
        return getBookingValidation(new Date(item.timeSlot.date), item.timeSlot.startTime).isUrgent;
      });

      const totalAmount = getCartTotal();
      // R-SEL-15: la réduction de 50% ne s'applique qu'aux services éligibles URSSAF
      const eligibleAmount = cartItems.filter(i => i.urssaf_eligible).reduce((sum, i) => sum + i.price * i.quantity, 0);
      const amountAfterUrssaf = urssafEnabled ? totalAmount - eligibleAmount * 0.5 : totalAmount;
      const clientAmount = amountAfterUrssaf;
      const stateAmount = urssafEnabled ? eligibleAmount * 0.5 : 0;
      const cap = (v: string) => v.length > 490 ? v.substring(0, 490) : v;

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: clientAmount,
          description: `Réservation Bikawo - ${services.length} service(s)${urssafEnabled ? ' (Avance immédiate 50%)' : ''}`,
          serviceName: cap(services.map(s => s.serviceName).join(', ')),
          guestEmail: clientInfo.email,
          metadata: {
            services: cap(JSON.stringify(services.map(s => ({ n: s.serviceName, c: s.category, p: s.price, q: s.quantity, d: s.customBooking?.date, t: s.customBooking?.startTime, et: s.customBooking?.endTime, h: s.customBooking?.hours, fc: s.financialCategory, ue: s.urssaf_eligible ? 1 : 0, sl: s.slug })))),
            client_name: cap(`${clientInfo.firstName} ${clientInfo.lastName}`),
            client_email: cap(clientInfo.email), client_phone: cap(clientInfo.phone || ''),
            address: cap(clientInfo.address || ''),
            preferredDate: cartItems[0]?.timeSlot?.date ? new Date(cartItems[0].timeSlot.date).toISOString().split('T')[0] : '',
            preferredTime: cartItems[0]?.timeSlot?.startTime || '',
            notes: cap(cartItems.map(item => item.notes).filter(Boolean).join('; ')),
            urssafEnabled: urssafEnabled.toString(), totalAmount: totalAmount.toString(),
            clientAmount: clientAmount.toString(), stateAmount: stateAmount.toString(),
            is_urgent: isUrgent ? '1' : '0',
          },
        },
      });

      if (paymentError) throw paymentError;
      if (!paymentData?.url) throw new Error('URL de paiement non reçue');

      localStorage.setItem('bikawo-pending-booking', JSON.stringify({ clientInfo, services, totalAmount, notes: cartItems.map(item => item.notes).filter(Boolean).join('; ') }));

      window.location.assign(paymentData.url);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Une erreur est survenue lors de la création du paiement', variant: 'destructive' });
      setIsProcessing(false);
    }
  };

  const cartSummaryProps = {
    cartItems,
    hasIncompatibleServices: hasIncompatibleServices(),
    separatedBookingsCount: getSeparatedBookingsCount(),
    cartTotal: getCartTotal(),
    urssafEnabled,
  };

  // R-SEL-15: l'option avance immédiate n'est proposée que si le panier contient des services éligibles
  const hasEligibleItems = cartItems.some(i => i.urssaf_eligible);
  const eligibleTotal = cartItems.filter(i => i.urssaf_eligible).reduce((sum, i) => sum + i.price * i.quantity, 0);
  const amountAfterUrssafDisplay = urssafEnabled ? getCartTotal() - eligibleTotal * 0.5 : getCartTotal();
  const payableNow = amountAfterUrssafDisplay;

  return (
    <div className={cn('max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-40 sm:pb-32 space-y-4 sm:space-y-6 transition-opacity duration-500 min-h-[100svh]', isVisible ? 'opacity-100' : 'opacity-0')}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 animate-fade-in">
        <Button variant="ghost" onClick={onBack} disabled={isProcessing} className="hover-scale w-full sm:w-auto">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au panier
        </Button>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Finalisation de la réservation</h1>
      </div>

      {/* Mobile summary */}
      <div className="lg:hidden animate-fade-in">
        <Card className="border-primary/20 shadow-soft">
          <CardHeader className="bg-gradient-subtle p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              Récapitulatif de commande
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <CartSummaryItems {...cartSummaryProps} maxHeight="max-h-40 sm:max-h-60" />
          </CardContent>
        </Card>
      </div>

      {/* R-SEL-10: choix compte vs guest pour utilisateurs non-connectés */}
      {authChoice === 'pending' && (
        <Card className="border-primary/30 bg-primary/5 animate-fade-in">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-1">Comment souhaitez-vous continuer ?</h2>
            <p className="text-sm text-muted-foreground mb-4">Choisissez votre mode de paiement pour finaliser votre réservation.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/auth?redirect=/panier')}
                className="flex flex-col gap-2 p-4 rounded-lg border-2 border-primary bg-background hover:bg-primary/5 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">Créer un compte</span>
                  <Badge className="ml-auto text-xs">Recommandé</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Suivez vos réservations, accédez à vos factures et attestations fiscales.</p>
                <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <Star className="w-3 h-3" />
                  Parrainage, historique, espace personnel
                </div>
              </button>
              <button
                onClick={() => setAuthChoice('guest')}
                className="flex flex-col gap-2 p-4 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-muted/50 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">Continuer sans compte</span>
                </div>
                <p className="text-xs text-muted-foreground">Payez rapidement. Vous recevrez un email pour créer votre mot de passe après la réservation.</p>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire visible après choix OU si déjà connecté */}
      {(authChoice === 'guest' || authChoice === null) && (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CheckoutClientInfoCard clientInfo={clientInfo} onChange={setClientInfo} isProcessing={isProcessing} />
          {/* R-SEL-15: avance immédiate proposée uniquement si le panier contient des services éligibles */}
          {hasEligibleItems && (
            <UrssafSection
              cartTotal={eligibleTotal}
              enabled={urssafEnabled}
              onToggle={setUrssafEnabled}
              dialogOpen={showUrssafDialog}
              onDialogOpen={() => setShowUrssafDialog(true)}
              onDialogClose={() => setShowUrssafDialog(false)}
            />
          )}
        </div>

        {/* Desktop summary */}
        <div className="hidden lg:block space-y-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <Card className="sticky top-24 hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Récapitulatif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CartSummaryItems {...cartSummaryProps} showAddress maxHeight="max-h-96" />

              {/* R-SEL-14: politique d'annulation visible avant paiement */}
              <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">Politique d'annulation</p>
                  <p>Annulation gratuite jusqu'à 24h avant la prestation</p>
                  <p>Entre 2h et 24h avant : 50% remboursé</p>
                  <p>Moins de 2h avant : non remboursé</p>
                </div>
              </div>

              <Button onClick={handleSubmitBooking} className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200 hover-scale" size="lg" disabled={isProcessing}>
                {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Traitement en cours...</> : <><CreditCard className="w-4 h-4 mr-2" />Confirmer et payer {payableNow.toFixed(2)}€</>}
              </Button>
              <p className="text-xs text-muted-foreground text-center">Paiement sécurisé via Stripe • Un conseiller vous contactera sous 24h</p>
              {/* R-SEL-13: liens CGV + politique d'annulation */}
              <p className="text-xs text-muted-foreground text-center">
                En confirmant, vous acceptez nos{' '}
                <Link to="/cgu" target="_blank" className="underline hover:text-primary">CGV</Link>
                {' '}et notre politique d'annulation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden sticky bottom-0 left-0 right-0 p-3 bg-background/98 backdrop-blur-md border-t shadow-elegant z-50 safe-area-bottom">
        <div className="max-w-lg mx-auto space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">{urssafEnabled ? 'Votre part' : 'Total à payer'}</span>
            <div className="text-right">
              {urssafEnabled && eligibleTotal > 0 && <div className="text-xs text-green-600 line-through">{getCartTotal()}€</div>}
              <div className="font-bold text-primary text-lg">{payableNow.toFixed(2)}€</div>
            </div>
          </div>
          <Button onClick={handleSubmitBooking} className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200" size="lg" disabled={isProcessing}>
            {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Traitement...</> : <><CreditCard className="w-4 h-4 mr-2" />Confirmer {payableNow.toFixed(2)}€</>}
          </Button>
          <p className="text-xs text-muted-foreground text-center">🔒 Paiement sécurisé • Annulation gratuite jusqu'à 24h avant</p>
          <p className="text-xs text-muted-foreground text-center">
            <Link to="/cgu" target="_blank" className="underline">CGV et politique d'annulation</Link>
          </p>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default BookingCheckout;
