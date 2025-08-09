import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CustomRequestForm from "@/components/CustomRequestForm";
import SEOComponent from "@/components/SEOComponent";

const CustomRequest = () => {
  return (
    <>
      <SEOComponent
        title="Demande personnalisée - Bikawo"
        description="Envoyez-nous votre demande de service personnalisé. Notre équipe vous proposera une solution sur mesure adaptée à vos besoins spécifiques."
        keywords="demande personnalisée, service sur mesure, devis, bikawo, aide domestique"
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Demande
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  personnalisée
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Vous avez un besoin spécifique qui ne correspond pas exactement à nos offres standards ? 
                Partagez-nous votre projet et nous vous proposerons une solution adaptée.
              </p>
            </div>

            {/* Avantages */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Sur mesure</h3>
                <p className="text-sm text-muted-foreground">
                  Solution entièrement adaptée à vos besoins et contraintes
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Réactivité</h3>
                <p className="text-sm text-muted-foreground">
                  Réponse rapide avec un devis personnalisé sous 24h
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Qualité</h3>
                <p className="text-sm text-muted-foreground">
                  Même exigence de qualité que nos services standards
                </p>
              </div>
            </div>

            <CustomRequestForm />

            {/* FAQ Section */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-foreground text-center mb-8">
                Questions fréquentes
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-muted/30 p-6 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">
                    Sous quel délai puis-je avoir une réponse ?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Nous nous engageons à vous répondre sous 24h avec une première proposition ou des questions complémentaires.
                  </p>
                </div>
                <div className="bg-muted/30 p-6 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">
                    Y a-t-il des frais pour l'étude de ma demande ?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Non, l'étude de votre demande et l'établissement du devis sont entièrement gratuits et sans engagement.
                  </p>
                </div>
                <div className="bg-muted/30 p-6 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">
                    Puis-je modifier ma demande après envoi ?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Bien sûr ! Notre équipe vous recontactera pour affiner votre demande et s'assurer qu'elle correspond parfaitement à vos attentes.
                  </p>
                </div>
                <div className="bg-muted/30 p-6 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">
                    Quels types de services puis-je demander ?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tous types de services d'aide à domicile, garde d'enfants, assistance administrative, ou toute combinaison de nos expertises.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default CustomRequest;