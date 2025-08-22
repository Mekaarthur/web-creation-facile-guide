import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, ArrowLeft, User, Phone, Mail, MapPin, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { CartItem } from "@/components/Cart";

interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

const Reservation = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: ""
  });
  const [preferredDate, setPreferredDate] = useState<Date>();
  const [preferredTime, setPreferredTime] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Charger le panier depuis sessionStorage
    const savedCart = sessionStorage.getItem('bikawo-booking-cart');
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        setCartItems(items);
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre panier",
          variant: "destructive",
        });
        navigate('/');
      }
    } else {
      // Pas de panier, rediriger vers l'accueil
      toast({
        title: "Panier vide",
        description: "Aucun service à réserver",
        variant: "destructive",
      });
      navigate('/');
    }

    // Pré-remplir avec les infos utilisateur si connecté
    if (user?.user_metadata) {
      setClientInfo(prev => ({
        ...prev,
        firstName: user.user_metadata.first_name || "",
        lastName: user.user_metadata.last_name || "",
        email: user.email || ""
      }));
    }
  }, [navigate, toast, user]);

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      if (item.customBooking?.hours) {
        return total + (item.price * item.customBooking.hours * item.quantity);
      }
      return total + (item.price * item.quantity * 2); // Minimum 2h par service
    }, 0);
  };

  const handleSubmitReservation = async () => {
    // Validation
    if (!clientInfo.firstName || !clientInfo.lastName || !clientInfo.email || !clientInfo.phone || !clientInfo.address) {
      toast({
        title: "Informations incomplètes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (!preferredDate) {
      toast({
        title: "Date manquante",
        description: "Veuillez sélectionner une date souhaitée",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Préparer les données de réservation
      const reservationData = {
        id: `RES-${Date.now()}`,
        clientInfo,
        preferredDate: preferredDate.toISOString(),
        preferredTime,
        additionalNotes,
        services: cartItems,
        totalEstimated: getTotalPrice(),
        status: 'en_attente',
        createdAt: new Date().toISOString()
      };

      // Sauvegarder dans localStorage (en attendant la base de données)
      const existingReservations = localStorage.getItem('bikawo-reservations') || '[]';
      const reservations = JSON.parse(existingReservations);
      reservations.push(reservationData);
      localStorage.setItem('bikawo-reservations', JSON.stringify(reservations));

      // Vider le panier
      localStorage.removeItem('bikawo-cart');
      sessionStorage.removeItem('bikawo-booking-cart');

      toast({
        title: "Réservation confirmée !",
        description: "Votre demande a été enregistrée. Nous vous contacterons rapidement.",
      });

      // Rediriger vers une page de confirmation
      navigate('/reservation-confirmee', { 
        state: { reservationId: reservationData.id } 
      });

    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de votre réservation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return null; // Le useEffect gère la redirection
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au panier
            </Button>
            <h1 className="text-3xl font-bold">Finaliser votre réservation</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulaire de réservation */}
            <div className="space-y-6">
              {/* Informations client */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Vos informations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input
                        id="firstName"
                        value={clientInfo.firstName}
                        onChange={(e) => setClientInfo(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom *</Label>
                      <Input
                        id="lastName"
                        value={clientInfo.lastName}
                        onChange={(e) => setClientInfo(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={clientInfo.email}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Téléphone *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={clientInfo.phone}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Adresse complète *
                    </Label>
                    <Input
                      id="address"
                      value={clientInfo.address}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Numéro, rue, code postal, ville"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Préférences de planning */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Planning souhaité
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date souhaitée *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !preferredDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {preferredDate ? format(preferredDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={preferredDate}
                            onSelect={setPreferredDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Heure préférée</Label>
                      <Select value={preferredTime} onValueChange={setPreferredTime}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une heure" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes complémentaires</Label>
                    <Textarea
                      id="notes"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="Précisions sur vos besoins, contraintes particulières..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Récapitulatif de la commande */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Récapitulatif de votre commande</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div key={item.id} className="space-y-3">
                      {index > 0 && <Separator />}
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.serviceName}</h4>
                            <p className="text-sm text-muted-foreground">{item.packageTitle}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {item.customBooking?.hours 
                              ? `${item.price * item.customBooking.hours}€`
                              : `${item.price * 2}€` // Minimum 2h
                            }
                          </Badge>
                        </div>
                        
                        {item.customBooking && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>⏱️ {item.customBooking.hours || 2}h minimum</p>
                            {item.customBooking.address && (
                              <p>📍 {item.customBooking.address}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total estimé :</span>
                      <span className="text-primary">{getTotalPrice()}€</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Prix indicatif minimum basé sur 2h par service. Le tarif final sera ajusté selon la durée réelle.
                    </p>
                  </div>

                  <Button 
                    onClick={handleSubmitReservation}
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isLoading ? "Traitement en cours..." : "Confirmer ma réservation"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    En confirmant, vous acceptez nos conditions générales de vente.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Reservation;