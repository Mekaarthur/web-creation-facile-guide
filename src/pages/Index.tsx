import { lazy, Suspense } from 'react';
import Navbar from "@/components/Navbar";
import NewHero from "@/components/NewHero";
import SEOComponent from "@/components/SEOComponent";
import SEOOptimization from "@/components/SEOOptimization";
import { seoStructuredData } from "@/utils/seoData";
import { useTranslation } from 'react-i18next';
import { ServicesGridSkeleton, TestimonialSkeleton } from "@/components/ui/skeleton";

// Lazy load components below the fold for better LCP/TBT
const ServicesGrid = lazy(() => import("@/components/ServicesGrid"));
const WhyBikawo = lazy(() => import("@/components/WhyBikawo"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const FinalCTABiface = lazy(() => import("@/components/FinalCTABiface"));
const Footer = lazy(() => import("@/components/Footer"));
const ChatBot = lazy(() => import("@/components/ChatBot"));

// Defer non-critical SEO/tracking components
const TrackingManager = lazy(() => import("@/components/TrackingManager"));
const RetargetingPixels = lazy(() => import("@/components/RetargetingPixels"));
const GoogleSuggestOptimizer = lazy(() => import("@/components/GoogleSuggestOptimizer"));

// Skeleton loaders style Shein
const SectionSkeleton = ({ height = "h-96" }: { height?: string }) => (
  <div className={`${height} bg-muted/20 animate-pulse rounded-lg`} />
);

const TestimonialsSkeleton = () => (
  <div className="container mx-auto px-4">
    <div className="text-center mb-8">
      <div className="h-8 w-64 bg-muted/40 animate-pulse rounded mx-auto mb-4" />
      <div className="h-4 w-96 bg-muted/30 animate-pulse rounded mx-auto" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <TestimonialSkeleton />
      <TestimonialSkeleton />
      <TestimonialSkeleton />
    </div>
  </div>
);

const Index = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Critical SEO - loaded immediately */}
      <SEOOptimization 
        title="Bikawo - Débordé(e) par le quotidien ? | Assistant Personnel Paris"
        description="★ Déléguer vos missions quotidiennes n'a jamais été aussi simple ! Garde enfants, aide seniors, courses, démarches admin. La charge mentale en moins, la sérénité en plus."
        keywords="débordé quotidien, déléguer missions, charge mentale, assistant personnel Paris, services domicile, garde enfants, aide seniors, sérénité famille"
      />
      <SEOComponent 
        title="Bikawo - La charge mentale en moins, la sérénité en plus"
        description="Créé par une maman qui comprend. Bikawo vous libère de la charge mentale avec des services combinés : garde enfants, aide seniors, courses, démarches admin. Votre assistant personnel au quotidien."
        keywords="charge mentale, délégation tâches, assistant personnel, maman entrepreneur, services famille, sérénité quotidien, aide domicile"
        structuredData={seoStructuredData.organization}
      />
      
      {/* Deferred tracking/SEO components */}
      <Suspense fallback={null}>
        <GoogleSuggestOptimizer />
        <TrackingManager />
        <RetargetingPixels 
          userType="visitor"
          serviceInterest={["delegation-taches", "charge-mentale", "aide-quotidienne"]}
        />
      </Suspense>
      
      {/* Navigation - Critical */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-sm bg-background/80 border-b border-border/40">
        <Navbar />
      </header>
      
      {/* Main Content */}
      <main className="w-full">
        {/* Hero Section - Critical, loaded immediately */}
        <section className="relative overflow-hidden">
          <NewHero />
        </section>
        
        {/* Services Section - Lazy loaded */}
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
            <Suspense fallback={<ServicesGridSkeleton count={8} />}>
              <ServicesGrid />
            </Suspense>
          </div>
        </section>
        
        {/* Why Choose Us Section - Lazy loaded with content-visibility */}
        <section className="py-16 lg:py-24 bg-background content-visibility-auto">
          <Suspense fallback={<SectionSkeleton />}>
            <WhyBikawo />
          </Suspense>
        </section>
        
        {/* Testimonials Section - Lazy loaded with skeleton */}
        <section className="py-16 lg:py-24 bg-muted/20 content-visibility-auto">
          <Suspense fallback={<TestimonialsSkeleton />}>
            <TestimonialsSection />
          </Suspense>
        </section>
        
        {/* Call to Action Section - Lazy loaded with content-visibility */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5 content-visibility-auto">
          <Suspense fallback={<SectionSkeleton height="h-64" />}>
            <FinalCTABiface />
          </Suspense>
        </section>
      </main>
      
      {/* Footer - Lazy loaded */}
      <footer className="bg-muted/50">
        <Suspense fallback={<SectionSkeleton height="h-48" />}>
          <Footer />
        </Suspense>
      </footer>
      
      {/* Chat Bot - Lazy loaded with delay */}
      <Suspense fallback={null}>
        <ChatBot />
      </Suspense>
    </div>
  );
};

export default Index;
