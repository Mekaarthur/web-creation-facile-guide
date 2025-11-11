import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ShoppingCart, Home } from "lucide-react";

const PaymentCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="max-w-md w-full border-orange-200">
        <CardContent className="pt-8 pb-8 text-center">
          <XCircle className="w-20 h-20 mx-auto mb-4 text-orange-500" />
          <h1 className="text-2xl font-bold mb-2">Paiement annulé</h1>
          <p className="text-muted-foreground mb-6">
            Vous avez annulé le paiement. Votre panier est toujours disponible si vous souhaitez finaliser votre réservation.
          </p>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate("/panier")}
              className="w-full"
              size="lg"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Retour au panier
            </Button>

            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted/30 rounded-lg text-sm text-left">
            <p className="font-medium mb-2">💡 Besoin d'aide ?</p>
            <p className="text-muted-foreground">
              Si vous rencontrez des difficultés, contactez-nous au{" "}
              <a href="tel:+33609085390" className="text-primary hover:underline">
                06 09 08 53 90
              </a>
              {" "}ou par email à{" "}
              <a href="mailto:support@bikawo.com" className="text-primary hover:underline">
                support@bikawo.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCanceled;
