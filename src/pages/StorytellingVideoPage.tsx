import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StorytellingVideo from "@/components/StorytellingVideo";
import { Card } from "@/components/ui/card";
import { Heart, Play } from "lucide-react";

const StorytellingVideoPage = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Heart className="w-4 h-4" />
              <span>Notre histoire</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Une histoire d'espoir
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                qui redonne confiance
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Découvrez l'histoire authentique derrière Bikawô : comment une maman en détresse 
              a transformé ses difficultés en solution pour des milliers de familles.
            </p>
            
            <div className="flex items-center justify-center gap-2 text-primary">
              <Play className="w-5 h-5" />
              <span className="text-sm font-medium">Durée : 4 minutes • Narration française</span>
            </div>
          </div>
        </section>

        {/* Video Section */}
        <section className="py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <StorytellingVideo />
          </div>
        </section>

        {/* Context Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Authenticité</h3>
                <p className="text-sm text-muted-foreground">
                  Une histoire vraie, vécue par notre fondatrice
                </p>
              </Card>
              
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">5k+</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Impact</h3>
                <p className="text-sm text-muted-foreground">
                  Familles déjà aidées par nos services
                </p>
              </Card>
              
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">24/7</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Disponibilité</h3>
                <p className="text-sm text-muted-foreground">
                  Support et services quand vous en avez besoin
                </p>
              </Card>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default StorytellingVideoPage;