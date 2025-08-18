import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Shield, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AnimatedCard } from '@/components/ui/animated-card';

interface PaymentIntegrationProps {
  amount: number;
  serviceDescription: string;
  providerId?: string;
  bookingId?: string;
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentError?: (error: string) => void;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

export const StripePaymentIntegration: React.FC<PaymentIntegrationProps> = ({
  amount,
  serviceDescription,
  providerId,
  bookingId,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadPaymentMethods();
    }
  }, [user]);

  const loadPaymentMethods = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-methods');
      
      if (error) throw error;
      
      setPaymentMethods(data.payment_methods || []);
      if (data.payment_methods?.length > 0) {
        setSelectedMethod(data.payment_methods[0].id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des moyens de paiement:', error);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Connexion requise",
        description: "Veuillez vous connecter pour ajouter un moyen de paiement"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-method');
      
      if (error) throw error;
      
      // Rediriger vers Stripe Checkout pour ajouter une carte
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du moyen de paiement:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter le moyen de paiement"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Connexion requise",
        description: "Veuillez vous connecter pour effectuer un paiement"
      });
      return;
    }

    if (!selectedMethod && paymentMethods.length === 0) {
      toast({
        variant: "destructive",
        title: "Moyen de paiement requis",
        description: "Veuillez ajouter un moyen de paiement"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: amount, // Montant en euros
          description: serviceDescription,
          serviceName: serviceDescription,
          bookingId: bookingId,
          metadata: {
            provider_id: providerId,
            booking_id: bookingId
          }
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        toast({
          title: "Redirection vers le paiement",
          description: "Une nouvelle fenêtre s'est ouverte pour le paiement sécurisé"
        });
        
        onPaymentSuccess?.(data);
      }

    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du paiement';
      
      toast({
        variant: "destructive",
        title: "Erreur de paiement",
        description: errorMessage
      });
      
      onPaymentError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    
    if (brandLower === 'visa') {
      return (
        <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold min-w-[40px] text-center">
          VISA
        </div>
      );
    }
    if (brandLower === 'mastercard') {
      return (
        <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold min-w-[40px] text-center">
          MC
        </div>
      );
    }
    if (brandLower === 'maestro') {
      return (
        <div className="bg-blue-800 text-white px-2 py-1 rounded text-xs font-bold min-w-[40px] text-center">
          MAESTRO
        </div>
      );
    }
    if (brandLower === 'amex') {
      return (
        <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-bold min-w-[40px] text-center">
          AMEX
        </div>
      );
    }
    
    // Icône générique pour les autres cartes
    return <CreditCard className="h-4 w-4" />;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (!user) {
    return (
      <AnimatedCard className="animate-fade-in">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connexion requise</h3>
          <p className="text-muted-foreground">
            Veuillez vous connecter pour procéder au paiement
          </p>
        </CardContent>
      </AnimatedCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Résumé du paiement */}
      <AnimatedCard className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Paiement sécurisé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium">{serviceDescription}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Montant:</span>
              <span className="text-2xl font-bold text-primary">
                {formatAmount(amount)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              Paiement sécurisé par Stripe
            </div>
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Moyens de paiement */}
      <AnimatedCard className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>Moyens de paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getBrandIcon(method.brand)}
                      <div>
                        <div className="font-medium">
                          {method.brand.toUpperCase()} •••• {method.last4}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Expire {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                        </div>
                      </div>
                    </div>
                    {selectedMethod === method.id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Aucun moyen de paiement enregistré
              </p>
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleAddPaymentMethod}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                Ajout en cours...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Ajouter une carte
              </div>
            )}
          </Button>
        </CardContent>
      </AnimatedCard>

      {/* Bouton de paiement */}
      <Button
        onClick={handlePayment}
        disabled={loading || (!selectedMethod && paymentMethods.length === 0)}
        size="lg"
        className="w-full"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin" />
            Traitement en cours...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Payer {formatAmount(amount)}
          </div>
        )}
      </Button>

      {/* Informations de sécurité */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Vos données sont protégées par le cryptage SSL</span>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Badge variant="outline">Stripe</Badge>
          <Badge variant="outline">PCI DSS</Badge>
          <Badge variant="outline">3D Secure</Badge>
        </div>
      </div>
    </div>
  );
};