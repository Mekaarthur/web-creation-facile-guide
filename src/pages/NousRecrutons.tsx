import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  MapPin,
  PawPrint,
  Heart
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NousRecrutons = () => {
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    category: "",
    experience_years: "",
    availability: "",
    motivation: "",
    has_transport: false,
    certifications: ""
  });

  const { toast } = useToast();

  const handleJobApplication = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone || !selectedCategory || !formData.availability || !formData.motivation) {
      toast({
        variant: "destructive",
        title: t('jobs.error'),
        description: t('jobs.errorMessage')
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('job_applications')
        .insert([{
          ...formData,
          category: selectedCategory,
          experience_years: parseInt(formData.experience_years) || 0
        }]);

      if (error) {
        throw error;
      }

      // Envoyer l'email de confirmation automatique
      try {
        await supabase.functions.invoke('send-job-application-confirmation', {
          body: {
            firstName: formData.first_name,
            lastName: formData.last_name,
            email: formData.email,
            category: selectedCategory,
            language: i18n.language
          }
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }

      toast({
        title: t('jobs.success'),
        description: t('jobs.successMessage')
      });

      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        category: "",
        experience_years: "",
        availability: "",
        motivation: "",
        has_transport: false,
        certifications: ""
      });
      setSelectedCategory("");

    } catch (error) {
      console.error('Error submitting job application:', error);
      toast({
        variant: "destructive",
        title: t('jobs.error'),
        description: t('jobs.submitError')
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    {
      id: "bika-kids",
      title: "BIKA Kids",
      description: "Spécialistes enfance et parentalité",
      requirements: ["Expérience garde d'enfants", "Formation premiers secours", "Casier judiciaire vierge"],
      icon: Users,
      color: "bg-blue-500",
      activities: [
        "Garde d'enfants à domicile (0-16 ans)",
        "Accompagnement scolaire et aide aux devoirs",
        "Activités créatives et ludiques",
        "Sorties et accompagnements extérieurs",
        "Baby-sitting ponctuel ou régulier",
        "Préparation des repas adaptés aux enfants",
        "Mise au lit et routines du soir"
      ],
      achievements: [
        "Plus de 2500 familles accompagnées",
        "98% de satisfaction client",
        "Formation continue de nos prestataires",
        "Suivi personnalisé de chaque enfant"
      ]
    },
    {
      id: "bika-maison",
      title: "BIKA Maison", 
      description: "Logisticiens du quotidien",
      requirements: ["Permis recommandé", "Ponctualité exemplaire", "Sens du service", "Casier judiciaire vierge"],
      icon: Shield,
      color: "bg-green-500",
      activities: [
        "Entretien ménager complet",
        "Courses et approvisionnement",
        "Livraisons et récupérations",
        "Petit bricolage et maintenance",
        "Organisation et rangement",
        "Préparation de repas",
        "Gestion du linge"
      ],
      achievements: [
        "Plus de 5000 interventions par mois",
        "Flexibilité 7j/7",
        "Service d'urgence disponible",
        "Équipement professionnel fourni"
      ]
    },
    {
      id: "bika-vie",
      title: "BIKA Vie",
      description: "Concierges administratifs",
      requirements: ["Maîtrise bureautique", "Relationnel client", "Discrétion absolue", "Casier judiciaire vierge"],
      icon: FileCheck,
      color: "bg-purple-500",
      activities: [
        "Gestion administrative et paperasse",
        "Rendez-vous médicaux et administratifs",
        "Démarches officielles et formalités",
        "Gestion des assurances",
        "Organisation d'événements familiaux",
        "Suivi administratif régulier",
        "Assistance numérique"
      ],
      achievements: [
        "Plus de 1000 dossiers traités par mois",
        "Expertise réglementaire",
        "Confidentialité garantie",
        "Gain de temps de 15h/semaine en moyenne"
      ]
    },
    {
      id: "bika-travel",
      title: "BIKA Travel",
      description: "Agents aéroport et travel planners",
      requirements: ["Connaissance aéroportuaire", "Langues étrangères", "Disponibilité horaires variables", "Casier judiciaire vierge"],
      icon: MapPin,
      color: "bg-orange-500",
      activities: [
        "Accompagnement aéroport VIP",
        "Planification de voyages sur mesure",
        "Gestion des transferts",
        "Assistance aux formalités douanières",
        "Réservations et modifications",
        "Service de conciergerie voyage",
        "Assistance multilingue"
      ],
      achievements: [
        "Plus de 3000 voyages organisés",
        "Partenariats avec 50+ compagnies",
        "Service premium 24h/24",
        "Taux de satisfaction 99%"
      ]
    },
    {
      id: "bika-plus",
      title: "BIKA Plus",
      description: "Majordomes et gouvernantes haut de gamme",
      requirements: ["5 ans d'expérience ou Bac+3 en administration", "Références vérifiées", "Polyvalence exceptionnelle", "Casier judiciaire vierge"],
      icon: Award,
      color: "bg-yellow-500",
      activities: [
        "Gestion complète de propriété",
        "Organisation d'événements privés",
        "Coordination des équipes domestiques",
        "Gestion des invités et protocole",
        "Administration familiale complète",
        "Conciergerie de luxe",
        "Service personnalisé 24h/24"
      ],
      achievements: [
        "Clientèle haut de gamme exclusive",
        "Formation aux standards internationaux",
        "Discrétion et professionnalisme absolus",
        "Service sur-mesure garanti"
      ]
    },
    {
      id: "bika-pro",
      title: "BIKA Pro",
      description: "Assistants administratifs / direction",
      requirements: ["Bac avec 2 ans d'expérience", "Expérience corporate", "Confidentialité", "Casier judiciaire vierge"],
      icon: UserCheck,
      color: "bg-red-500",
      activities: [
        "Assistance administrative dirigeants",
        "Gestion d'agenda et planification",
        "Organisation de réunions et événements",
        "Gestion de la correspondance",
        "Suivi des dossiers stratégiques",
        "Interface avec les partenaires",
        "Support aux équipes dirigeantes"
      ],
      achievements: [
        "Plus de 200 dirigeants accompagnés",
        "Expertise métiers spécialisés",
        "Confidentialité niveau corporate",
        "Optimisation productive +30%"
      ]
    },
    {
      id: "bika-animals",
      title: "BIKA Animals",
      description: "Spécialistes soins et garde d'animaux",
      requirements: ["Formation animalière", "Expérience garde animaux", "Patience et douceur", "Casier judiciaire vierge"],
      icon: PawPrint,
      color: "bg-emerald-500",
      activities: [
        "Garde d'animaux à domicile",
        "Promenades et exercices",
        "Soins quotidiens et alimentation",
        "Visites vétérinaires",
        "Pet-sitting pendant les vacances",
        "Éducation et dressage de base",
        "Transport d'animaux"
      ],
      achievements: [
        "Plus de 1500 animaux suivis",
        "Vétérinaires partenaires",
        "Service d'urgence vétérinaire",
        "Bien-être animal garanti"
      ]
    },
    {
      id: "bika-seniors",
      title: "BIKA Personnes âgées",
      description: "Accompagnants seniors et aide à domicile",
      requirements: ["Formation gériatrie ou aide à la personne", "Empathie et bienveillance", "Casier judiciaire vierge"],
      icon: Heart,
      color: "bg-rose-500",
      activities: [
        "Aide à la vie quotidienne",
        "Accompagnement médical",
        "Soutien moral et social",
        "Aide aux repas et à l'hygiène",
        "Sorties et activités",
        "Médiation familiale",
        "Veille et sécurité"
      ],
      achievements: [
        "Plus de 800 seniors accompagnés",
        "Formation spécialisée continue",
        "Partenariat avec structures médicales",
        "Maintien à domicile favorisé"
      ]
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
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="font-medium text-foreground mb-2">Prérequis :</p>
                          {category.requirements.slice(0, 2).map((req, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-accent" />
                              <span className="text-sm text-muted-foreground">{req}</span>
                            </div>
                          ))}
                          {category.requirements.length > 2 && (
                            <p className="text-xs text-muted-foreground">+{category.requirements.length - 2} autres prérequis</p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              setSelectedCategoryDetail(category);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            Découvrir plus
                          </Button>
                          <Button 
                            variant="hero" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              setSelectedCategory(category.id);
                              const element = document.getElementById('formulaire-candidature');
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                          >
                            Candidater
                          </Button>
                        </div>
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
                  <Input 
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    placeholder="Votre prénom" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nom</label>
                  <Input 
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    placeholder="Votre nom" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <Input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="votre.email@exemple.com" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Téléphone</label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="06 12 34 56 78" 
                />
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
                <label className="block text-sm font-medium text-foreground mb-2">Années d'expérience</label>
                <Input 
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                  placeholder="Ex: 3"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Disponibilités</label>
                <Textarea 
                  value={formData.availability}
                  onChange={(e) => setFormData({...formData, availability: e.target.value})}
                  placeholder="Indiquez vos créneaux de disponibilité..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Motivation</label>
                <Textarea 
                  value={formData.motivation}
                  onChange={(e) => setFormData({...formData, motivation: e.target.value})}
                  placeholder="Pourquoi souhaitez-vous rejoindre notre équipe ?"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Certifications</label>
                <Textarea 
                  value={formData.certifications}
                  onChange={(e) => setFormData({...formData, certifications: e.target.value})}
                  placeholder="Listez vos certifications, formations, diplômes..."
                  rows={2}
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
              
              <Button 
                variant="hero" 
                className="w-full" 
                size="lg"
                onClick={handleJobApplication}
                disabled={loading}
              >
                {loading ? "Envoi en cours..." : "Envoyer ma candidature"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
      
      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedCategoryDetail && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 ${selectedCategoryDetail.color} rounded-lg flex items-center justify-center`}>
                    <selectedCategoryDetail.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">{selectedCategoryDetail.title}</DialogTitle>
                    <p className="text-muted-foreground">{selectedCategoryDetail.description}</p>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Activities Section */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">Activités réalisées</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedCategoryDetail.activities.map((activity: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{activity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Achievements Section */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">Nos réalisations</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedCategoryDetail.achievements.map((achievement: string, index: number) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-2">
                            <Star className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-foreground">{achievement}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Requirements Section */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">Prérequis complets</h3>
                  <div className="space-y-2">
                    {selectedCategoryDetail.requirements.map((req: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                  <Button 
                    variant="hero" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedCategory(selectedCategoryDetail.id);
                      setIsDetailModalOpen(false);
                      setTimeout(() => {
                        const element = document.getElementById('formulaire-candidature');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }, 100);
                    }}
                  >
                    Candidater pour ce poste
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setIsDetailModalOpen(false)}>
                    Fermer
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NousRecrutons;