import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  MessageSquare,
  Send,
  Star,
  ArrowRight
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const { toast } = useToast();

  const contactMethods = [
    {
      icon: Phone,
      title: "Téléphone",
      content: "+33 1 23 45 67 89",
      description: "Lun-Dim, 24h/24",
      color: "primary"
    },
    {
      icon: Mail,
      title: "Email",
      content: "contact@bikawo.com",
      description: "Réponse sous 1h",
      color: "accent"
    },
    {
      icon: MessageSquare,
      title: "Chat en direct",
      content: "Disponible maintenant",
      description: "Réponse immédiate",
      color: "primary"
    },
    {
      icon: MapPin,
      title: "Adresse",
      content: "123 Rue de la Tech, Paris",
      description: "Rendez-vous sur demande",
      color: "accent"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulation d'envoi
    toast({
      title: "Message envoyé !",
      description: "Nous vous répondrons dans les plus brefs délais.",
    });
    
    // Reset form
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: ""
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-fade-in-up">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Star className="w-4 h-4" />
            <span>Contact</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Besoin d'aide ?
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              Contactez-nous
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Notre équipe d'experts est disponible 24h/24 pour répondre à toutes vos questions 
            et vous accompagner dans vos projets.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Methods */}
          <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-xl font-semibold text-foreground mb-6">
              Plusieurs façons de nous joindre
            </h3>
            
            {contactMethods.map((method, index) => {
              const IconComponent = method.icon;
              return (
                <Card 
                  key={method.title}
                  className="p-6 hover:shadow-glow transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg ${
                      method.color === 'primary' ? 'bg-gradient-primary' : 'bg-gradient-accent'
                    } flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{method.title}</h4>
                      <p className="text-primary font-medium">{method.content}</p>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </Card>
              );
            })}

            {/* Hours */}
            <Card className="p-6 bg-gradient-subtle">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Heures d'ouverture</h4>
                  <p className="text-sm text-muted-foreground">Support disponible</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lundi - Vendredi</span>
                  <span className="text-foreground font-medium">24h/24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weekend</span>
                  <span className="text-foreground font-medium">24h/24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Urgences</span>
                  <span className="text-accent font-medium">Toujours disponible</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Card className="p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Envoyez-nous un message
                  </h3>
                  <p className="text-muted-foreground">
                    Remplissez le formulaire ci-dessous et nous vous répondrons rapidement.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="civility" className="text-sm font-medium text-foreground">
                        Civilité *
                      </label>
                      <Select required>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Sélectionnez votre civilité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mr">Monsieur</SelectItem>
                          <SelectItem value="mrs">Madame</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-foreground">
                          Nom complet *
                        </label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Votre nom"
                          required
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-foreground">
                          Email *
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="votre@email.com"
                          required
                          className="h-12"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-foreground">
                      Sujet *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="De quoi voulez-vous parler ?"
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-foreground">
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Décrivez votre demande en détail..."
                      required
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full group">
                    <Send className="w-5 h-5 mr-2" />
                    Envoyer le message
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </form>

                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span>Nous respectons votre vie privée et ne partageons jamais vos données</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* FAQ CTA */}
        <div className="text-center mt-16 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <Card className="p-8 md:p-12 bg-gradient-subtle">
            <div className="max-w-3xl mx-auto space-y-6">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                Questions fréquentes
              </h3>
              <p className="text-muted-foreground">
                Avant de nous contacter, consultez notre FAQ. 
                Vous y trouverez peut-être déjà la réponse à votre question.
              </p>
              <Button variant="outline" size="lg">
                Consulter la FAQ
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Contact;