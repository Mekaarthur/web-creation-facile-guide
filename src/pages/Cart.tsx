import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingCartButton from "@/components/FloatingCartButton";
import BikawoCart from "@/components/BikawoCart";

const CartPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Panier | Bikawo</title>
        <meta name="description" content="Votre panier de réservation Bikawo" />
      </Helmet>

      <Navbar />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">Mon Panier</h1>
            <p className="text-muted-foreground">Finalisez votre réservation</p>
          </div>
          <BikawoCart isOpen={true} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
