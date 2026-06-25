import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import SEOComponent from "@/components/SEOComponent";

type LocationState = {
  quoteNumber?: string;
  email?: string;
};

const DevisConfirme = () => {
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as LocationState;
  const { quoteNumber, email } = state;

  return (
    <div className="min-h-screen bg-background">
      <SEOComponent
        title="Demande de devis reçue | Bikawo Pro"
        description="Votre demande de devis entreprise a bien été reçue. Notre équipe vous contacte sous 24h ouvrées."
        url="/devis-confirme"
      />
      <Navbar />

      <main className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="max-w-lg mx-auto">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-3">Demande bien reçue !</h1>

          {quoteNumber && (
            <p className="text-muted-foreground mb-2">
              Référence de votre devis :{" "}
              <span className="font-mono font-semibold text-foreground">{quoteNumber}</span>
            </p>
          )}

          {email && (
            <p className="text-muted-foreground mb-6">
              Un récapitulatif a été envoyé à{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </p>
          )}

          {!quoteNumber && !email && (
            <p className="text-muted-foreground mb-6">
              Notre équipe commerciale vous contactera sous 24h ouvrées.
            </p>
          )}

          <p className="text-muted-foreground mb-8">
            Notre équipe commerciale vous contacte sous <strong>24h ouvrées</strong> pour
            affiner votre besoin et établir une proposition sur mesure.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/bika-pro")} variant="outline">
              Retour aux services pro
            </Button>
            <Button onClick={() => navigate("/")}>
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DevisConfirme;
