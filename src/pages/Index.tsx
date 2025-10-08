import Navbar from "@/components/Navbar";
import NewHero from "@/components/NewHero";
import ServicesGrid from "@/components/ServicesGrid";
import WhyBikawo from "@/components/WhyBikawo";
import TestimonialsSection from "@/components/TestimonialsSection";
import FinalCTABiface from "@/components/FinalCTABiface";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import SEOComponent from "@/components/SEOComponent";
import SEOOptimization from "@/components/SEOOptimization";
import TrackingManager from "@/components/TrackingManager";
import RetargetingPixels from "@/components/RetargetingPixels";
import GoogleSuggestOptimizer from "@/components/GoogleSuggestOptimizer";
import { seoStructuredData } from "@/utils/seoData";
import { useTranslation } from 'react-i18next';

const Index = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      {/* SEO and Analytics */}
      <SEOOptimization 
        title="Bikawo - Débordé(e) par le quotidien ? | Assistant Personnel Paris"
        description="★ Déléguer vos missions quotidiennes n'a jamais été aussi simple ! Garde enfants, aide seniors, courses, démarches admin. La charge mentale en moins, la sérénité en plus."
        keywords="débordé quotidien, déléguer missions, charge mentale, assistant personnel Paris, services domicile, garde enfants, aide seniors, sérénité famille"
      />
      <GoogleSuggestOptimizer />
      <TrackingManager />
      <RetargetingPixels 
        userType="visitor"
        serviceInterest={["delegation-taches", "charge-mentale", "aide-quotidienne"]}
      />
      <SEOComponent 
        title="Bikawo - La charge mentale en moins, la sérénité en plus"
        description="Créé par une maman qui comprend. Bikawo vous libère de la charge mentale avec des services combinés : garde enfants, aide seniors, courses, démarches admin. Votre assistant personnel au quotidien."
        keywords="charge mentale, délégation tâches, assistant personnel, maman entrepreneur, services famille, sérénité quotidien, aide domicile"
        structuredData={seoStructuredData.organization}
      />
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-sm bg-background/80 border-b border-border/40">
        <Navbar />
      </header>
      
      {/* Main Content */}
      <main className="w-full">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <NewHero />
        </section>
        
        {/* Services Section */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                {t('services.title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('services.subtitle')}
              </p>
            </div>
            <ServicesGrid />
          </div>
        </section>
        
        {/* Why Choose Us Section */}
        <section className="py-16 lg:py-24 bg-background">
          <WhyBikawo />
        </section>
        
        {/* Testimonials Section */}
        <section className="py-16 lg:py-24 bg-muted/20">
          <TestimonialsSection />
        </section>
        
        {/* Call to Action Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <FinalCTABiface />
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-muted/50">
        <Footer />
      </footer>
      
      {/* Chat Bot */}
      <ChatBot />
    </div>
  );
};

export default Index;
