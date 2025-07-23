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
      label: "France couverte",
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
            Bikawo vous accompagne dans votre quotidien avec douceur, fiabilité et humanité, 
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
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p className="text-lg font-medium text-foreground">
                Je suis maman, et comme beaucoup… j'ai connu la galère.
              </p>
              <p>
                En 2022, à la fin de mes études, j'ai accouché de ma fille. Pas de place en crèche, pas de solution simple, et pourtant il fallait s'organiser. Le papa faisait de son mieux, mais avec son travail, nous étions souvent débordés. Malgré tout, j'ai décroché un emploi — avec beaucoup de sacrifices, de larmes… et une charge mentale immense.
              </p>
              <p>
                Un an plus tard, tout a basculé : je suis tombée en dépression. Une vraie. J'étais seule, sans aide, sans nounou, sans relais. Impossible de trouver une assistante maternelle en milieu d'année. Mon compagnon, à distance, m'accompagnait comme il pouvait. Mais ce n'était pas suffisant.
              </p>
              <p>
                Et puis j'ai été licenciée.
              </p>
              <p>
                Pendant 9 mois, au chômage, j'ai enfin soufflé… Et j'ai repensé à tout ce que j'avais traversé. Mais aussi à tous ceux autour de moi : les étudiants en galère, les jeunes parents à bout, les seniors isolés, les couples débordés, les indépendants noyés sous les tâches.
              </p>
              <p className="text-lg font-medium text-foreground">
                C'est là qu'un déclic est né.
              </p>
              <p>
                Un problème commun se dessinait clairement : <strong>la charge mentale</strong>. Ce poids invisible que chacun porte, parfois en silence, sans savoir comment demander de l'aide.
              </p>
              <p>
                Alors avec mon compagnon, nous avons décidé de créer <strong>Bikawô</strong>. Un service pensé pour accompagner toutes les vies du quotidien — sans jugement, avec douceur, souplesse et humanité.
              </p>
              
              <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg space-y-3">
                <h4 className="font-semibold text-foreground text-lg">Notre mission :</h4>
                <div className="space-y-2">
                  <p className="flex items-center space-x-2">
                    <span className="text-primary">🎯</span>
                    <span>Être un soutien réel, là où vous en avez besoin.</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <span className="text-primary">🎯</span>
                    <span>Simplifier votre quotidien pour vous permettre de souffler.</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <span className="text-primary">🎯</span>
                    <span>Offrir des services personnalisés pour alléger la logistique, la parentalité, les voyages, la maison ou l'administratif.</span>
                  </p>
                </div>
              </div>

              <div className="bg-gradient-primary bg-clip-text text-transparent space-y-2">
                <p className="text-lg font-semibold">
                  Bikawô, c'est plus qu'un service.
                </p>
                <p className="text-lg">
                  C'est une respiration. Un coup de main. Un « je suis là pour toi ».
                </p>
              </div>

              <p className="text-lg font-medium text-foreground text-center pt-4">
                Et si aujourd'hui, c'était votre tour de souffler ?
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button variant="hero" size="lg" className="group">
                Découvrir nos services
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="lg">
                Notre équipe
              </Button>
            </div>
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

      </div>
    </section>
  );
};

export default About;