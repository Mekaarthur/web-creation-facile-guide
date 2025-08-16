import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ShoppingCart, Send, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface EnhancedCartItem {
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
    clientInfo?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      company?: string;
    };
    serviceType?: string;
    budget?: string;
  };
}

interface EnhancedCartProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const EnhancedCart = ({ isOpen = false, onClose }: EnhancedCartProps) => {
  const [cartItems, setCartItems] = useState<EnhancedCartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState("");
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

  const removeItem = (id: string) => {
    const updatedItems = cartItems.filter(item => item.id !== id);
    setCartItems(updatedItems);
    localStorage.setItem('bikawo-cart', JSON.stringify(updatedItems));
    toast({
      title: "Service retiré",
      description: "Le service a été retiré de votre panier",
    });
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.setItem('bikawo-cart', JSON.stringify([]));
    toast({
      title: "Panier vidé",
      description: "Tous les services ont été retirés de votre panier",
    });
  };

  const getTotalEstimated = () => {
    return cartItems.reduce((total, item) => {
      if (item.customBooking?.hours) {
        return total + (item.price * item.customBooking.hours * item.quantity);
      }
      return total + (item.price * item.quantity);
    }, 0);
  };

  const handleFinalSubmission = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Panier vide",
        description: "Aucun service à commander",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Préparer les données pour la soumission
      const reservationData = {
        items: cartItems,
        totalEstimated: getTotalEstimated(),
        additionalNotes,
        submittedAt: new Date().toISOString(),
        status: 'en_attente'
      };

      // Sauvegarder en localStorage (en attendant la base de données)
      const existingReservations = localStorage.getItem('bikawo-final-reservations') || '[]';
      const reservations = JSON.parse(existingReservations);
      const newReservationId = `RES-${Date.now()}`;
      reservations.push({
        id: newReservationId,
        ...reservationData
      });
      localStorage.setItem('bikawo-final-reservations', JSON.stringify(reservations));

      // Appeler l'edge function pour envoyer les notifications email
      const { error } = await supabase.functions.invoke('send-reservation-notification', {
        body: {
          reservationId: newReservationId,
          reservationData
        }
      });

      if (error) {
        console.error('Erreur lors de l\'envoi de notification:', error);
        // Continuer même si l'email échoue
      }

      // Vider le panier
      clearCart();
      setIsCheckoutOpen(false);

      toast({
        title: "Réservation envoyée !",
        description: "Votre demande a été transmise. Vous recevrez une confirmation par email.",
      });

      if (onClose) onClose();

    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de votre demande",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = () => {
    // Simulation d'export PDF
    const exportData = {
      reservations: cartItems,
      total: getTotalEstimated(),
      date: new Date().toLocaleDateString('fr-FR'),
      notes: additionalNotes
    };
    
    console.log('Export PDF:', exportData);
    toast({
      title: "Export généré",
      description: "Le récapitulatif de votre panier est prêt (fonctionnalité simulée)",
    });
  };

  if (!isOpen && cartItems.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Panier ({cartItems.length})
          </CardTitle>
          {cartItems.length > 0 && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={exportToPDF}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Vider
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Votre panier est vide</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.serviceName}</h4>
                        <p className="text-xs text-muted-foreground">{item.packageTitle}</p>
                        
                        {item.customBooking?.clientInfo && (
                          <div className="text-xs text-muted-foreground mt-1">
                            <p>👤 {item.customBooking.clientInfo.firstName} {item.customBooking.clientInfo.lastName}</p>
                            <p>📧 {item.customBooking.clientInfo.email}</p>
                            <p>📍 {item.customBooking.address}</p>
                            {item.customBooking.serviceType && (
                              <p>🔧 {item.customBooking.serviceType}</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">
                        {item.customBooking?.hours 
                          ? `${item.price}€/h × ${item.customBooking.hours}h`
                          : `${item.price}€`
                        }
                      </Badge>
                      <span className="text-sm font-medium">
                        {item.customBooking?.hours 
                          ? `${item.price * item.customBooking.hours}€`
                          : `${item.price}€`
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total estimé:</span>
                  <span className="font-bold text-primary">{getTotalEstimated()}€</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Prix indicatif - Le tarif final sera confirmé après évaluation
                </p>
              </div>

              <Button 
                onClick={() => setIsCheckoutOpen(true)} 
                className="w-full"
                size="lg"
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyer ma demande
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation finale */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finaliser votre demande de réservation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Récapitulatif */}
            <div className="space-y-4">
              <h3 className="font-semibold">Récapitulatif de votre demande</h3>
              {cartItems.map((item, index) => (
                <Card key={item.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{item.serviceName}</h4>
                      <Badge>
                        {item.customBooking?.hours 
                          ? `${item.price * item.customBooking.hours}€`
                          : `${item.price}€`
                        }
                      </Badge>
                    </div>
                    
                    {item.customBooking?.clientInfo && (
                      <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                        <p><strong>Contact:</strong> {item.customBooking.clientInfo.firstName} {item.customBooking.clientInfo.lastName}</p>
                        <p><strong>Email:</strong> {item.customBooking.clientInfo.email}</p>
                        <p><strong>Téléphone:</strong> {item.customBooking.clientInfo.phone}</p>
                        <p><strong>Adresse:</strong> {item.customBooking.address}</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Notes additionnelles */}
            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Notes additionnelles (optionnel)</Label>
              <Textarea
                id="additionalNotes"
                placeholder="Informations complémentaires sur l'ensemble de votre demande..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bg-primary/5 p-4 rounded-lg">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total estimé:</span>
                <span className="text-primary">{getTotalEstimated()}€</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Ce montant est indicatif. Le tarif définitif sera établi après évaluation de vos besoins.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => setIsCheckoutOpen(false)} 
                variant="outline" 
                className="flex-1"
              >
                Retour au panier
              </Button>
              <Button 
                onClick={handleFinalSubmission} 
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? "Envoi en cours..." : "Confirmer et envoyer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedCart;