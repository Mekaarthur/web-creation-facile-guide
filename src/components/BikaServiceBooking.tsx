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
import { CalendarIcon, Clock, MapPin, Plus, Trash2, Shield } from "lucide-react";
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
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [currentSlot, setCurrentSlot] = useState({
    date: undefined as Date | undefined,
    startTime: "",
    endTime: ""
  });
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  
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

  const addTimeSlot = () => {
    if (!currentSlot.date || !currentSlot.startTime || !currentSlot.endTime) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs du créneau",
        variant: "destructive",
      });
      return;
    }

    if (currentSlot.startTime >= currentSlot.endTime) {
      toast({
        title: "Erreur",  
        description: "L'heure de fin doit être postérieure à l'heure de début",
        variant: "destructive",
      });
      return;
    }

    setTimeSlots([...timeSlots, {
      date: currentSlot.date,
      startTime: currentSlot.startTime,
      endTime: currentSlot.endTime
    }]);

    setCurrentSlot({
      date: undefined,
      startTime: "",
      endTime: ""
    });

    toast({
      title: "Créneau ajouté",
      description: "Le créneau a été ajouté avec succès",
    });
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const getTotalHours = () => {
    return timeSlots.reduce((total, slot) => {
      const startHour = parseInt(slot.startTime.split(':')[0]);
      const startMinutes = parseInt(slot.startTime.split(':')[1]);
      const endHour = parseInt(slot.endTime.split(':')[0]);
      const endMinutes = parseInt(slot.endTime.split(':')[1]);
      const duration = (endHour + endMinutes/60) - (startHour + startMinutes/60);
      return total + duration;
    }, 0);
  };

  const getTotalPrice = () => {
    return getTotalHours() * service.price;
  };

  const handleAddToCart = () => {
    if (timeSlots.length === 0 || !address) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un créneau et renseigner l'adresse",
        variant: "destructive",
      });
      return;
    }

    if (getTotalHours() < 2) {
      toast({
        title: "Durée insuffisante",
        description: "Durée minimum : 2 heures par service",
        variant: "destructive",
      });
      return;
    }

    // Validate with secure form
    secureSubmit({
      date: timeSlots[0].date.toISOString(),
      startTime: timeSlots[0].startTime,
      address: address,
      postalCode: "75000", // Default - could be extracted from address
      notes: notes || undefined
    });
  };

  const executeAddToCart = (validatedData: z.infer<typeof bookingSchema>) => {
    const slotsDescription = timeSlots.map(slot => 
      `${format(slot.date, "dd/MM/yyyy", { locale: fr })} de ${slot.startTime} à ${slot.endTime}`
    ).join(", ");

    // Mapper les catégories de services
    const mapServiceCategory = (category: string) => {
      const categoryMap: Record<string, string> = {
        'Préparation culinaire': 'bika_maison',
        'Jardinage': 'entretien_espaces_verts',
        'Garde d\'enfants': 'bika_kids',
        'Aide aux seniors': 'bika_seniors',
        'Animaux': 'bika_animals',
        'Transport': 'bika_travel',
        'Administratif': 'bika_vie',
        'Professionnel': 'bika_pro',
      };
      return categoryMap[category] || 'bika_maison';
    };

    // Adapter au format BikawoCartItem with sanitized data
    addToCart({
      serviceName: service.name,
      serviceCategory: mapServiceCategory(service.category) as any,
      packageTitle: packageTitle,
      price: service.price,
      timeSlot: {
        date: timeSlots[0].date,
        startTime: timeSlots[0].startTime,
        endTime: timeSlots[0].endTime
      },
      address: validatedData.address,
      description: `${slotsDescription}`,
      notes: validatedData.notes
    });

    toast({
      title: "✅ Service ajouté au panier",
      description: `${service.name} (${getTotalHours()}h) ajouté avec succès`,
      duration: 5000,
    });

    // Animer l'icône du panier
    setTimeout(() => {
      const cartButton = document.querySelector('[data-cart-indicator]');
      if (cartButton) {
        cartButton.classList.add('animate-bounce');
        setTimeout(() => cartButton.classList.remove('animate-bounce'), 1000);
      }
    }, 100);

    // Reset form
    setTimeSlots([]);
    setCurrentSlot({ date: undefined, startTime: "", endTime: "" });
    setAddress("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Réservation flexible - {service.name}
            <Badge variant="outline" className="ml-2">
              <Shield className="w-3 h-3 mr-1" />
              Sécurisé
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Configurez vos créneaux de réservation selon vos besoins
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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

          {/* Time Slots Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Créneaux de réservation (minimum 2h au total)</Label>
              <Button 
                onClick={addTimeSlot}
                size="sm"
                disabled={!currentSlot.date || !currentSlot.startTime || !currentSlot.endTime}
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter un créneau
              </Button>
            </div>

            {/* Current Slot Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !currentSlot.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentSlot.date ? format(currentSlot.date, "dd/MM", { locale: fr }) : "Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentSlot.date}
                      onSelect={(date) => setCurrentSlot({...currentSlot, date})}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Heure début</Label>
                <Select value={currentSlot.startTime} onValueChange={(time) => setCurrentSlot({...currentSlot, startTime: time})}>
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
                <Label>Heure fin</Label>
                <Select value={currentSlot.endTime} onValueChange={(time) => setCurrentSlot({...currentSlot, endTime: time})}>
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

            {/* Existing Time Slots */}
            {timeSlots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucun créneau défini</p>
                <p className="text-sm">Cliquez sur "Ajouter un créneau jour et heure " pour commencer</p>
              </div>
            ) : (
              <div className="space-y-2">
                {timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      <div>
                        <span className="font-medium">
                          {format(slot.date, "dd/MM/yyyy", { locale: fr })}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTimeSlot(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
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
              placeholder="Saisissez l'adresse complète"
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes supplémentaires</Label>
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

          {/* Summary */}
          {timeSlots.length > 0 && (
            <div className="p-4 bg-primary/5 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Nombre de créneaux:</span>
                <span>{timeSlots.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Total heures:</span>
                <span>{getTotalHours()}h</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{getTotalPrice()}€</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button 
            onClick={handleAddToCart} 
            className="flex-1" 
            disabled={timeSlots.length === 0 || !address || isSubmitting}
          >
            {isSubmitting ? "Ajout en cours..." : "Ajouter au panier"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BikaServiceBooking;
