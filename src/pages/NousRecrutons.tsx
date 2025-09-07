import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp,
  Clock,
  Euro,
  Shield,
  Star,
  CheckCircle,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Users,
  Award,
  Zap,
  Target,
  ArrowRight
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NousRecrutons = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    services: [] as string[],
    experience: "",
    motivation: "",
    availability: ""
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone || !formData.motivation || formData.services.length === 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          category: formData.services.join(', '),
          experience_years: parseInt(formData.experience) || 0,
          availability: formData.availability,
          motivation: formData.motivation,
          status: 'pending'
        });

      if (error) throw error;

      // Envoyer email de confirmation
      try {
        await supabase.functions.invoke('send-job-application-confirmation', {
          body: {
            firstName: formData.first_name,
            lastName: formData.last_name,
            email: formData.email,
            category: formData.services.join(', '),
            language: 'fr'
          }
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }

      toast({
        title: "Candidature envoyée !",
        description: "Nous vous recontacterons sous 48h"
      });

      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        services: [],
        experience: "",
        motivation: "",
        availability: ""
      });

    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const services = [
    "Garde d'enfants & baby-sitting",
    "Ménage & entretien à domicile", 
    "Courses & livraisons",
    "Aide administrative & conciergerie",
    "Bricolage & petites réparations",
    "Jardinage & espaces verts",
    "Aide aux personnes âgées",
    "Garde d'animaux",
    "Assistance voyage & aéroport",
    "Services haut de gamme"
  ];

  const advantages = [
    {
      icon: TrendingUp,
      title: "Revenus attractifs",
      description: "Jusqu'à 25€/h selon votre expertise",
      highlight: "25€/h"
    },
    {
      icon: Clock,
      title: "Flexibilité totale",
      description: "Vous choisissez vos horaires et missions",
      highlight: "100% flexible"
    },
    {
      icon: Users,
      title: "Clients vérifiés",
      description: "Profils contrôlés, paiements sécurisés",
      highlight: "Sécurisé"
    },
    {
      icon: Shield,
      title: "Protection complète",
      description: "Assurance responsabilité civile incluse",
      highlight: "Assuré"
    }
  ];

  const testimonials = [
    {
      name: "Marie L.",
      service: "Garde d'enfants",
      text: "Grâce à Bikawo, j'ai trouvé des familles formidables. Les paiements sont ponctuels et l'équipe très réactive.",
      rating: 5,
      earnings: "1,800€/mois"
    },
    {
      name: "Thomas B.",
      service: "Bricolage & jardinage",
      text: "Je manage mon planning comme je veux. Les clients sont sérieux et respectueux de mon travail.",
      rating: 5,
      earnings: "2,200€/mois"
    },
    {
      name: "Sophie M.",
      service: "Ménage & courses",
      text: "Une vraie liberté ! Je travaille dans mon quartier avec des clients fidèles depuis 2 ans.",
      rating: 5,
      earnings: "1,650€/mois"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Inscription gratuite",
      description: "Créez votre profil en 5 minutes",
      icon: Target
    },
    {
      number: "02", 
      title: "Vérifications",
      description: "Validation de votre identité et références",
      icon: Shield
    },
    {
      number: "03",
      title: "Formation express",
      description: "Découverte de la plateforme et outils",
      icon: Zap
    },
    {
      number: "04",
      title: "Première mission",
      description: "Recevez vos premières demandes clients",
      icon: Award
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Star className="w-4 h-4" />
                Nouveau : Jusqu'à 25€/h
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
                Devenez 
                <span className="bg-gradient-primary bg-clip-text text-transparent"> auto-entrepreneur </span>
                avec Bikawo
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-xl">
                Rejoignez +5000 professionnels qui développent leur activité en toute liberté. 
                Fixez vos tarifs, choisissez vos clients, gérez votre planning.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="xl" 
                  className="group"
                  onClick={() => {
                    document.getElementById('inscription')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Commencer maintenant
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="xl">
                  <Phone className="w-5 h-5 mr-2" />
                  01 85 08 24 42
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {advantages.map((advantage, index) => (
                <Card key={index} className="p-6 hover:shadow-soft transition-all duration-300">
                  <advantage.icon className="w-8 h-8 text-primary mb-4" />
                  <div className="text-2xl font-bold text-primary mb-2">{advantage.highlight}</div>
                  <div className="font-semibold text-foreground mb-1">{advantage.title}</div>
                  <div className="text-sm text-muted-foreground">{advantage.description}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ils ont rejoint Bikawo
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Découvrez l'expérience de nos partenaires qui ont développé leur activité d'auto-entrepreneur
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-muted-foreground mb-4">
                  "{testimonial.text}"
                </blockquote>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.service}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{testimonial.earnings}</div>
                    <div className="text-xs text-muted-foreground">revenus moyens</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Comment rejoindre Bikawo ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Un processus simple et rapide pour commencer à gagner de l'argent dès cette semaine
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-white text-sm font-bold px-3 py-1 rounded-full">
                    {step.number}
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulaire d'inscription */}
      <section id="inscription" className="py-16 bg-muted/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Rejoignez-nous maintenant
            </h2>
            <p className="text-muted-foreground">
              Inscription gratuite et sans engagement. Commencez à recevoir vos premières missions sous 48h.
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Prénom *
                  </label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Votre prénom"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nom *
                  </label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Téléphone *
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="06 12 34 56 78"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-4">
                  Services proposés * (sélectionnez plusieurs choix)
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  {services.map((service) => (
                    <div
                      key={service}
                      onClick={() => toggleService(service)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.services.includes(service)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`w-4 h-4 ${
                          formData.services.includes(service) ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <span className="text-sm">{service}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Expérience
                  </label>
                  <Select value={formData.experience} onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Années d'expérience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Débutant</SelectItem>
                      <SelectItem value="1">1-2 ans</SelectItem>
                      <SelectItem value="3">3-5 ans</SelectItem>
                      <SelectItem value="6">5+ ans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Disponibilité
                  </label>
                  <Select value={formData.availability} onValueChange={(value) => setFormData(prev => ({ ...prev, availability: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Votre disponibilité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temps-plein">Temps plein</SelectItem>
                      <SelectItem value="temps-partiel">Temps partiel</SelectItem>
                      <SelectItem value="weekends">Week-ends uniquement</SelectItem>
                      <SelectItem value="ponctuel">Ponctuellement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Motivation *
                </label>
                <Textarea
                  value={formData.motivation}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
                  placeholder="Parlez-nous de votre motivation à rejoindre Bikawo..."
                  rows={4}
                  required
                />
              </div>

              <div className="text-center">
                <Button 
                  type="submit" 
                  size="xl" 
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? "Envoi en cours..." : "Envoyer ma candidature"}
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  En vous inscrivant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
                </p>
              </div>
            </form>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NousRecrutons;