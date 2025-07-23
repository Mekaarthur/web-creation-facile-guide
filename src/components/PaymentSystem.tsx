import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Shield, Lock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentSystemProps {
  amount: number;
  onPaymentSuccess: () => void;
  onPaymentCancel: () => void;
}

const PaymentSystem = ({ amount, onPaymentSuccess, onPaymentCancel }: PaymentSystemProps) => {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: ""
  });
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setProcessing(true);
    
    // Simulation du traitement de paiement
    setTimeout(() => {
      setProcessing(false);
      toast({
        title: "Paiement réussi",
        description: `Votre paiement de ${amount.toFixed(2)}€ a été traité avec succès.`,
      });
      onPaymentSuccess();
    }, 2000);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Paiement sécurisé
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-4 bg-primary/5 rounded-lg">
          <p className="text-2xl font-bold text-primary">{amount.toFixed(2)}€</p>
          <p className="text-sm text-muted-foreground">Montant à payer</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Méthode de paiement</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Carte bancaire</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="transfer">Virement bancaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === "card" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom sur la carte</Label>
                <Input
                  value={cardData.name}
                  onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Jean Dupont"
                />
              </div>
              <div className="space-y-2">
                <Label>Numéro de carte</Label>
                <Input
                  value={cardData.number}
                  onChange={(e) => setCardData(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiration</Label>
                  <Input
                    value={cardData.expiry}
                    onChange={(e) => setCardData(prev => ({ ...prev, expiry: e.target.value }))}
                    placeholder="MM/AA"
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CVV</Label>
                  <Input
                    value={cardData.cvv}
                    onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value }))}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === "paypal" && (
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Vous serez redirigé vers PayPal pour finaliser votre paiement</p>
            </div>
          )}

          {paymentMethod === "transfer" && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <p className="font-medium">Coordonnées bancaires :</p>
              <div className="text-sm space-y-1">
                <p><strong>IBAN :</strong> FR76 1234 5678 9012 3456 7890 123</p>
                <p><strong>BIC :</strong> ABNAFRPP</p>
                <p><strong>Titulaire :</strong> Bikawo SAS</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span>Paiement sécurisé SSL 256 bits</span>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onPaymentCancel} className="flex-1">
            Annuler
          </Button>
          <Button 
            onClick={handlePayment} 
            disabled={processing} 
            className="flex-1"
            variant="hero"
          >
            {processing ? (
              "Traitement..."
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Payer {amount.toFixed(2)}€
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSystem;