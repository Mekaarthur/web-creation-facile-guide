import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Shield, Zap, Users, Star, TrendingUp, MapPin, Clock, Award, Sparkles } from "lucide-react";

const InnovativeFeatures = () => {
  const features = [
    {
      icon: Brain,
      title: "IA de matching avancée",
      description: "Notre algorithme intelligent analyse les compétences, la localisation et les disponibilités pour le matching parfait",
      category: "Intelligence artificielle",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: Shield,
      title: "Vérification 360°",
      description: "Vérification approfondie des prestataires : documents, antécédents, compétences et références client",
      category: "Sécurité",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      icon: Zap,
      title: "Intervention d'urgence",
      description: "Service d'urgence 24h/24 pour les situations critiques avec intervention en moins de 2h",
      category: "Réactivité",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      icon: Users,
      title: "Équipes coordonnées",
      description: "Possibilité d'assigner plusieurs prestataires complémentaires pour des missions complexes",
      category: "Collaboration",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: Star,
      title: "Garantie qualité premium",
      description: "Garantie satisfait ou remboursé avec ré-intervention gratuite si le service ne correspond pas",
      category: "Qualité",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      icon: TrendingUp,
      title: "Pricing dynamique",
      description: "Tarification intelligente basée sur la demande, l'urgence et la complexité de la mission",
      category: "Économie",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10"
    },
    {
      icon: MapPin,
      title: "Géolocalisation temps réel",
      description: "Suivi en temps réel de l'arrivée du prestataire avec notifications push automatiques",
      category: "Tracking",
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      icon: Clock,
      title: "Planification prédictive",
      description: "Prédiction des créneaux optimaux et suggestion automatique basée sur vos habitudes",
      category: "Prédiction",
      color: "text-teal-500",
      bgColor: "bg-teal-500/10"
    },
    {
      icon: Award,
      title: "Programme de fidélité gamifié",
      description: "Points de fidélité, badges d'accomplissement et récompenses exclusives pour les clients réguliers",
      category: "Engagement",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-background via-background/50 to-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Innovation technologique</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Technologies
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              de nouvelle génération
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Découvrez nos innovations exclusives qui révolutionnent l'expérience des services à domicile
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
                <CardHeader className="space-y-4">
                  <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      {feature.category}
                    </Badge>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Innovation Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-16">
          <Card className="text-center border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-2">98%</div>
              <p className="text-muted-foreground">Taux de satisfaction</p>
            </CardContent>
          </Card>
          <Card className="text-center border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">&lt; 2h</div>
              <p className="text-muted-foreground">Temps d'intervention</p>
            </CardContent>
          </Card>
          <Card className="text-center border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <p className="text-muted-foreground">Support disponible</p>
            </CardContent>
          </Card>
          <Card className="text-center border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-orange-600 mb-2">100%</div>
              <p className="text-muted-foreground">Prestataires vérifiés</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Prêt à découvrir l'avenir des services ?</h3>
              <p className="text-muted-foreground mb-6">
                Rejoignez des milliers de clients qui font déjà confiance à notre technologie de pointe
              </p>
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary">
                <Sparkles className="w-4 h-4 mr-2" />
                Découvrir nos services
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default InnovativeFeatures;