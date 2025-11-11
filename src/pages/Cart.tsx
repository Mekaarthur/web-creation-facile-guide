import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BikawoCart from "@/components/BikawoCart";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CartPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Panier | Bikawo</title>
        <meta name="description" content="Votre panier de réservation Bikawo" />
      </Helmet>

      <Navbar />
      
      <main className="flex-1 pt-24 pb-12 min-h-screen bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="hover-scale"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continuer mes achats
            </Button>
          </div>
          <BikawoCart isOpen={true} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
