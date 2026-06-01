import Navbar from "@/components/Navbar";
import ServicesGrid from "@/components/ServicesGrid";
import ServicesPackages from "@/components/ServicesPackages";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import SEOComponent from "@/components/SEOComponent";
import { useTranslation } from 'react-i18next';

const ServicesPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <SEOComponent 
        title="Services Bikawo - Tous nos services"
        description="Garde d'enfants, aide seniors, ménage, courses, animaux : tous les services Bikawo en Île-de-France. SAP déclaré, prestataires vérifiés. Crédit d'impôt 50% sur chaque prestation."
        keywords="services à domicile Île-de-France, garde enfants, aide seniors, ménage à domicile, SAP déclaré, crédit d'impôt"
      />
      <Navbar />
      <div className="pt-16 lg:pt-20 bg-background">
        {/* Header de la section */}
        <div className="text-center space-y-4 py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              {t('services.title')}
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                {t('services.titleHighlight')}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('services.subtitle')}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ServicesGrid />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ServicesPackages />
        </div>
      </div>
      
      
      <Footer />
      <ChatBot />
    </div>
  );
};

export default ServicesPage;