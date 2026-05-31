import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowLeft, Loader2 } from "lucide-react";
import { useBikawoCart } from "@/hooks/useBikawoCart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

  const [isProcessing, setIsProcessing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showUrssafDialog, setShowUrssafDialog] = useState(false);
  const [urssafEnabled, setUrssafEnabled] = useState(false);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({ firstName: '', lastName: '', email: '', phone: '', address: '' });

  useEffect(() => {
    setIsVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
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

  const handleSubmitBooking = async () => {
    if (!validateForm()) return;
    setIsProcessing(true);

    let checkoutWindow: Window | null = null;
    try {
      checkoutWindow = window.open('', '_blank');
      const services = cartItems.map(item => ({
        serviceName: item.serviceName, packageTitle: item.packageTitle, category: item.serviceCategory,
        price: item.price, quantity: item.quantity,
        customBooking: { date: new Date(item.timeSlot.date).toISOString().split('T')[0], startTime: item.timeSlot.startTime, endTime: item.timeSlot.endTime, hours: item.quantity, notes: item.notes },
      }));

      const totalAmount = getCartTotal();
      const clientAmount = urssafEnabled ? totalAmount * 0.5 : totalAmount;
      const stateAmount = urssafEnabled ? totalAmount * 0.5 : 0;
      const cap = (v: string) => v.length > 490 ? v.substring(0, 490) : v;

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: clientAmount,
          description: `Réservation Bikawo - ${services.length} service(s)${urssafEnabled ? ' (Avance immédiate 50%)' : ''}`,
          serviceName: cap(services.map(s => s.serviceName).join(', ')),
          guestEmail: clientInfo.email,
          metadata: {
            services: cap(JSON.stringify(services.map(s => ({ n: s.serviceName, c: s.category, p: s.price, q: s.quantity, d: s.customBooking?.date, t: s.customBooking?.startTime })))),
            client_name: cap(`${clientInfo.firstName} ${clientInfo.lastName}`),
            client_email: cap(clientInfo.email), client_phone: cap(clientInfo.phone || ''),
            address: cap(clientInfo.address || ''),
            preferredDate: cartItems[0]?.timeSlot?.date ? new Date(cartItems[0].timeSlot.date).toISOString().split('T')[0] : '',
            preferredTime: cartItems[0]?.timeSlot?.startTime || '',
            notes: cap(cartItems.map(item => item.notes).filter(Boolean).join('; ')),
            urssafEnabled: urssafEnabled.toString(), totalAmount: totalAmount.toString(),
            clientAmount: clientAmount.toString(), stateAmount: stateAmount.toString(),
          },
        },
      });

      if (paymentError) throw paymentError;
      if (!paymentData?.url) throw new Error('URL de paiement non reçue');

      localStorage.setItem('bikawo-pending-booking', JSON.stringify({ clientInfo, services, totalAmount, notes: cartItems.map(item => item.notes).filter(Boolean).join('; ') }));

      const go = (u: string) => {
        try { if (checkoutWindow && !checkoutWindow.closed) { checkoutWindow.location.href = u; return; } } catch {}
        try { window.location.assign(u); return; } catch {}
        try { if (window.top) { window.top.location.href = u; return; } } catch {}
        const a = document.createElement('a'); a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer'; document.body.appendChild(a); a.click(); a.remove();
      };
      go(paymentData.url);
    } catch (error: any) {
      try { if (checkoutWindow && !checkoutWindow.closed) checkoutWindow.close(); } catch {}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CheckoutClientInfoCard clientInfo={clientInfo} onChange={setClientInfo} isProcessing={isProcessing} />
          <UrssafSection
            cartTotal={getCartTotal()}
            enabled={urssafEnabled}
            onToggle={setUrssafEnabled}
            dialogOpen={showUrssafDialog}
            onDialogOpen={() => setShowUrssafDialog(true)}
            onDialogClose={() => setShowUrssafDialog(false)}
          />
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
              <Button onClick={handleSubmitBooking} className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200 hover-scale" size="lg" disabled={isProcessing}>
                {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Traitement en cours...</> : <><CreditCard className="w-4 h-4 mr-2" />Confirmer et payer {urssafEnabled ? (getCartTotal() * 0.5).toFixed(2) : getCartTotal()}€</>}
              </Button>
              <p className="text-xs text-muted-foreground text-center">Paiement sécurisé via Stripe • Un conseiller vous contactera sous 24h</p>
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
              {urssafEnabled && <div className="text-xs text-green-600 line-through">{getCartTotal()}€</div>}
              <div className="font-bold text-primary text-lg">{urssafEnabled ? (getCartTotal() * 0.5).toFixed(2) : getCartTotal()}€</div>
            </div>
          </div>
          <Button onClick={handleSubmitBooking} className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200" size="lg" disabled={isProcessing}>
            {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Traitement...</> : <><CreditCard className="w-4 h-4 mr-2" />Confirmer {urssafEnabled ? (getCartTotal() * 0.5).toFixed(2) : getCartTotal()}€</>}
          </Button>
          <p className="text-xs text-muted-foreground text-center">🔒 Paiement sécurisé via Stripe</p>
        </div>
      </div>
    </div>
  );
};

export default BookingCheckout;
