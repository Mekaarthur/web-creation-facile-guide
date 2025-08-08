import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEODashboard from "@/components/SEODashboard";
import SEOComponent from "@/components/SEOComponent";

const AnalyticsSEO = () => {
  return (
    <div className="min-h-screen">
      <SEOComponent 
        title="Analytics SEO - Dashboard de performance | Bikawo"
        description="Tableau de bord complet pour mesurer et optimiser les performances SEO de Bikawo. Métriques, KPIs et insights."
        keywords="analytics seo, dashboard seo, mesure performance, kpi seo, suivi mots-clés, roi seo"
      />
      <Navbar />
      <div className="pt-20">
        <SEODashboard />
      </div>
      <Footer />
    </div>
  );
};

export default AnalyticsSEO;