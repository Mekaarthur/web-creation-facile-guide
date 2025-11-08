import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, MapPin, ShoppingCart, ArrowRight, Shield, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useBikawoCart } from "@/hooks/useBikawoCart";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSecureForm } from "@/hooks/useSecureForm";
import { bookingSchema } from "@/lib/security-validation";
import { z } from "zod";

interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
}

interface BikaServiceBookingProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    name: string;
    description: string;
    price: number;
    category: string;
  };
  packageTitle: string;
}

const BikaServiceBooking = ({ isOpen, onClose, service, packageTitle }: BikaServiceBookingProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [providerType, setProviderType] = useState<string>("any");
  const [showSuccessOptions, setShowSuccessOptions] = useState(false);
  
  const { addToCart } = useBikawoCart();
  const { toast } = useToast();

  // Secure form validation
  const { handleSubmit: secureSubmit, isSubmitting, errors } = useSecureForm({
    schema: bookingSchema,
    onSubmit: async (validatedData) => {
      // Data is already validated by schema
      executeAddToCart(validatedData);
    },
    rateLimitKey: 'booking',
    rateLimitAction: 'add_to_cart'
  });

  const availableTimeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    const startHour = parseInt(startTime.split(':')[0]);
    const startMinutes = parseInt(startTime.split(':')[1]);
    const endHour = parseInt(endTime.split(':')[0]);
    const endMinutes = parseInt(endTime.split(':')[1]);
    return (endHour + endMinutes/60) - (startHour + startMinutes/60);
  };

  const getTotalPrice = () => {
    return calculateDuration() * service.price;
  };

  const handleAddToCart = () => {
    if (!date || !startTime || !endTime || !address) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
      return;
    }

    if (startTime >= endTime) {
      toast({
        title: "Erreur d'horaires",
        description: "L'heure de fin doit être postérieure à l'heure de début",
        variant: "destructive",
      });
      return;
    }

    const duration = calculateDuration();
    if (duration < 2) {
      toast({
        title: "Durée insuffisante",
        description: "Durée minimum : 2 heures par service",
        variant: "destructive",
      });
      return;
    }

    // Validate with secure form
    secureSubmit({
      date: date.toISOString(),
      startTime: startTime,
      address: address,
      postalCode: "75000",
      notes: notes || undefined
    });
  };

  const executeAddToCart = (validatedData: z.infer<typeof bookingSchema>) => {
    const duration = calculateDuration();
    
    // Adapter au format BikawoCartItem
    addToCart({
      serviceName: service.name,
      serviceCategory: service.category as any,
      packageTitle: packageTitle,
      price: service.price,
      quantity: duration, // Durée en heures
      timeSlot: {
        date: date!,
        startTime: startTime,
        endTime: endTime
      },
      address: validatedData.address,
      description: `${format(date!, "dd/MM/yyyy", { locale: fr })} de ${startTime} à ${endTime} (${duration}h)`,
      notes: validatedData.notes
    });

    // Utiliser setTimeout pour éviter les updates pendant le render
    setTimeout(() => {
      toast({
        title: "✅ Service ajouté au panier",
        description: `${service.name} - ${duration}h pour ${getTotalPrice()}€`,
        duration: 5000,
      });

      // Animer l'icône du panier
      const cartButton = document.querySelector('[data-cart-indicator]');
      if (cartButton) {
        cartButton.classList.add('animate-bounce');
        setTimeout(() => cartButton.classList.remove('animate-bounce'), 1000);
      }
    }, 0);

    // Montrer les options après ajout
    setShowSuccessOptions(true);
  };

  const handleAddAnother = () => {
    // Reset form pour ajouter un autre créneau
    setDate(undefined);
    setStartTime("");
    setEndTime("");
    setAddress("");
    setNotes("");
    setProviderType("any");
    setShowSuccessOptions(false);
    toast({
      title: "Prêt pour un nouveau créneau",
      description: "Configurez votre prochain créneau",
    });
  };

  const handleGoToCart = () => {
    onClose();
    window.location.href = "/panier";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Réserver - {service.name}
            <Badge variant="outline" className="ml-2">
              <Shield className="w-3 h-3 mr-1" />
              Sécurisé
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {showSuccessOptions 
              ? "Créneau ajouté ! Que souhaitez-vous faire ?"
              : "Choisissez votre date, horaires et adresse d'intervention"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {showSuccessOptions ? (
            /* Options après ajout au panier */
            <div className="space-y-4 text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Créneau ajouté au panier !</h3>
              <p className="text-muted-foreground">
                {service.name} - {calculateDuration()}h pour {getTotalPrice()}€
              </p>
              
              <div className="flex flex-col gap-3 pt-4">
                <Button onClick={handleAddAnother} size="lg" variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un autre créneau
                </Button>
                <Button onClick={handleGoToCart} size="lg" className="w-full bg-gradient-primary">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Procéder au paiement
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Service Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{service.name}</h4>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary">
                    {service.price}€/h
                  </Badge>
                </div>
              </div>

              {/* Formulaire simplifié - Un seul créneau */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Configuration de votre service</Label>
                
                {/* Type de prestataire */}
                <div className="space-y-2">
                  <Label>Type de prestataire</Label>
                  <Select value={providerType} onValueChange={setProviderType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une préférence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Peu importe</SelectItem>
                      <SelectItem value="female">👩 Femme</SelectItem>
                      <SelectItem value="male">👨 Homme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Label className="text-base font-semibold mt-4">Date et horaires (minimum 2h)</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "dd/MM/yyyy", { locale: fr }) : "Choisir une date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Heure début *</Label>
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Début" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimeSlots.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Heure fin *</Label>
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Fin" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimeSlots.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Aperçu durée et prix */}
                {date && startTime && endTime && calculateDuration() > 0 && (
                  <div className="p-3 bg-primary/5 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        Durée : {calculateDuration()}h
                      </span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {getTotalPrice()}€
                    </span>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adresse d'intervention *
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: 15 rue de la Paix, 75001 Paris"
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address}</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes supplémentaires (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations complémentaires, instructions spéciales..."
                  rows={3}
                  maxLength={1000}
                />
                {errors.notes && (
                  <p className="text-sm text-destructive">{errors.notes}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {notes.length}/1000 caractères
                </p>
              </div>
            </>
          )}
        </div>

        {!showSuccessOptions && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button 
              onClick={handleAddToCart} 
              className="flex-1 bg-gradient-primary" 
              disabled={!date || !startTime || !endTime || !address || isSubmitting}
            >
              {isSubmitting ? "Ajout en cours..." : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Ajouter au panier
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BikaServiceBooking;
