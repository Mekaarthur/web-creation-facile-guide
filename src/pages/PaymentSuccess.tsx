import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Home } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useBikawoCart } from "@/hooks/useBikawoCart";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useBikawoCart();
  const [isProcessing, setIsProcessing] = useState(true);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Clear cart and pending booking
    clearCart();
    localStorage.removeItem('bikawo-pending-booking');
    
    // Set processing to false after a short delay
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  }, [clearCart]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 pb-16 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
              <h2 className="text-2xl font-bold mb-2">Traitement du paiement...</h2>
              <p className="text-muted-foreground">
                Veuillez patienter pendant que nous finalisons votre réservation
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">
              🎉 Paiement réussi !
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Votre réservation a été confirmée avec succès.
              </p>
              <p className="text-sm text-muted-foreground">
                Un email de confirmation vous a été envoyé avec tous les détails.
              </p>
              {sessionId && (
                <p className="text-xs text-muted-foreground mt-4">
                  Référence de transaction: {sessionId.slice(-12)}
                </p>
              )}
            </div>
            
            <div className="pt-4 space-y-2">
              <Button 
                onClick={() => navigate('/espace-personnel?tab=reservations')}
                className="w-full"
                size="lg"
              >
                Voir mes réservations
              </Button>
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
