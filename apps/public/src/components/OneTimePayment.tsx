import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Shield, Euro, Loader } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OneTimePaymentProps {
  amount: number;
  serviceName?: string;
  description?: string;
  bookingId?: string;
  metadata?: Record<string, any>;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'hero';
  size?: 'default' | 'sm' | 'lg';
  children?: React.ReactNode;
}

/**
 * Composant pour gérer les paiements ponctuels avec Stripe
 * Usage simple: <OneTimePayment amount={25.50} serviceName="Garde d'enfant" />
 */
export const OneTimePayment: React.FC<OneTimePaymentProps> = ({
  amount,
  serviceName = "Service Bikawo",
  description,
  bookingId,
  metadata,
  onSuccess,
  onError,
  className = "",
  variant = "default",
  size = "default",
  children
}) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePayment = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!amount || amount <= 0) {
      const errorMsg = "Le montant doit être supérieur à 0";
      toast.error(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setLoading(true);

    try {
      const paymentData = {
        amount,
        serviceName,
        description: description || `Paiement de ${amount}€ pour ${serviceName}`,
        bookingId,
        metadata: {
          service_name: serviceName,
          user_id: user.id,
          ...metadata
        }
      };

      console.log('Creating payment with data:', paymentData);

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: paymentData
      });

      if (error) {
        console.error('Payment creation error:', error);
        throw new Error(error.message || 'Erreur lors de la création du paiement');
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        toast.success(`Redirection vers le paiement de ${amount}€`, {
          description: "Une nouvelle fenêtre s'est ouverte pour le paiement sécurisé"
        });

        onSuccess?.(data);
      } else {
        throw new Error('URL de paiement non reçue');
      }

    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du paiement';
      
      toast.error('Erreur de paiement', {
        description: errorMessage
      });

      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading || !amount || amount <= 0}
      variant={variant}
      size={size}
      className={`${className} ${loading ? 'opacity-75' : ''}`}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader className="w-4 h-4 animate-spin" />
          <span>Traitement...</span>
        </div>
      ) : children ? (
        children
      ) : (
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          <span>Payer {formatAmount(amount)}</span>
        </div>
      )}
    </Button>
  );
};

/**
 * Composant de résumé de paiement avec bouton intégré
 */
interface PaymentSummaryProps extends OneTimePaymentProps {
  items?: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
  showSecurityBadges?: boolean;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  amount,
  serviceName = "Service Bikawo", 
  description,
  items = [],
  showSecurityBadges = true,
  ...paymentProps
}) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="space-y-6 p-6">
        {/* Résumé */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Résumé du paiement
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium">{serviceName}</span>
            </div>
            
            {description && (
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Description:</span>
                <span className="text-sm text-right max-w-[200px]">{description}</span>
              </div>
            )}

            {items.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <span className="text-sm font-medium">Détails:</span>
                {items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name} {item.quantity && `x${item.quantity}`}</span>
                    <span>{formatAmount(item.price * (item.quantity || 1))}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
              <span>Total:</span>
              <span className="text-primary">{formatAmount(amount)}</span>
            </div>
          </div>
        </div>

        {/* Bouton de paiement */}
        <OneTimePayment
          amount={amount}
          serviceName={serviceName}
          description={description}
          className="w-full"
          variant="hero"
          size="lg"
          {...paymentProps}
        />

        {/* Badges de sécurité */}
        {showSecurityBadges && (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Paiement sécurisé par Stripe</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Cryptage SSL 256 bits • PCI DSS • 3D Secure
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OneTimePayment;