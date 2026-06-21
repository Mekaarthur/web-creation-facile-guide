import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Trash2, Clock, Info, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

const PaymentMethodsManager = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

const fetchPaymentMethods = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('get-payment-methods');

    if (error) {
      console.error('Erreur fonction edge:', error);
      throw error;
    }
    
    setPaymentMethods(data?.paymentMethods || []);
  } catch (error) {
    console.error('Erreur lors du chargement des méthodes de paiement:', error);
    toast({
      title: "Erreur",
      description: "Impossible de charger les méthodes de paiement. Veuillez réessayer plus tard.",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  const addPaymentMethod = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-payment-method');
      
      if (error) throw error;
      
      // Rediriger vers Stripe pour ajouter la méthode de paiement
      window.open(data.url, '_blank');
      
      toast({
        title: "Redirection",
        description: "Vous allez être redirigé vers Stripe pour ajouter votre carte",
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de méthode de paiement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter une méthode de paiement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBrandIcon = (brand: string) => {
    const brandUpper = brand.toUpperCase();
    switch (brandUpper) {
      case 'VISA':
        return '💳';
      case 'MASTERCARD':
        return '💳';
      case 'AMEX':
        return '💳';
      default:
        return '💳';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Méthodes de paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Méthodes de paiement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Aucune méthode de paiement enregistrée
              </p>
              <Button onClick={addPaymentMethod} disabled={loading}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une carte
              </Button>
            </div>
          ) : (
            <>
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getBrandIcon(method.brand)}</span>
                    <div>
                      <p className="font-medium text-foreground">
                        {method.brand.toUpperCase()} •••• {method.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expire {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Principale</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Suppression",
                          description: "Pour supprimer cette carte, utilisez le portail Stripe ci-dessous",
                        });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={addPaymentMethod}
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une autre carte
              </Button>
            </>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Gestion avancée</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke('customer-portal');
                  if (error) throw error;
                  window.open(data.url, '_blank');
                } catch (error) {
                  console.error('Erreur ouverture portail client:', error);
                  toast({
                    title: "Erreur",
                    description: "Impossible d'ouvrir le portail de gestion",
                    variant: "destructive",
                  });
                }
              }}
            >
              Gérer via Stripe
            </Button>
          </div>
          
          <h4 className="font-medium">Autres moyens de paiement</h4>

          {/* CESU / Chèques ANCV */}
          <div className="p-4 border rounded-lg border-blue-200 bg-blue-50/50">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground">CESU & Chèques ANCV</p>
                  <Badge variant="outline" className="text-xs gap-1 border-blue-300 text-blue-700">
                    <Clock className="w-3 h-3" />Bientôt
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Chèque Emploi Service Universel et chèques vacances ANCV acceptés prochainement.
                  Idéal pour les salariés bénéficiant de ces avantages employeur.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-blue-700 bg-blue-100 rounded p-2">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <p>
                En attendant, vous pouvez utiliser l'<strong>Avance Immédiate URSSAF</strong> dans votre espace —
                le crédit d'impôt de 50 % est déduit directement à la source, sans attendre votre déclaration.
              </p>
            </div>
          </div>

          {/* Prélèvement SEPA */}
          <div className="p-4 border rounded-lg opacity-60">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">Prélèvement SEPA</p>
              <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />Bientôt</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Paiement automatique par virement bancaire.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodsManager;