import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import ServiceSubgrid from "@/components/ServiceSubgrid";
import ServicePageLayout from "@/components/ServicePageLayout";
import { Heart, Shield, Clock } from "lucide-react";
import serviceSeniorsImage from "@/assets/service-seniors.jpg";

const BikaSeniors = () => {
  const benefits = [
    {
      icon: <Heart className="w-10 h-10 text-white" />,
      title: "On est attentionné",
      description: "Accompagnement personnalisé avec bienveillance et respect de la dignité de nos aînés.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-accent"
    },
    {
      icon: <Shield className="w-10 h-10 text-white" />,
      title: "On est professionnel",
      description: "Intervenants qualifiés, expérimentés et formés aux besoins spécifiques des seniors.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-primary"
    },
    {
      icon: <Clock className="w-10 h-10 text-white" />,
      title: "On est disponible",
      description: "Services d'aide à domicile adaptés à tous les rythmes de vie et besoins quotidiens.",
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-hero"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <ServicePageLayout
        title="Aide aux seniors à domicile"
        subtitle="Accompagnement bienveillant pour nos aînés"
        rating={5}
        reviewCount="1 200+ avis vérifiés"
        price="Dès 20€/h"
        discountPrice="10€/h"
        heroImage={serviceSeniorsImage}
        heroImageAlt="Service aide seniors Bika Seniors"
        keyPoints={[
          "Accompagnants expérimentés et formés",
          "Aide quotidienne personnalisée",
          "Maintien à domicile en toute sécurité"
        ]}
        primaryCTA="Réserver une aide"
        secondaryCTA="Devenir accompagnant"
        benefits={benefits}
        heroGradient="bg-gradient-hero"
      >
        <ServiceSubgrid categoryKey="seniors" />
      </ServicePageLayout>
      
      <Footer />
      <ChatBot />
    </div>
  );
};

export default BikaSeniors;