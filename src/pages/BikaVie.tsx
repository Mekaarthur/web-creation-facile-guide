import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import ServiceSubgrid from "@/components/ServiceSubgrid";
import ServicePageLayout from "@/components/ServicePageLayout";
import { Calendar, FileText, Users } from "lucide-react";
import serviceVieImage from "@/assets/service-vie-full.jpg";

const BikaVie = () => {
  const benefits = [
    {
      icon: <Calendar className="w-10 h-10 text-white" />,
      title: "On est organisé",
      description: "Gestion complète de votre agenda et planification de vos événements personnels.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-accent"
    },
    {
      icon: <FileText className="w-10 h-10 text-white" />,
      title: "On est minutieux",
      description: "Démarches administratives effectuées avec précision et dans les délais.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-primary"
    },
    {
      icon: <Users className="w-10 h-10 text-white" />,
      title: "On est personnel",
      description: "Service sur-mesure adapté à votre style de vie et vos priorités personnelles.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-hero"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <ServicePageLayout
        title="Assistant personnel"
        subtitle="Gestion de votre vie quotidienne"
        rating={5}
        reviewCount="800+ avis vérifiés"
        price="Dès 30€/h"
        discountPrice="15€/h"
        heroImage={serviceVieImage}
        heroImageAlt="Assistant personnel Bika Vie"
        keyPoints={[
          "Gestion agenda et événements",
          "Démarches administratives",
          "Organisation vie quotidienne"
        ]}
        primaryCTA="Réserver un assistant"
        secondaryCTA="Devenir assistant personnel"
        benefits={benefits}
        heroGradient="bg-gradient-hero"
      >
        <ServiceSubgrid categoryKey="vie" />
      </ServicePageLayout>
      
      <Footer />
      <ChatBot />
    </div>
  );
};

export default BikaVie;