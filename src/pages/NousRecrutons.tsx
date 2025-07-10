import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Shield, 
  Star, 
  CheckCircle, 
  FileCheck, 
  UserCheck, 
  Award,
  MessageCircle,
  Clock,
  MapPin
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NousRecrutons = () => {
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = [
    {
      id: "assist-kids",
      title: "Assist'Kids",
      description: "Spécialistes enfance et parentalité",
      requirements: ["Expérience garde d'enfants", "Formation premiers secours", "Casier judiciaire vierge"],
      icon: Users,
      color: "bg-blue-500"
    },
    {
      id: "assist-maison",
      title: "Assist'Maison", 
      description: "Logisticiens du quotidien",
      requirements: ["Permis de conduire", "Ponctualité exemplaire", "Sens du service"],
      icon: Shield,
      color: "bg-green-500"
    },
    {
      id: "assist-vie",
      title: "Assist'Vie",
      description: "Concierges administratifs",
      requirements: ["Maîtrise bureautique", "Relationnel client", "Discrétion absolue"],
      icon: FileCheck,
      color: "bg-purple-500"
    },
    {
      id: "assist-travel",
      title: "Assist'Travel",
      description: "Agents aéroport et travel planners",
      requirements: ["Connaissance aéroportuaire", "Langues étrangères", "Disponibilité horaires variables"],
      icon: MapPin,
      color: "bg-orange-500"
    },
    {
      id: "assist-plus",
      title: "Assist'Plus",
      description: "Majordomes et gouvernantes haut de gamme",
      requirements: ["10+ ans expérience", "Références vérifiées", "Polyvalence exceptionnelle"],
      icon: Award,
      color: "bg-yellow-500"
    },
    {
      id: "assist-pro",
      title: "Assist'Pro",
      description: "Assistants administratifs / direction",
      requirements: ["Bac+3 minimum", "Expérience corporate", "Confidentialité"],
      icon: UserCheck,
      color: "bg-red-500"
    }
  ];

  const processSteps = [
    {
      step: 1,
      title: "Candidature en ligne",
      description: "Remplissez notre formulaire détaillé",
      icon: MessageCircle
    },
    {
      step: 2,
      title: "Vérification du profil",
      description: "Contrôle d'identité, références et pièces justificatives",
      icon: Shield
    },
    {
      step: 3,
      title: "Formation Assist'mw",
      description: "Formation aux méthodes et outils de la plateforme",
      icon: Star
    },
    {
      step: 4,
      title: "Matching clients",
      description: "Attribution automatisée selon profils et disponibilités",
      icon: Users
    }
  ];

  const indicators = [
    {
      title: "Taux de fiabilité",
      description: "Basé sur la ponctualité et la qualité des prestations",
      value: "95%"
    },
    {
      title: "Score d'assiduité",
      description: "Régularité et respect des engagements",
      value: "4.8/5"
    },
    {
      title: "Évaluations clients",
      description: "Moyenne des notes attribuées par les familles",
      value: "4.9/5"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Rejoignez notre réseau de 
              <span className="bg-gradient-primary bg-clip-text text-transparent"> prestataires</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Devenez partenaire Assist'mw et accompagnez les familles de toute la France 
              dans leur quotidien avec flexibilité et autonomie
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="hero" 
                size="xl"
                onClick={() => {
                  const element = document.getElementById('formulaire-candidature');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Postuler maintenant
              </Button>
              <Button variant="outline" size="xl">
                En savoir plus
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Nos catégories de prestataires
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Card key={category.id} className="hover:shadow-soft transition-all duration-300 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <CardTitle className="text-xl">{category.title}</CardTitle>
                      </div>
                      <p className="text-muted-foreground">{category.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-medium text-foreground mb-2">Prérequis :</p>
                        {category.requirements.map((req, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-accent" />
                            <span className="text-sm text-muted-foreground">{req}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Process */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Processus de recrutement
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSteps.map((step) => {
                const IconComponent = step.icon;
                return (
                  <Card key={step.step} className="text-center">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold">{step.step}</span>
                      </div>
                      <IconComponent className="w-8 h-8 text-primary mx-auto mb-3" />
                      <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Indicators */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Nos indicateurs de performance
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {indicators.map((indicator, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="text-4xl font-bold text-primary mb-2">{indicator.value}</div>
                    <h3 className="font-semibold text-foreground mb-2">{indicator.title}</h3>
                    <p className="text-sm text-muted-foreground">{indicator.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Application Form */}
          <Card id="formulaire-candidature" className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Formulaire de candidature</CardTitle>
              <p className="text-center text-muted-foreground">
                Remplissez ce formulaire pour rejoindre notre équipe de prestataires
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Prénom</label>
                  <Input placeholder="Votre prénom" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nom</label>
                  <Input placeholder="Votre nom" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <Input type="email" placeholder="votre.email@exemple.com" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Téléphone</label>
                <Input placeholder="06 12 34 56 78" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Catégorie souhaitée</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisissez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.title} - {category.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Expérience</label>
                <Textarea 
                  placeholder="Décrivez votre expérience pertinente pour cette catégorie..."
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Disponibilités</label>
                <Textarea 
                  placeholder="Indiquez vos créneaux de disponibilité..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">CV (PDF)</label>
                <Input 
                  type="file" 
                  accept=".pdf"
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent-foreground hover:file:bg-accent/80"
                />
                <p className="text-xs text-muted-foreground mt-1">Format PDF uniquement, taille maximale 5 Mo</p>
              </div>
              
              <Button variant="hero" className="w-full" size="lg">
                Envoyer ma candidature
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NousRecrutons;