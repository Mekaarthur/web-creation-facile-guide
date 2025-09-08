import Navbar from "@/components/Navbar";
import ServicesGrid from "@/components/ServicesGrid";

import Footer from "@/components/Footer";
import SEOComponent from "@/components/SEOComponent";

const Reservation = () => {
  return (
    <div className="min-h-screen">
      <SEOComponent 
        title="Réserver un service BIKAWO - Nos Services"
        description="Choisissez un service BIKAWO à réserver parmi nos catégories harmonisées comme sur la page d'accueil."
        keywords="réserver, services BIKAWO, bika kids, bika maison, bika seniors, bika travel, bika pro, bika plus"
      />
      <Navbar />

      <main className="pt-20 bg-background">
        <header className="text-center space-y-4 py-14 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Réserver un service
              <span className="block bg-gradient-hero bg-clip-text text-transparent">BIKAWO</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Retrouvez ci-dessous les mêmes services que sur l'accueil et la page Services du header, pour une expérience harmonisée.
            </p>
          </div>
        </header>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ServicesGrid />
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Reservation;
