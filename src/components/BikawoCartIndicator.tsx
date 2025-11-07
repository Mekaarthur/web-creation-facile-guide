import { ShoppingCart, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBikawoCart } from "@/hooks/useBikawoCart";

interface BikawoCartIndicatorProps {
  onOpenCart?: () => void;
  showTotal?: boolean;
  className?: string;
}

const BikawoCartIndicator = ({ 
  onOpenCart, 
  showTotal = false, 
  className = "" 
}: BikawoCartIndicatorProps) => {
  const { 
    getCartItemsCount, 
    getCartTotal, 
    hasIncompatibleServices, 
    getSeparatedBookingsCount 
  } = useBikawoCart();
  
  const itemCount = getCartItemsCount();
  const total = getCartTotal();
  const hasConflicts = hasIncompatibleServices();
  const bookingsCount = getSeparatedBookingsCount();

  if (itemCount === 0) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className={`relative ${className} border-primary/30 hover:bg-primary/10`}
        onClick={onOpenCart}
      >
        <ShoppingCart className="h-5 w-5 text-primary" />
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className={`relative ${className} border-primary/30 hover:bg-primary/10`}
      onClick={onOpenCart}
    >
      <div className="flex items-center gap-2">
        <div className="relative">
          <ShoppingCart className="h-5 w-5 text-primary" />
          
          {/* Indicator de nombre d'items */}
          {itemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {itemCount}
            </Badge>
          )}
          
          {/* Indicator de conflits */}
          {hasConflicts && (
            <div className="absolute -top-1 -left-1">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
            </div>
          )}
        </div>
        
        {showTotal && total > 0 && (
          <div className="flex flex-col items-start text-xs">
            <span className="font-medium">{total}€</span>
            {hasConflicts && (
              <span className="text-orange-600 text-[10px]">
                {bookingsCount} rés.
              </span>
            )}
          </div>
        )}
      </div>
    </Button>
  );
};

export default BikawoCartIndicator;