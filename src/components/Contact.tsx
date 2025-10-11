import { useState } from "react";
import { Link } from "react-router-dom";
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
  ArrowRight,
  Sparkles,
  CheckCircle,
  Zap
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const contactMethods = [
    {
      icon: Phone,
      title: t('contact.phone'),
      content: "06 09 08 53 90",
      description: t('contact.phoneTime'),
      color: "from-success/80 to-success",
      bgColor: "from-success/5 to-success/10"
    },
    {
      icon: Mail,
      title: t('contact.email'),
      content: "contact@bikawo.com",
      description: t('contact.emailTime'),
      color: "from-info/80 to-info",
      bgColor: "from-info/5 to-info/10"
    },
    {
      icon: MessageSquare,
      title: t('contact.chat'),
      content: t('contact.chatStatus'),
      description: t('contact.chatTime'),
      color: "from-accent/80 to-accent",
      bgColor: "from-accent/5 to-accent/10"
    },
    {
      icon: MapPin,
      title: t('contact.address'),
      content: t('contact.addressDetails'),
      description: t('contact.addressTime'),
      color: "from-warning/80 to-warning",
      bgColor: "from-warning/5 to-warning/10"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulation d'envoi avec delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: t('contact.success'),
      description: t('contact.successMessage'),
    });
    
    // Reset form
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: ""
    });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-8 mb-20 animate-fade-in">
          <div className="relative">
            {/* Floating elements */}
            <div className="absolute -top-10 left-1/4 w-20 h-20 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl animate-pulse" />
            <div className="absolute -top-5 right-1/3 w-16 h-16 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full blur-lg animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }} />
            
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm text-primary px-6 py-3 rounded-full text-sm font-medium border border-primary/20 shadow-lg">
              <Sparkles className="w-5 h-5" />
              <span>{t('contact.badge')}</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mt-6 leading-tight">
              {t('contact.title')}
              <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-pulse">
                {t('contact.titleHighlight')}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mt-6 leading-relaxed">
              {t('contact.subtitle')}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Methods */}
          <div className="space-y-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
              <Zap className="w-7 h-7 text-primary" />
              {t('contact.methodsTitle')}
            </h3>
            
            {contactMethods.map((method, index) => {
              const IconComponent = method.icon;
              return (
                <Card 
                  key={method.title}
                  className="group p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 border-0 bg-card/80 backdrop-blur-sm cursor-pointer relative overflow-hidden"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Background gradient effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${method.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="flex items-center space-x-6 relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xl text-foreground mb-1 group-hover:text-primary transition-colors duration-300">
                        {method.title}
                      </h4>
                      <p className="text-primary font-semibold text-lg mb-1">{method.content}</p>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all duration-300" />
                  </div>
                </Card>
              );
            })}

            {/* Hours */}
            <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 backdrop-blur-sm">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <Clock className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-foreground">{t('contact.hoursTitle')}</h4>
                  <p className="text-muted-foreground">{t('contact.hoursSubtitle')}</p>
                </div>
              </div>
              <div className="space-y-3 text-lg">
                <div className="flex justify-between items-center p-3 bg-card/50 rounded-xl">
                  <span className="text-muted-foreground">{t('contact.weekdays')}</span>
                  <span className="text-foreground font-bold">24h/24</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-card/50 rounded-xl">
                  <span className="text-muted-foreground">{t('contact.weekend')}</span>
                  <span className="text-foreground font-bold">24h/24</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-accent/20 to-primary/20 rounded-xl border border-accent/30">
                  <span className="text-muted-foreground">{t('contact.emergency')}</span>
                  <span className="text-accent font-bold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {t('contact.alwaysAvailable')}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Card className="p-10 border-0 bg-card/90 backdrop-blur-sm shadow-2xl">
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
                    <Send className="w-8 h-8 text-primary" />
                    {t('contact.formTitle')}
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    {t('contact.formSubtitle')}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label htmlFor="civility" className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Star className="w-5 h-5 text-primary" />
                        {t('contact.civility')} *
                      </label>
                      <Select required>
                        <SelectTrigger className="h-14 text-lg border-2 hover:border-primary/50 transition-colors duration-300">
                          <SelectValue placeholder={t('contact.selectCivility')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mr">{t('contact.mr')}</SelectItem>
                          <SelectItem value="mrs">{t('contact.mrs')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label htmlFor="name" className="text-lg font-semibold text-foreground">
                          {t('contact.fullName')} *
                        </label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder={t('contact.yourName')}
                          required
                          className="h-14 text-lg border-2 hover:border-primary/50 focus:border-primary transition-colors duration-300"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <label htmlFor="email" className="text-lg font-semibold text-foreground">
                          {t('contact.emailLabel')} *
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder={t('contact.yourEmail')}
                          required
                          className="h-14 text-lg border-2 hover:border-primary/50 focus:border-primary transition-colors duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="subject" className="text-lg font-semibold text-foreground">
                      {t('contact.subject')} *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder={t('contact.subjectPlaceholder')}
                      required
                      className="h-14 text-lg border-2 hover:border-primary/50 focus:border-primary transition-colors duration-300"
                    />
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="message" className="text-lg font-semibold text-foreground">
                      {t('contact.message')} *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t('contact.messagePlaceholder')}
                      required
                      rows={6}
                      className="resize-none text-lg border-2 hover:border-primary/50 focus:border-primary transition-colors duration-300"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-16 text-xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group relative overflow-hidden"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3" />
                        {t('contact.sending')}
                      </>
                    ) : (
                      <>
                        <Send className="w-6 h-6 mr-3" />
                        {t('contact.send')}
                        <ArrowRight className="w-6 h-6 ml-3 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="flex items-center justify-center space-x-3 text-lg text-muted-foreground bg-gradient-to-r from-primary/5 to-secondary/5 p-6 rounded-2xl border border-primary/20">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  <span>{t('contact.privacy')}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* FAQ CTA */}
        <div className="text-center mt-20 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Card className="p-12 md:p-16 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 backdrop-blur-sm relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-3xl" />
            
            <div className="max-w-4xl mx-auto space-y-8 relative">
              <h3 className="text-3xl md:text-4xl font-bold text-foreground flex items-center justify-center gap-3">
                <MessageSquare className="w-10 h-10 text-primary" />
                {t('contact.faqTitle')}
              </h3>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {t('contact.faqSubtitle')}
              </p>
              <Link to="/aide" className="group inline-block">
                <Button 
                  size="lg"
                  className="px-10 py-4 text-lg bg-card text-primary hover:bg-primary hover:text-primary-foreground border-2 border-primary transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Star className="w-6 h-6 mr-3" />
                  {t('contact.faqButton')}
                  <ArrowRight className="w-6 h-6 ml-3 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Contact;