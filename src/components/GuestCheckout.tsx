import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { guestCheckoutSchema, type GuestCheckoutForm } from '@/lib/validations';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AnimatedCard } from '@/components/ui/animated-card';
import { 
  Shield, 
  CreditCard, 
  CheckCircle, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Lock,
  AlertTriangle
} from 'lucide-react';

interface GuestCheckoutProps {
  amount: number;
  serviceDescription: string;
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentError?: (error: string) => void;
  onSwitchToLogin?: () => void;
}

export const GuestCheckout: React.FC<GuestCheckoutProps> = ({
  amount,
  serviceDescription,
  onPaymentSuccess,
  onPaymentError,
  onSwitchToLogin
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<GuestCheckoutForm>({
    resolver: zodResolver(guestCheckoutSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      postalCode: '',
      city: '',
    },
  });

  const handleGuestPayment = async (data: GuestCheckoutForm) => {
    setLoading(true);
    try {
      if (!amount || amount <= 0) {
        throw new Error("Le montant doit être supérieur à 0");
      }

      const { data: paymentData, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: amount,
          description: serviceDescription,
          serviceName: serviceDescription,
          guestEmail: data.email,
          metadata: {
            is_guest: true,
            guest_name: `${data.firstName} ${data.lastName}`,
            guest_email: data.email,
            clientInfo: JSON.stringify({
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
              address: `${data.address}, ${data.postalCode} ${data.city}`,
            })
          }
        }
      });

      if (error) throw error;

      if (paymentData?.url) {
        const go = (u: string) => {
          try {
            window.location.assign(u);
            return;
          } catch {}
          try {
            // @ts-ignore
            if (window.top) window.top.location.href = u;
            return;
          } catch {}
          const a = document.createElement('a');
          a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer';
          document.body.appendChild(a); a.click(); a.remove();
        };

        go(paymentData.url);
        toast({
          title: "Redirection vers le paiement",
          description: "Vous allez être redirigé vers Stripe pour finaliser le paiement"
        });
        
        onPaymentSuccess?.(paymentData);
      }

    } catch (error) {
      console.error('Erreur lors du paiement invité:', error);
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimatedCard className="animate-fade-in">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Shield className="h-5 w-5" />
              <span className="font-semibold">Paiement rapide et sécurisé</span>
            </div>
            <p className="text-muted-foreground">
              Payez sans créer de compte - Vos données sont protégées
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant="outline">
                <Lock className="h-3 w-3 mr-1" />
                SSL
              </Badge>
              <Badge variant="outline">Stripe</Badge>
              <Badge variant="outline">3D Secure</Badge>
            </div>
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Résumé de commande */}
      <AnimatedCard className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Résumé de votre commande
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium">{serviceDescription}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="font-semibold">Total à payer:</span>
              <span className="text-2xl font-bold text-primary">
                {formatAmount(amount)}
              </span>
            </div>
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Formulaire invité */}
      <AnimatedCard className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Vos informations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGuestPayment)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Prénom *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Votre prénom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email *
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="votre@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Téléphone (optionnel)
                    </FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="06 12 34 56 78" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  Adresse de facturation
                </div>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse *</FormLabel>
                      <FormControl>
                        <Input placeholder="123 rue de la République" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal *</FormLabel>
                        <FormControl>
                          <Input placeholder="75001" maxLength={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville *</FormLabel>
                        <FormControl>
                          <Input placeholder="Paris" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Traitement en cours...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Payer {formatAmount(amount)}
                    </div>
                  )}
                </Button>
              </div>

              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3" />
                  <span>Aucun compte requis - Paiement instantané</span>
                </div>
                
                <div className="text-sm">
                  <span className="text-muted-foreground">Déjà client ? </span>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-primary"
                    onClick={onSwitchToLogin}
                  >
                    Se connecter
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </AnimatedCard>

      {/* Avertissement sécurité */}
      <AnimatedCard className="animate-fade-in-up bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Paiement invité - Informations importantes
              </p>
              <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                <li>• Aucune donnée de paiement n'est stockée sur nos serveurs</li>
                <li>• Vous recevrez une confirmation par email</li>
                <li>• Créez un compte après paiement pour suivre vos commandes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </AnimatedCard>
    </div>
  );
};