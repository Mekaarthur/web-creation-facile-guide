import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Heart, Users, Clock } from "lucide-react";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const subscriptionPlans = [
    {
      name: "Assist'Essentiel",
      description: "Pour les besoins ponctuels",
      price: { monthly: 29, annual: 290 },
      features: [
        "2 prestations par mois",
        "Support standard",
        "Garde ponctuelle d'enfants",
        "Courses express",
        "Nettoyage léger"
      ],
      popular: false,
      color: "accent"
    },
    {
      name: "Assist'Confort",
      description: "Le choix des familles actives",
      price: { monthly: 59, annual: 590 },
      features: [
        "5 prestations par mois",
        "Support prioritaire",
        "Toutes prestations Assist'Kids",
        "Toutes prestations Assist'Maison",
        "Aide administrative",
        "Calendrier familial partagé"
      ],
      popular: true,
      color: "primary"
    },
    {
      name: "Assist'Premium",
      description: "La sérénité totale",
      price: { monthly: 99, annual: 990 },
      features: [
        "10 prestations par mois",
        "Support 24/7",
        "Chef Family Officer dédié",
        "Conciergerie premium",
        "Organisation d'événements",
        "Assist'Travel inclus",
        "Service d'urgence"
      ],
      popular: false,
      color: "accent"
    }
  ];

  const oneTimeServices = [
    {
      name: "Garde d'urgence",
      description: "Intervention immédiate",
      price: "Sur devis",
      duration: "4h minimum",
      icon: Clock
    },
    {
      name: "Organisation événement",
      description: "Anniversaire, fête familiale",
      price: "Sur devis",
      duration: "Prestation complète",
      icon: Heart
    },
    {
      name: "Aide déménagement",
      description: "Support logistique complet",
      price: "Sur devis",
      duration: "Demi-journée",
      icon: Users
    }
  ];

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-fade-in-up">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Heart className="w-4 h-4" />
            <span>Nos tarifs</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Des forfaits pensés
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              pour votre cocon familial
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Choisissez la formule qui correspond à vos besoins. Abonnements flexibles ou prestations à la carte.
          </p>
        </div>

        {/* Toggle Annual/Monthly */}
        <div className="flex justify-center mb-12">
          <div className="bg-card rounded-lg p-1 shadow-soft">
            <div className="flex">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  !isAnnual 
                    ? "bg-gradient-primary text-white shadow-glow" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  isAnnual 
                    ? "bg-gradient-primary text-white shadow-glow" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annuel
                <Badge className="ml-2 bg-accent text-accent-foreground">-20%</Badge>
              </button>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {subscriptionPlans.map((plan, index) => (
            <Card 
              key={plan.name}
              className={`relative hover:shadow-cocon transition-all duration-300 hover:scale-[1.02] ${
                plan.popular 
                  ? "ring-2 ring-primary shadow-glow" 
                  : "hover:shadow-soft"
              } animate-fade-in-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-white px-4 py-1">
                    Le plus populaire
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold text-foreground">
                  {plan.name}
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-foreground">
                      {isAnnual ? Math.round(plan.price.annual / 12) : plan.price.monthly}€
                    </span>
                    <span className="text-muted-foreground ml-1">/mois</span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-accent mt-1">
                      Soit {plan.price.annual}€/an
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-accent flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? "bg-gradient-primary text-white hover:shadow-glow" 
                      : "border border-primary text-primary hover:bg-primary/5"
                  } transition-all`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  Choisir ce forfait
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* One-time Services */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 shadow-cocon">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Prestations à la carte
            </h3>
            <p className="text-muted-foreground text-lg">
              Pour vos besoins ponctuels, sans engagement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {oneTimeServices.map((service, index) => (
              <Card 
                key={service.name}
                className="hover:shadow-soft transition-all duration-300 hover:scale-[1.02] animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center mx-auto">
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">
                      {service.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {service.description}
                    </p>
                    <div className="text-center">
                      <span className="text-2xl font-bold text-primary">
                        {service.price}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {service.duration}
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-primary text-primary hover:bg-primary/5"
                  >
                    Réserver
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <div className="bg-gradient-cocon rounded-2xl p-8 shadow-glow">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Besoin d'un devis personnalisé ?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Contactez-nous pour une offre sur mesure adaptée à vos besoins spécifiques et à votre situation familiale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gradient-primary text-white hover:shadow-glow transition-all">
                Demander un devis
              </Button>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                Nous contacter
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;