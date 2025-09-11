import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import ServiceSubgrid from "@/components/ServiceSubgrid";
import ServicePageLayout from "@/components/ServicePageLayout";
import { Shield, Heart, Calendar } from "lucide-react";
import serviceKidsImage from "@/assets/service-kids.jpg";

const BikaKids = () => {
  const benefits = [
    {
      icon: <Shield className="w-10 h-10 text-white" />,
      title: "On est sécurisé",
      description: "Gardes d'enfants vérifiés, expérimentés et bienveillants. Sécurité et bien-être garantis pour vos petits.",
      bgGradient: "bg-gradient-to-br from-blue-50 to-indigo-100",
      iconGradient: "bg-gradient-to-r from-blue-500 to-indigo-600"
    },
    {
      icon: <Heart className="w-10 h-10 text-white" />,
      title: "On est bienveillant",
      description: "Approche éducative personnalisée selon l'âge et les besoins spécifiques de vos enfants.",
      bgGradient: "bg-gradient-to-br from-purple-50 to-pink-100",
      iconGradient: "bg-gradient-to-r from-purple-500 to-pink-600"
    },
    {
      icon: <Calendar className="w-10 h-10 text-white" />,
      title: "On est flexible",
      description: "Garde ponctuelle, régulière, d'urgence. Nous nous adaptons parfaitement à vos besoins familiaux.",
      bgGradient: "bg-gradient-to-br from-green-50 to-emerald-100",
      iconGradient: "bg-gradient-to-r from-green-500 to-emerald-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <ServicePageLayout
        title="Garde d'enfants à domicile"
        subtitle="Des nounous expertes pour vos enfants"
        rating={5}
        reviewCount="1 800+ avis vérifiés"
        price="Dès 25€/h"
        discountPrice="12,50€/h"
        heroImage={serviceKidsImage}
        heroImageAlt="Service garde d'enfants Bika Kids"
        keyPoints={[
          "Garde d'enfants experts et sélectionnés",
          "Sécurisé, bienveillant, éducatif",
          "Paris & Île-de-France (91, 92, 93, 94, 95, 78)"
        ]}
        primaryCTA="Réserver ma garde"
        secondaryCTA="Devenir garde d'enfants"
        benefits={benefits}
        heroGradient="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700"
      >
        <ServiceSubgrid categoryKey="kids" />
      </ServicePageLayout>
      
      <Footer />
      <ChatBot />
    </div>
  );
};

export default BikaKids;