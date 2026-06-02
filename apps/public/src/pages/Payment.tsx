import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StripePaymentIntegration } from '@/components/StripePaymentIntegration';
import { GuestCheckout } from '@/components/GuestCheckout';
import SubscriptionBooking from '@/components/SubscriptionBooking';
import { useAuth } from '@/hooks/useAuth';
import { 
  Shield, 
  CreditCard, 
  CheckCircle, 
  ArrowLeft, 
  Lock,
  Star,
  Calendar,
  Clock,
  User,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnimatedCard } from '@/components/ui/animated-card';

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [paymentType, setPaymentType] = useState<'one-time' | 'subscription'>('one-time');
  const [activeTab, setActiveTab] = useState<'guest' | 'account'>('guest');
  const [serviceData, setServiceData] = useState({
    name: '',
    price: 0,
    description: '',
    duration: ''
  });

  useEffect(() => {
    // Récupérer les données de service depuis les paramètres URL
    const serviceName = searchParams.get('service') || 'Service Bikawo';
    const price = parseFloat(searchParams.get('price') || '0');
    const description = searchParams.get('description') || serviceName;
    const type = searchParams.get('type') as 'one-time' | 'subscription' || 'one-time';
    const duration = searchParams.get('duration') || '1h';

    setServiceData({
      name: serviceName,
      price,
      description,
      duration
    });
    setPaymentType(type);

    // Si l'utilisateur est déjà connecté, basculer vers l'onglet compte
    if (user) {
      setActiveTab('account');
    }
  }, [searchParams, user]);

  const handlePaymentSuccess = () => {
    toast({
      title: "Paiement réussi !",
      description: "Votre paiement a été traité avec succès.",
    });
    navigate('/espace-personnel?tab=reservations');
  };

  const handlePaymentError = (error: string) => {
    toast({
      variant: "destructive",
      title: "Erreur de paiement",
      description: error,
    });
  };

  const handleSwitchToLogin = () => {
    navigate('/auth?redirect=payment');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-white hover:text-white/80 hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Paiement sécurisé</h1>
              <p className="text-white/80">Finalisez votre réservation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Résumé de la commande */}
          <div className="lg:col-span-1 space-y-6">
            <AnimatedCard className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Résumé de votre commande
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium">{serviceData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant={paymentType === 'subscription' ? 'default' : 'secondary'}>
                      {paymentType === 'subscription' ? 'Abonnement' : 'Ponctuel'}
                    </Badge>
                  </div>
                  {paymentType === 'one-time' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Durée:</span>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {serviceData.duration}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description:</span>
                    <span className="text-sm text-right max-w-40">{serviceData.description}</span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {serviceData.price.toFixed(2)}€
                      {paymentType === 'subscription' && <span className="text-sm">/mois</span>}
                    </span>
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>

            {/* Cartes acceptées */}
            <AnimatedCard className="animate-fade-in-up">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Cartes acceptées</h4>
                <div className="flex gap-2 items-center">
                  <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                    VISA
                  </div>
                  <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                    MASTERCARD
                  </div>
                  <div className="bg-blue-800 text-white px-2 py-1 rounded text-xs font-bold">
                    MAESTRO
                  </div>
                  <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-bold">
                    AMEX
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Toutes les transactions sont sécurisées par Stripe
                </div>
              </CardContent>
            </AnimatedCard>

            {/* Sécurité */}
            <AnimatedCard className="animate-fade-in-up">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  Sécurité garantie
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Cryptage SSL 256 bits
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Authentification 3D Secure
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Conformité PCI DSS
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Données jamais stockées
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>
          </div>

          {/* Formulaire de paiement */}
          <div className="lg:col-span-2">
            {paymentType === 'subscription' ? (
              <SubscriptionBooking
                isOpen={true}
                onClose={() => navigate(-1)}
                selectedService={{
                  id: 'subscription',
                  title: serviceData.name,
                  icon: Calendar,
                  price: serviceData.price.toString()
                }}
              />
            ) : (
              <AnimatedCard className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Choisissez votre mode de paiement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'guest' | 'account')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="guest" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Paiement rapide
                      </TabsTrigger>
                      <TabsTrigger value="account" className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Avec compte
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="guest" className="mt-6">
                      <GuestCheckout
                        amount={serviceData.price}
                        serviceDescription={serviceData.description}
                        onPaymentSuccess={handlePaymentSuccess}
                        onPaymentError={handlePaymentError}
                        onSwitchToLogin={handleSwitchToLogin}
                      />
                    </TabsContent>

                    <TabsContent value="account" className="mt-6">
                      {user ? (
                        <StripePaymentIntegration
                          amount={serviceData.price}
                          serviceDescription={serviceData.description}
                          onPaymentSuccess={handlePaymentSuccess}
                          onPaymentError={handlePaymentError}
                        />
                      ) : (
                        <div className="text-center space-y-4 p-8">
                          <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
                          <h3 className="text-lg font-semibold">Connexion requise</h3>
                          <p className="text-muted-foreground">
                            Connectez-vous pour accéder à vos moyens de paiement sauvegardés
                          </p>
                          <Button onClick={handleSwitchToLogin} size="lg">
                            Se connecter
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </AnimatedCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;