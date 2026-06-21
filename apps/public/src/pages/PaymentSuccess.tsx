import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Home, Calendar, AlertCircle, RepeatIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { RecurringBookingOptions, defaultRecurringOptions, type RecurringOptions } from "@/components/booking/RecurringBookingOptions";
import { recurringBookingService } from "@/services/recurringBookingService";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // R-SEL-18: proposer la récurrence après la 1ère réservation (clients connectés uniquement)
  const [userId, setUserId] = useState<string | null>(null);
  const [recurringOptions, setRecurringOptions] = useState<RecurringOptions>(defaultRecurringOptions());
  const [isSavingRecurrence, setIsSavingRecurrence] = useState(false);
  const [recurrenceSaved, setRecurrenceSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const handleConfirmRecurrence = async () => {
    if (!userId) return;
    const firstService = verificationData?.services?.[0];
    const firstBooking = verificationData?.bookingIds?.[0];
    if (!firstService) return;

    setIsSavingRecurrence(true);
    try {
      await recurringBookingService.create({
        client_id: userId,
        origin_booking_id: firstBooking ?? null,
        service_name: firstService.serviceName,
        package_title: firstService.packageTitle,
        financial_category: firstService.financialCategory,
        urssaf_eligible: !!firstService.urssaf_eligible,
        price: firstService.price,
        frequency: recurringOptions.frequency,
        day_of_week: recurringOptions.frequency !== 'monthly' ? recurringOptions.dayOfWeek : null,
        prefer_same_provider: recurringOptions.preferSameProvider,
        address: verificationData?.clientInfo?.address || '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: recurringOptions.endDate || null,
      });
      setRecurrenceSaved(true);
      toast({ title: "Récurrence activée", description: "Votre réservation récurrente a été enregistrée. Annulation possible sans frais avec 7 jours de préavis." });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible d'activer la récurrence", variant: "destructive" });
    } finally {
      setIsSavingRecurrence(false);
    }
  };

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        setError("Session de paiement introuvable");
        setIsVerifying(false);
        return;
      }

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("La vérification a expiré, veuillez rafraîchir la page")), 15000)
        );

        const { data: rawData, error: verifyError } = await Promise.race([
          supabase.functions.invoke('verify-payment', { body: { sessionId } }),
          timeoutPromise,
        ]) as Awaited<ReturnType<typeof supabase.functions.invoke>>;

        if (verifyError) {
          throw verifyError;
        }

        const data = rawData as Record<string, any>;

        if (!data || !data.success) {
          throw new Error(data?.error || "Erreur lors de la vérification du paiement");
        }

        setVerificationData(data);

        // Nettoyer le panier localStorage
        localStorage.removeItem('bikawo-cart');
        localStorage.removeItem('bikawo-cart-timestamp');
        localStorage.removeItem('bikawo-pending-booking');

        // Dispatcher l'événement de mise à jour du panier
        window.dispatchEvent(new Event('bikawo-cart-updated'));

        toast({
          title: "✅ Réservation confirmée !",
          description: data.alreadyProcessed
            ? "Votre réservation est déjà enregistrée."
            : `Votre paiement de ${data.clientAmount}€ a été traité avec succès.`,
          duration: 6000,
        });

      } catch (err: any) {
        console.error('[PaymentSuccess] Erreur:', err);
        setError(err.message || "Une erreur est survenue");
        toast({
          title: "Erreur",
          description: err.message || "Impossible de vérifier le paiement",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, toast]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 lg:pt-20 pb-16 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-8 pb-8">
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
              <h2 className="text-xl font-semibold mb-2">Vérification du paiement...</h2>
              <p className="text-muted-foreground">
                Veuillez patienter pendant que nous confirmons votre réservation.
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !verificationData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 lg:pt-20 pb-16 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full border-destructive">
            <CardContent className="pt-8 pb-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">Erreur de vérification</h2>
              <p className="text-muted-foreground mb-6">
                {error || "Impossible de vérifier votre paiement"}
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate("/")} 
                  className="w-full"
                >
                  Retour à l'accueil
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = "mailto:support@bikawo.com"}
                  className="w-full"
                >
                  Contacter le support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const {
    clientInfo,
    services,
    clientAmount,
    urssafEnabled,
    bookingIds,
    orderNumbers,
    alreadyProcessed,
  } = verificationData as Record<string, any>;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Paiement confirmé | Bikawo</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />
      <div className="pt-16 lg:pt-20 pb-16 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* En-tête de succès */}
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-600 animate-fade-in" />
              <h1 className="text-3xl font-bold mb-2">
                {alreadyProcessed ? "Réservation enregistrée" : "Paiement réussi !"}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                {alreadyProcessed
                  ? "Votre paiement a déjà été traité avec succès"
                  : "Votre réservation a été confirmée"}
              </p>
              {clientAmount != null && (
                <Badge className="bg-green-600 text-white text-base px-4 py-2">
                  {clientAmount}€ payé
                </Badge>
              )}
              {urssafEnabled && (
                <p className="text-sm text-green-700 mt-3">
                  ✅ Avance immédiate URSSAF activée (-50%)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Informations client — absentes en cas d'alreadyProcessed */}
          {clientInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Vos informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nom complet</p>
                    <p className="font-medium">{clientInfo.firstName} {clientInfo.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{clientInfo.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{clientInfo.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="font-medium text-sm">{clientInfo.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Services réservés — absents en cas d'alreadyProcessed */}
          {Array.isArray(services) && services.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Services réservés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.map((service: any, index: number) => {
                  const booking = service.customBooking || {};
                  const dateObj = booking.date ? new Date(booking.date) : null;
                  const dateLabel = dateObj && !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : booking.date || "—";
                  return (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{service.serviceName}</h3>
                          <p className="text-sm text-muted-foreground">{service.packageTitle}</p>
                        </div>
                        <Badge variant="secondary">{service.price * service.quantity}€</Badge>
                      </div>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        <p>📅 {dateLabel}</p>
                        {booking.startTime && <p>🕐 {booking.startTime}{booking.endTime ? ` - ${booking.endTime}` : ''}</p>}
                        {booking.hours && <p>⏱️ {booking.hours} heure(s)</p>}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Numéros de réservation */}
          {bookingIds && bookingIds.length > 0 && (
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Numéro{bookingIds.length > 1 ? 's' : ''} de réservation
                </p>
                <div className="flex flex-wrap gap-2">
                  {bookingIds.map((id: string, index: number) => (
                    <Badge key={index} variant="outline" className="font-mono text-sm px-3 py-1">
                      {orderNumbers?.[index] || id.slice(0, 8)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* R-SEL-18: proposer la récurrence après la 1ère réservation (clients connectés, non déjà traité) */}
          {userId && !alreadyProcessed && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <RepeatIcon className="w-5 h-5 text-primary" />
                  Réserver ce service régulièrement ?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recurrenceSaved ? (
                  <p className="text-sm text-green-700">✅ Votre récurrence est activée. Annulation sans frais avec 7 jours de préavis.</p>
                ) : (
                  <>
                    <RecurringBookingOptions value={recurringOptions} onChange={setRecurringOptions} />
                    {recurringOptions.enabled && (
                      <Button onClick={handleConfirmRecurrence} disabled={isSavingRecurrence} className="w-full">
                        {isSavingRecurrence ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Activation...</> : "Activer la récurrence"}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/espace-personnel")}
              className="flex-1"
              size="lg"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Voir mes réservations
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              size="lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
