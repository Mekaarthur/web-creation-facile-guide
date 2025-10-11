import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import ServiceSubgrid from "@/components/ServiceSubgrid";
import ServicePageLayout from "@/components/ServicePageLayout";
import { Briefcase, TrendingUp, Users } from "lucide-react";
import serviceBusinessImage from "@/assets/service-business.jpg";

const BikaPro = () => {
  const benefits = [
    {
      icon: <Briefcase className="w-10 h-10 text-white" />,
      title: "On est professionnel",
      description: "Assistants expérimentés dans l'administration et la gestion d'entreprise.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-primary"
    },
    {
      icon: <TrendingUp className="w-10 h-10 text-white" />,
      title: "On est efficace",
      description: "Optimisation de vos processus administratifs pour gagner en productivité.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-accent"
    },
    {
      icon: <Users className="w-10 h-10 text-white" />,
      title: "On est adaptable",
      description: "Solutions sur-mesure pour répondre aux besoins spécifiques de votre entreprise.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-hero"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <ServicePageLayout
        title="Services aux professionnels"
        subtitle="Assistance administrative pour entreprises"
        rating={5}
        reviewCount="600+ avis vérifiés"
        price="Dès 35€/h"
        discountPrice="17,50€/h"
        heroImage={serviceBusinessImage}
        heroImageAlt="Services professionnels Bika Pro"
        keyPoints={[
          "Assistants qualifiés en gestion",
          "Support administratif complet",
          "Solutions adaptées aux PME"
        ]}
        primaryCTA="Demander un devis"
        secondaryCTA="Devenir assistant"
        benefits={benefits}
        heroGradient="bg-gradient-hero"
      >
        <ServiceSubgrid categoryKey="pro" />
      </ServicePageLayout>
      
      <Footer />
      <ChatBot />
    </div>
  );
};

export default BikaPro;