import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  serviceName: string;
  packageTitle: string;
  price: number;
  quantity: number;
  description?: string;
  customBooking?: {
    date: Date;
    time: string;
    hours: number;
    address: string;
    notes?: string;
    slots?: Array<{
      date: Date;
      startTime: string;
      endTime: string;
    }>;
  };
}

interface CartProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Cart = ({ isOpen = false, onClose }: CartProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Charger le panier depuis localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('bikawo-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
      }
    }
  }, []);

  // Sauvegarder le panier dans localStorage
  useEffect(() => {
    localStorage.setItem('bikawo-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(id);
      return;
    }

    setCartItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Service retiré",
      description: "Le service a été retiré de votre panier",
    });
  };

  const clearCart = () => {
    setCartItems([]);
    toast({
      title: "Panier vidé",
      description: "Tous les services ont été retirés de votre panier",
    });
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const proceedToBooking = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Panier vide",
        description: "Ajoutez des services à votre panier avant de procéder à la réservation",
        variant: "destructive",
      });
      return;
    }

    // Déclencher l'événement pour ouvrir l'interface de réservation
    window.dispatchEvent(new CustomEvent('openBookingFromCart', { 
      detail: { cartItems } 
    }));
    
    toast({
      title: "Réservation initiée",
      description: "Redirection vers l'interface de réservation...",
    });
  };

  if (!isOpen && cartItems.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Mon Panier ({cartItems.length})
        </CardTitle>
        {cartItems.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart}>
            Vider
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Votre panier est vide</p>
            <p className="text-sm text-muted-foreground">
              Ajoutez des services pour commencer
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.serviceName}</h4>
                    <p className="text-xs text-muted-foreground">{item.packageTitle}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    )}
                    {item.customBooking && (
                      <div className="text-xs text-muted-foreground mt-1 space-y-1">
                        <p>📅 {item.customBooking.hours}h total - {item.customBooking.address}</p>
                        {item.customBooking.slots && item.customBooking.slots.length > 1 && (
                          <p>🕒 {item.customBooking.slots.length} créneaux programmés</p>
                        )}
                        {item.customBooking.slots && item.customBooking.slots.length === 1 && (
                          <p>🕒 {item.customBooking.slots[0].startTime} - {item.customBooking.slots[0].endTime}</p>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="secondary">{item.price}€/h</Badge>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => removeItem(item.id)}
                          className="w-6 h-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total estimé:</span>
                <span className="font-bold text-primary">{getTotalPrice()}€/h</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Le prix final sera calculé selon la durée réelle du service
              </p>
            </div>

            <Button 
              onClick={proceedToBooking} 
              className="w-full"
              size="lg"
            >
              Procéder à la réservation
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Cart;

// Hook pour gérer le panier globalement
export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const savedCart = localStorage.getItem('bikawo-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
      }
    }
  }, []);

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity'>) => {
    const newItem: CartItem = {
      ...item,
      id: `${item.packageTitle}-${item.serviceName}-${Date.now()}`,
      quantity: 1,
    };

    setCartItems(prev => {
      const existingItem = prev.find(
        existing => existing.serviceName === item.serviceName && 
                   existing.packageTitle === item.packageTitle
      );

      if (existingItem) {
        const updated = prev.map(existing => 
          existing.id === existingItem.id 
            ? { ...existing, quantity: existing.quantity + 1 }
            : existing
        );
        localStorage.setItem('bikawo-cart', JSON.stringify(updated));
        return updated;
      } else {
        const updated = [...prev, newItem];
        localStorage.setItem('bikawo-cart', JSON.stringify(updated));
        return updated;
      }
    });

    toast({
      title: "Service ajouté au panier",
      description: `${item.serviceName} a été ajouté à votre panier`,
    });
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return {
    cartItems,
    addToCart,
    getCartItemsCount,
  };
};