import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Trophy, 
  Users, 
  Clock, 
  Globe,
  Heart,
  Target,
  ArrowRight,
  Star,
  Sparkles,
  Quote
} from "lucide-react";

const About = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    {
      icon: Users,
      number: "5,000+",
      label: "Familles aidées",
      color: "from-emerald-400 to-emerald-600",
      description: "et toujours plus chaque jour"
    },
    {
      icon: Clock,
      number: "7j/7",
      label: "Service disponible",
      color: "from-blue-400 to-blue-600",
      description: "24h/24 pour vous accompagner"
    },
    {
      icon: Trophy,
      number: "98%",
      label: "Satisfaction client",
      color: "from-amber-400 to-amber-600",
      description: "Un taux qui nous rend fiers"
    },
    {
      icon: Globe,
      number: "95%",
      label: "France couverte",
      color: "from-purple-400 to-purple-600",
      description: "Partout où vous êtes"
    }
  ];

  const values = [
    {
      icon: Heart,
      title: "Humanité",
      description: "Nous privilégions l'approche humaine dans chaque interaction, avec empathie et compréhension de vos besoins familiaux.",
      gradient: "from-rose-400 to-pink-600"
    },
    {
      icon: Target,
      title: "Fiabilité",
      description: "Nos experts Bika sont rigoureusement sélectionnés et formés pour vous offrir un service de qualité constant.",
      gradient: "from-indigo-400 to-indigo-600"
    },
    {
      icon: Users,
      title: "Personnalisation",
      description: "Chaque famille est unique. Nous adaptons nos services à votre rythme de vie et vos besoins spécifiques.",
      gradient: "from-teal-400 to-teal-600"
    }
  ];

  return (
    <section id="about" className="py-20 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className={`text-center space-y-8 mb-20 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="relative">
            {/* Floating elements */}
            <div className="absolute -top-10 left-1/4 w-20 h-20 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl animate-pulse" />
            <div className="absolute -top-5 right-1/3 w-16 h-16 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full blur-lg animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }} />
            
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm text-primary px-6 py-3 rounded-full text-sm font-medium border border-primary/20 shadow-lg">
              <Sparkles className="w-5 h-5" />
              <span>À propos de nous</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mt-6 leading-tight">
              Votre partenaire familial
              <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-pulse">
                de confiance
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mt-6 leading-relaxed">
              Bikawo vous accompagne dans votre quotidien avec 
              <span className="text-primary font-semibold"> douceur</span>, 
              <span className="text-secondary font-semibold"> fiabilité</span> et 
              <span className="text-accent font-semibold"> humanité</span>, 
              pour un foyer plus léger, plus serein et plus harmonieux.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card 
                key={stat.label}
                className="group p-8 text-center hover:shadow-2xl transition-all duration-500 hover:scale-105 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 relative overflow-hidden"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Background gradient effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                  {stat.number}
                </div>
                
                <div className="text-lg font-semibold text-foreground mb-2">
                  {stat.label}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {stat.description}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Main Story Section */}
        <div className={`grid lg:grid-cols-2 gap-16 items-start mb-20 transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Left - Story */}
          <div className="space-y-8">
            <div className="relative">
              <Quote className="absolute -top-4 -left-4 w-12 h-12 text-primary/20" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Notre histoire
              </h2>
            </div>
            
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-2xl border border-primary/20">
                <p className="text-xl font-semibold text-foreground">
                  Je suis maman, et comme beaucoup… j'ai connu la galère.
                </p>
              </div>
              
              <p className="text-lg">
                En 2022, à la fin de mes études, j'ai accouché de ma fille. Pas de place en crèche, pas de solution simple, et pourtant il fallait s'organiser. Le papa faisait de son mieux, mais avec son travail, nous étions souvent débordés. Malgré tout, j'ai décroché un emploi — avec beaucoup de sacrifices, de larmes… et une charge mentale immense.
              </p>
              
              <p className="text-lg">
                Un an plus tard, tout a basculé : je suis tombée en dépression. Une vraie. J'étais seule, sans aide, sans nounou, sans relais. Impossible de trouver une aide familiale en milieu d'année. Mon compagnon, à distance, m'accompagnait comme il pouvait. Mais ce n'était pas suffisant.
              </p>
              
              <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-2xl">
                <p className="text-lg font-medium text-red-800">
                  Et puis j'ai été licenciée.
                </p>
              </div>
              
              <p className="text-lg">
                Pendant 9 mois, au chômage, j'ai enfin soufflé… Et j'ai repensé à tout ce que j'avais traversé. Mais aussi à tous ceux autour de moi : les étudiants en galère, les jeunes parents à bout, les seniors isolés, les couples débordés, les indépendants noyés sous les tâches.
              </p>
              
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-6 rounded-r-2xl">
                <p className="text-xl font-bold text-yellow-800">
                  C'est là qu'un déclic est né.
                </p>
              </div>
              
              <p className="text-lg">
                Un problème commun se dessinait clairement : <strong className="text-foreground">la charge mentale</strong>. Ce poids invisible que chacun porte, parfois en silence, sans savoir comment demander de l'aide.
              </p>
              
              <p className="text-lg">
                Alors avec mon compagnon, nous avons décidé de créer <strong className="text-primary text-xl">Bikawô</strong>. Un service pensé pour accompagner toutes les vies du quotidien — sans jugement, avec douceur, souplesse et humanité.
              </p>
              
              <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 p-8 rounded-2xl space-y-4 backdrop-blur-sm">
                <h4 className="font-bold text-foreground text-xl flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" />
                  Notre mission :
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-xl">
                    <span className="text-2xl">🎯</span>
                    <span className="text-lg">Être un soutien réel, là où vous en avez besoin.</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-xl">
                    <span className="text-2xl">🎯</span>
                    <span className="text-lg">Simplifier votre quotidien pour vous permettre de souffler.</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-xl">
                    <span className="text-2xl">🎯</span>
                    <span className="text-lg">Offrir des services personnalisés pour alléger la logistique, la parentalité, les voyages, la maison ou l'administratif.</span>
                  </div>
                </div>
              </div>

              <div className="text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent space-y-3 p-6">
                <p className="text-2xl font-bold">
                  Bikawô, c'est plus qu'un service.
                </p>
                <p className="text-xl font-semibold">
                  C'est une respiration. Un coup de main. Un « je suis là pour toi ».
                </p>
              </div>

              <div className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 p-8 rounded-2xl border border-primary/20">
                <p className="text-2xl font-bold text-foreground">
                  Et si aujourd'hui, c'était votre tour de souffler ?
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-6">
              <Link to="/services" className="group">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto px-10 py-4 text-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  Découvrir nos services
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/nous-recrutons" className="group">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full sm:w-auto px-10 py-4 text-lg border-2 hover:bg-primary/5 transform hover:scale-105 transition-all duration-300"
                >
                  Rejoindre l'équipe
                  <Heart className="w-5 h-5 ml-2 transition-transform group-hover:scale-110" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right - Values */}
          <div className="space-y-8 lg:sticky lg:top-8">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
              <Star className="w-8 h-8 text-primary" />
              Nos valeurs
            </h3>
            
            <div className="space-y-6">
              {values.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <Card 
                    key={value.title} 
                    className="group p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 border-0 bg-white/80 backdrop-blur-sm relative overflow-hidden"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    {/* Background gradient effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                    
                    <div className="flex items-start space-x-6 relative">
                      <div className={`w-16 h-16 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center flex-shrink-0 transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                          {value.title}
                        </h4>
                        <p className="text-muted-foreground leading-relaxed text-lg">
                          {value.description}
                        </p>
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