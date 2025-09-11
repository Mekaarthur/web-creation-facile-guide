import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import ServiceSubgrid from "@/components/ServiceSubgrid";
import ServicePageLayout from "@/components/ServicePageLayout";
import { Plane, MapPin, Luggage } from "lucide-react";
import serviceTravelImage from "@/assets/service-travel.jpg";

const BikaTravel = () => {
  const benefits = [
    {
      icon: <Plane className="w-10 h-10 text-white" />,
      title: "On est expert",
      description: "Spécialistes du voyage avec connaissance approfondie des destinations et procédures.",
      bgGradient: "bg-gradient-to-br from-sky-50 to-blue-100",
      iconGradient: "bg-gradient-to-r from-sky-500 to-blue-600"
    },
    {
      icon: <MapPin className="w-10 h-10 text-white" />,
      title: "On est organisé",
      description: "Planification méticuleuse de vos voyages, rien n'est laissé au hasard.",
      bgGradient: "bg-gradient-to-br from-emerald-50 to-green-100",
      iconGradient: "bg-gradient-to-r from-emerald-500 to-green-600"
    },
    {
      icon: <Luggage className="w-10 h-10 text-white" />,
      title: "On est pratique",
      description: "Accompagnement personnalisé : réservations, formalités, conseils voyage.",
      bgGradient: "bg-gradient-to-br from-orange-50 to-amber-100",
      iconGradient: "bg-gradient-to-r from-orange-500 to-amber-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <ServicePageLayout
        title="Assistance voyage"
        subtitle="Accompagnement et organisation de voyages"
        rating={5}
        reviewCount="450+ avis vérifiés"
        price="Dès 40€/h"
        discountPrice="20€/h"
        heroImage={serviceTravelImage}
        heroImageAlt="Services voyage Bika Travel"
        keyPoints={[
          "Experts en organisation de voyages",
          "Accompagnement aéroport inclus",
          "Formalités administratives simplifiées"
        ]}
        primaryCTA="Planifier mon voyage"
        secondaryCTA="Devenir assistant voyage"
        benefits={benefits}
        heroGradient="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700"
      >
        <ServiceSubgrid categoryKey="travel" />
      </ServicePageLayout>
      
      <Footer />
      <ChatBot />
    </div>
  );
};

export default BikaTravel;