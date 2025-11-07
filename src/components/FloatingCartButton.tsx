import { useState, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBikawoCart } from "@/hooks/useBikawoCart";
import { useNavigate } from "react-router-dom";

const FloatingCartButton = () => {
  const navigate = useNavigate();
  const { getCartItemsCount, getCartTotal } = useBikawoCart();
  const [show, setShow] = useState(false);
  const [pulse, setPulse] = useState(false);
  
  const itemCount = getCartItemsCount();
  const total = getCartTotal();

  useEffect(() => {
    if (itemCount > 0) {
      setShow(true);
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [itemCount]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <Button
        size="lg"
        onClick={() => navigate('/panier')}
        className={`shadow-elegant hover:shadow-glow transition-all duration-300 ${
          pulse ? 'animate-bounce' : ''
        }`}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        <div className="flex flex-col items-start">
          <span className="font-semibold">Voir le panier</span>
          <span className="text-xs opacity-90">
            {itemCount} article{itemCount > 1 ? 's' : ''} • {total}€
          </span>
        </div>
        {itemCount > 0 && (
          <Badge 
            variant="destructive" 
            className="ml-2 h-6 w-6 p-0 flex items-center justify-center animate-pulse"
          >
            {itemCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};

export default FloatingCartButton;
