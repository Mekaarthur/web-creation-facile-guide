import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import ServiceSubgrid from "@/components/ServiceSubgrid";
import ServicePageLayout from "@/components/ServicePageLayout";
import { Shield, Heart, Calendar } from "lucide-react";
import serviceKidsImage from "@/assets/service-kids.jpg";
import { useTranslation } from "react-i18next";

const BikaKids = () => {
  const { t } = useTranslation();
  
  const benefits = [
    {
      icon: <Shield className="w-10 h-10 text-white" />,
      title: t('bikaKids.benefits.0.title'),
      description: t('bikaKids.benefits.0.description'),
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-primary"
    },
    {
      icon: <Heart className="w-10 h-10 text-white" />,
      title: t('bikaKids.benefits.1.title'),
      description: t('bikaKids.benefits.1.description'),
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-accent"
    },
    {
      icon: <Calendar className="w-10 h-10 text-white" />,
      title: t('bikaKids.benefits.2.title'),
      description: t('bikaKids.benefits.2.description'),
      bgGradient: "bg-gradient-subtle",
      iconGradient: "bg-gradient-primary"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <ServicePageLayout
        title={t('bikaKids.title')}
        subtitle={t('bikaKids.subtitle')}
        rating={5}
        reviewCount="1 800+ avis vérifiés"
        price="Dès 25€/h"
        discountPrice="12,50€/h"
        heroImage={serviceKidsImage}
        heroImageAlt="Service garde d'enfants Bika Kids"
        keyPoints={t('bikaKids.keyPoints', { returnObjects: true }) as string[]}
        primaryCTA={t('bikaKids.primaryCTA')}
        secondaryCTA={t('bikaKids.secondaryCTA')}
        benefits={benefits}
        heroGradient="bg-gradient-hero"
      >
        <ServiceSubgrid categoryKey="kids" />
      </ServicePageLayout>
      
      <Footer />
      <ChatBot />
    </div>
  );
};

export default BikaKids;