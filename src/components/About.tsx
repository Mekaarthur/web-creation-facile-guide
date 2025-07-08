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
      number: "5,000+",
      label: "Familles aidées",
      color: "primary"
    },
    {
      icon: Clock,
      number: "7j/7",
      label: "Service disponible",
      color: "accent"
    },
    {
      icon: Trophy,
      number: "98%",
      label: "Satisfaction client",
      color: "primary"
    },
    {
      icon: Globe,
      number: "95%",
      label: "Île-de-France couverte",
      color: "accent"
    }
  ];

  const values = [
    {
      icon: Heart,
      title: "Humanité",
      description: "Nous privilégions l'approche humaine dans chaque interaction, avec empathie et compréhension de vos besoins familiaux."
    },
    {
      icon: Target,
      title: "Fiabilité",
      description: "Nos assistants sont rigoureusement sélectionnés et formés pour vous offrir un service de qualité constant."
    },
    {
      icon: Users,
      title: "Personnalisation",
      description: "Chaque famille est unique. Nous adaptons nos services à votre rythme de vie et vos besoins spécifiques."
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
            Votre partenaire familial
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              de confiance
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Assist'mw vous accompagne dans votre quotidien avec douceur, fiabilité et humanité, 
            pour un foyer plus léger, plus serein et plus harmonieux.
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
                Dans un monde où les familles actives peinent à concilier vie professionnelle, vie familiale 
                et obligations quotidiennes, Assist'mw est né pour proposer une solution humaine, personnalisée et fiable.
              </p>
              <p>
                Aujourd'hui, nous avons développé un réseau d'assistants familiaux couvrant la logistique, 
                la parentalité, la conciergerie et l'assistance voyageurs, via des formules modulables.
              </p>
              <p>
                Notre mission est simple : vous accompagner dans votre quotidien avec douceur, fiabilité et humanité, 
                pour un foyer plus léger, plus serein et plus harmonieux.
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