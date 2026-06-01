import SEOComponent from "@/components/SEOComponent";
import { generateServiceStructuredData } from "@/utils/seoData";
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
      <SEOComponent
        title="Aide à domicile seniors Paris & Île-de-France | Bikawo"
        description="Accompagnement, courses, compagnie et démarches admin pour vos aînés. Intervenants qualifiés, organisme SAP déclaré. Crédit d'impôt 50% immédiat."
        keywords="aide à domicile seniors Paris, accompagnement personnes âgées, maintien à domicile, Île-de-France"
        url="/bika-seniors"
        structuredData={generateServiceStructuredData({
          name: "Aide à domicile seniors — BikaSeniors",
          description: "Accompagnement, courses et démarches administratives pour personnes âgées en Île-de-France.",
          url: "/bika-seniors",
          priceFrom: "30",
          priceAfterTax: "15€/h"
        })}
      />
      <Navbar />

      <ServicePageLayout
        title="Aide aux seniors à domicile"
        subtitle="Accompagnement bienveillant pour nos aînés"
        rating={5}
        reviewCount="1 200+ avis vérifiés"
        price="Dès 30€/h"
        discountPrice="15€/h"
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