import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Crown, 
  Euro, 
  Check, 
  Star,
  Clock,
  Shield,
  Users,
  Zap
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  title: string;
  price: string;
  duration: "monthly" | "yearly";
  description: string;
  features: string[];
  popular?: boolean;
  savings?: string;
}

interface SubscriptionBookingProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService: {
    id: string;
    title: string;
    icon: any;
    price: string;
  } | null;
}

const SubscriptionBooking = ({ isOpen, onClose, selectedService }: SubscriptionBookingProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");
  const { user } = useAuth();
  const navigate = useNavigate();

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "monthly",
      title: "Formule Mensuelle",
      price: "40h - 800€",
      duration: "monthly",
      description: "Parfait pour un accompagnement régulier avec flexibilité",
      features: [
        "40h de services par mois",
        "Accès à tous les services Bikawo",
        "Suivi mensuel personnalisé",
        "Résiliable à tout moment",
        "Support prioritaire",
        "Économie de 20% vs à la carte"
      ],
      popular: true
    },
    {
      id: "yearly",
      title: "Formule Annuelle",
      price: "40h - 700€/mois",
      duration: "yearly",
      description: "Le meilleur rapport qualité-prix pour un accompagnement sur l'année",
      features: [
        "40h de services par mois",
        "Accès à tous les services Bikawo",
        "Suivi mensuel personnalisé",
        "Résiliable à tout moment",
        "Support prioritaire",
        "2 mois offerts sur l'année",
        "Chef Family Officer dédié",
        "Économie de 30% vs à la carte"
      ],
      savings: "2 mois offerts"
    },
    {
      id: "premium",
      title: "Bika Plus Premium",
      price: "≥ 1400€/mois",
      duration: "monthly",
      description: "Service haut de gamme avec accompagnement premium 7j/7",
      features: [
        "Accès illimité à tous les services",
        "Chef Family Officer dédié",
        "Ligne prioritaire WhatsApp",
        "Organisation planning familial",
        "Garde premium soir/weekend",
        "Concierge 24h/7j",
        "Services sur-mesure"
      ]
    }
  ];

  const handleSubscription = (planId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const plan = subscriptionPlans.find(p => p.id === planId);
    if (!plan) return;

    // Ici vous pouvez intégrer votre logique de paiement Stripe
    toast.success(`Réservation ${plan.title} pour ${selectedService?.title} initiée !`);
    
    // Rediriger vers une page de paiement ou ouvrir le processus de checkout
    console.log("Proceeding to checkout for:", { service: selectedService, plan });
    
    onClose();
  };

  if (!selectedService) return null;

  const ServiceIcon = selectedService.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ServiceIcon className="w-6 h-6 text-primary" />
            Choisir votre formule pour {selectedService.title}
          </DialogTitle>
          <DialogDescription>
            Sélectionnez la formule d'abonnement qui correspond le mieux à vos besoins
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Service sélectionné */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <ServiceIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{selectedService.title}</h3>
                <p className="text-sm text-muted-foreground">Service sélectionné • {selectedService.price}</p>
              </div>
            </div>
          </Card>

          {/* Plans d'abonnement */}
          <div className="grid md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative p-6 cursor-pointer transition-all duration-300 hover:shadow-glow ${
                  selectedPlan === plan.id 
                    ? 'border-primary shadow-primary/20 shadow-lg' 
                    : 'border-border hover:border-primary/50'
                } ${plan.popular ? 'border-accent' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium">
                    Le plus populaire
                  </div>
                )}

                {plan.savings && (
                  <div className="absolute -top-3 right-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    {plan.savings}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {plan.id === "premium" ? (
                        <Crown className="w-5 h-5 text-accent" />
                      ) : plan.duration === "yearly" ? (
                        <Calendar className="w-5 h-5 text-primary" />
                      ) : (
                        <Clock className="w-5 h-5 text-primary" />
                      )}
                      <h3 className="font-bold text-lg text-foreground">{plan.title}</h3>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">{plan.price}</div>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Features */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <Star className="w-4 h-4 text-accent" />
                      Inclus dans cette formule
                    </h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Selection indicator */}
                  {selectedPlan === plan.id && (
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Formule sélectionnée
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedPlan === "yearly" && (
                <div className="flex items-center gap-1 text-accent">
                  <Zap className="w-4 h-4" />
                  Économisez 100€/mois avec la formule annuelle
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button 
                onClick={() => handleSubscription(selectedPlan)}
                className="min-w-[140px]"
              >
                {selectedPlan === "premium" ? "Réserver Premium" : "Souscrire"}
              </Button>
            </div>
          </div>

          {/* Info supplémentaire */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Engagement flexible</p>
                <p className="text-muted-foreground">
                  Toutes nos formules sont résiliables à tout moment. Aucun engagement contraignant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionBooking;