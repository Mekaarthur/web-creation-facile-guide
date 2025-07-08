import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Users, 
  Clock, 
  Globe,
  Heart,
  Target,
  ArrowRight,
  Star
} from "lucide-react";

const About = () => {
  const stats = [
    {
      icon: Users,
      number: "10,000+",
      label: "Clients satisfaits",
      color: "primary"
    },
    {
      icon: Clock,
      number: "24/7",
      label: "Support disponible",
      color: "accent"
    },
    {
      icon: Trophy,
      number: "99.9%",
      label: "Taux de résolution",
      color: "primary"
    },
    {
      icon: Globe,
      number: "50+",
      label: "Pays couverts",
      color: "accent"
    }
  ];

  const values = [
    {
      icon: Heart,
      title: "Bienveillance",
      description: "Nous traitons chaque demande avec empathie et compréhension, car votre problème est notre priorité."
    },
    {
      icon: Target,
      title: "Excellence",
      description: "Nous visons l'excellence dans chaque interaction, avec des solutions précises et efficaces."
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "Nous travaillons en équipe pour vous offrir la meilleure expertise collective disponible."
    }
  ];

  return (
    <section id="about" className="py-20 bg-gradient-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-fade-in-up">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Star className="w-4 h-4" />
            <span>À propos de nous</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Votre partenaire de confiance
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              depuis 2018
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Assist Me est né de la volonté de révolutionner l'assistance technique. 
            Nous croyons que chaque problème a une solution, et nous mettons tout en œuvre pour la trouver.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card 
                key={stat.label}
                className="p-6 text-center hover:shadow-glow transition-all duration-300 hover:scale-[1.02] animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-12 h-12 mx-auto mb-4 rounded-lg ${
                  stat.color === 'primary' ? 'bg-gradient-primary' : 'bg-gradient-accent'
                } flex items-center justify-center`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Left - Story */}
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">
              Notre histoire
            </h3>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Tout a commencé en 2018 quand notre fondateur, frustré par la qualité du support technique traditionnel, 
                a décidé de créer une alternative révolutionnaire.
              </p>
              <p>
                Aujourd'hui, Assist Me est devenue la référence en matière d'assistance technique en France, 
                avec une équipe de 50+ experts passionnés et des milliers de clients satisfaits.
              </p>
              <p>
                Notre mission est simple : transformer chaque interaction de support en une expérience positive 
                qui dépasse vos attentes.
              </p>
            </div>
            <Button variant="hero" size="lg" className="group">
              Découvrir notre équipe
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Right - Values */}
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">
              Nos valeurs
            </h3>
            <div className="space-y-4">
              {values.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <Card key={value.title} className="p-6 hover:shadow-soft transition-all duration-300">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">{value.title}</h4>
                        <p className="text-sm text-muted-foreground">{value.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Team CTA */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <Card className="p-8 md:p-12 bg-gradient-hero text-white">
            <div className="max-w-3xl mx-auto space-y-6">
              <h3 className="text-2xl md:text-3xl font-bold">
                Rejoignez notre communauté
              </h3>
              <p className="text-white/90">
                Plus de 10,000 utilisateurs nous font déjà confiance. 
                Découvrez pourquoi Assist Me est le choix préféré des professionnels.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="glass" size="lg">
                  Commencer gratuitement
                </Button>
                <Button variant="outline" size="lg" className="bg-white text-primary hover:bg-white/90">
                  Voir les témoignages
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default About;