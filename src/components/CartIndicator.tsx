import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/Cart";

interface CartIndicatorProps {
  onOpenCart?: () => void;
  className?: string;
  variant?: "navbar" | "mobile";
}

const CartIndicator = ({ 
  onOpenCart, 
  className = "",
  variant = "navbar" 
}: CartIndicatorProps) => {
  const { getCartItemsCount } = useCart();
  const itemCount = getCartItemsCount();

  if (variant === "mobile") {
    return (
      <div className={`relative ${className}`}>
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onOpenCart}
      className={`relative ${className}`}
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Button>
  );
};

export default CartIndicator;