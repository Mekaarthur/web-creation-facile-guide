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
  Quote,
  CheckCircle2
} from "lucide-react";
import { useTranslation } from 'react-i18next';

const About = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    {
      icon: Users,
      number: "5,000+",
      label: t('about.statsLabel1'),
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: Clock,
      number: "7j/7",
      label: t('about.statsLabel2'),
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Trophy,
      number: "98%",
      label: t('about.statsLabel3'),
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: Globe,
      number: "95%",
      label: t('about.statsLabel4'),
      color: "from-purple-500 to-pink-500"
    }
  ];

  const values = [
    {
      icon: Heart,
      title: t('about.value1'),
      description: t('about.value1Desc'),
      gradient: "from-rose-500 to-pink-500"
    },
    {
      icon: Target,
      title: t('about.value2'),
      description: t('about.value2Desc'),
      gradient: "from-primary to-primary/80"
    },
    {
      icon: Users,
      title: t('about.value3'),
      description: t('about.value3Desc'),
      gradient: "from-violet-500 to-purple-500"
    }
  ];

  const missionPoints = [
    "Être un soutien réel, là où vous en avez besoin.",
    "Simplifier votre quotidien pour vous permettre de souffler.",
    "Offrir des services personnalisés pour alléger la logistique, la parentalité, les voyages, la maison ou l'administratif."
  ];

  return (
    <section id="about" className="min-h-screen">
      {/* Hero Section - Full Width with Gradient */}
      <div className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        
        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>{t('about.badge')}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              {t('about.title')}
              <span className="block mt-2 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                {t('about.titleHighlight')}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto">
              {t('about.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section - Clean Horizontal Bar */}
      <div className="bg-card border-y border-border">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-all duration-1000 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div key={stat.label} className="text-center group">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-foreground">{stat.number}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Story Section - Modern Split Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          
          {/* Story Header */}
          <div className="max-w-3xl mb-16">
            <div className="flex items-center gap-3 mb-4">
              <Quote className="w-8 h-8 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">Notre Histoire</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t('about.storyTitle')}
            </h2>
          </div>

          {/* Story Content - Timeline Style */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-0 md:left-1/2 transform md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-primary/20 hidden md:block" />
            
            <div className="space-y-12 md:space-y-16">
              {/* Chapter 1 */}
              <div className="md:grid md:grid-cols-2 md:gap-12 items-center">
                <div className="md:text-right md:pr-12">
                  <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 md:p-8 rounded-3xl border border-primary/20">
                    <p className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed">
                      "Je suis maman, et comme beaucoup… j'ai connu la galère."
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center justify-start pl-12">
                  <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-primary/20" />
                </div>
              </div>

              {/* Chapter 2 */}
              <div className="md:grid md:grid-cols-2 md:gap-12 items-center">
                <div className="hidden md:flex items-center justify-end pr-12">
                  <div className="w-4 h-4 rounded-full bg-secondary ring-4 ring-secondary/20" />
                </div>
                <div className="md:pl-12">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    En 2022, à la fin de mes études, j'ai accouché de ma fille. Pas de place en crèche, pas de solution simple, et pourtant il fallait s'organiser. Le papa faisait de son mieux, mais avec son travail, nous étions souvent débordés.
                  </p>
                </div>
              </div>

              {/* Chapter 3 - Challenge */}
              <div className="md:grid md:grid-cols-2 md:gap-12 items-center">
                <div className="md:text-right md:pr-12">
                  <div className="bg-destructive/10 p-6 md:p-8 rounded-3xl border border-destructive/20">
                    <p className="text-lg font-medium text-destructive">
                      Un an plus tard, tout a basculé : dépression, licenciement. J'étais seule, sans aide, sans nounou, sans relais.
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center justify-start pl-12">
                  <div className="w-4 h-4 rounded-full bg-destructive ring-4 ring-destructive/20" />
                </div>
              </div>

              {/* Chapter 4 - Turning Point */}
              <div className="md:grid md:grid-cols-2 md:gap-12 items-center">
                <div className="hidden md:flex items-center justify-end pr-12">
                  <div className="w-4 h-4 rounded-full bg-warning ring-4 ring-warning/20" />
                </div>
                <div className="md:pl-12">
                  <div className="bg-warning/10 p-6 md:p-8 rounded-3xl border border-warning/20">
                    <p className="text-xl font-bold text-foreground">
                      💡 C'est là qu'un déclic est né.
                    </p>
                    <p className="text-muted-foreground mt-3">
                      Un problème commun se dessinait clairement : <strong className="text-foreground">la charge mentale</strong>. Ce poids invisible que chacun porte, parfois en silence.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chapter 5 - Solution */}
              <div className="md:grid md:grid-cols-2 md:gap-12 items-center">
                <div className="md:text-right md:pr-12">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Alors avec mon compagnon, nous avons décidé de créer <strong className="text-primary text-xl">Bikawô</strong>. Un service pensé pour accompagner toutes les vies du quotidien — sans jugement, avec douceur, souplesse et humanité.
                  </p>
                </div>
                <div className="hidden md:flex items-center justify-start pl-12">
                  <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-primary/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section - Full Width Highlight */}
      <div className="bg-gradient-to-r from-primary to-secondary py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Target className="w-6 h-6 text-primary-foreground" />
            <span className="text-primary-foreground/80 uppercase tracking-wider text-sm font-medium">Notre Mission</span>
          </div>
          
          <div className="space-y-6">
            {missionPoints.map((point, index) => (
              <div key={index} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 md:p-5 rounded-2xl text-left">
                <CheckCircle2 className="w-6 h-6 text-primary-foreground flex-shrink-0" />
                <span className="text-lg text-primary-foreground">{point}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-12 space-y-3">
            <p className="text-2xl md:text-3xl font-bold text-primary-foreground">
              Bikawô, c'est plus qu'un service.
            </p>
            <p className="text-xl text-primary-foreground/90">
              C'est une respiration. Un coup de main. Un « je suis là pour toi ».
            </p>
          </div>
        </div>
      </div>

      {/* Values Section - Card Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className={`transition-all duration-1000 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">Nos Valeurs</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
              {t('about.valuesTitle')}
            </h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => {
              const IconComponent = value.icon;
              return (
                <Card 
                  key={value.title} 
                  className="group p-8 hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-card to-card/50 relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${value.gradient}`} />
                  
                  <div className={`w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br ${value.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  
                  <h4 className="font-bold text-xl text-foreground mb-3">
                    {value.title}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section - Clean and Simple */}
      <div className="bg-muted/50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Et si aujourd'hui, c'était votre tour de souffler ?
          </h3>
          <p className="text-muted-foreground mb-8">
            Découvrez nos services et laissez-nous vous accompagner au quotidien.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/services">
              <Button 
                size="lg" 
                className="w-full sm:w-auto px-8 bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg"
              >
                {t('about.ctaServices')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/nous-recrutons">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto px-8 border-2"
              >
                {t('about.ctaJoin')}
                <Heart className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
