import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Plus, Minus, MapPin, Clock, Euro, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/components/Cart";

interface ServiceBookingFormProps {
  service: {
    name: string;
    description?: string;
    price: number;
  };
  packageTitle: string;
  onClose: () => void;
}

interface BookingSlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
}

const ServiceBookingForm = ({ service, packageTitle, onClose }: ServiceBookingFormProps) => {
  const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([]);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Options d'heures disponibles
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
  ];

  const addBookingSlot = () => {
    const newSlot: BookingSlot = {
      id: Date.now().toString(),
      date: new Date(),
      startTime: "09:00",
      endTime: "11:00"
    };
    setBookingSlots([...bookingSlots, newSlot]);
  };

  const removeBookingSlot = (id: string) => {
    setBookingSlots(bookingSlots.filter(slot => slot.id !== id));
  };

  const updateBookingSlot = (id: string, updates: Partial<BookingSlot>) => {
    setBookingSlots(bookingSlots.map(slot => 
      slot.id === id ? { ...slot, ...updates } : slot
    ));
  };

  const getTotalHours = () => {
    return bookingSlots.reduce((total, slot) => {
      const start = new Date(`2000-01-01T${slot.startTime}:00`);
      const end = new Date(`2000-01-01T${slot.endTime}:00`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + Math.max(0, hours);
    }, 0);
  };

  const getTotalPrice = () => {
    return getTotalHours() * service.price;
  };

  const handleSubmit = () => {
    if (bookingSlots.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un créneau de réservation",
        variant: "destructive",
      });
      return;
    }

    if (!address.trim()) {
      toast({
        title: "Erreur", 
        description: "Veuillez saisir une adresse",
        variant: "destructive",
      });
      return;
    }

    // Ajouter au panier avec les détails de réservation flexible
    addToCart({
      serviceName: service.name,
      packageTitle,
      price: service.price,
      description: service.description,
      customBooking: {
        date: bookingSlots[0].date, // Date principale pour l'affichage
        time: bookingSlots[0].startTime,
        hours: getTotalHours(),
        address,
        notes,
        slots: bookingSlots.map(slot => ({
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime
        }))
      }
    });

    toast({
      title: "Service ajouté au panier",
      description: `${service.name} avec ${getTotalHours()}h réparties sur ${bookingSlots.length} créneau${bookingSlots.length > 1 ? 'x' : ''} a été ajouté`,
    });

    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Service Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{service.name}</span>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Euro className="w-3 h-3" />
              {service.price}€/h
            </Badge>
          </CardTitle>
          {service.description && (
            <p className="text-sm text-muted-foreground">{service.description}</p>
          )}
        </CardHeader>
      </Card>

      {/* Booking Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Créneaux de réservation</span>
            <Button onClick={addBookingSlot} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un créneau
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookingSlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun créneau défini</p>
              <p className="text-sm">Cliquez sur "Ajouter un créneau" pour commencer</p>
            </div>
          ) : (
            bookingSlots.map((slot, index) => (
              <Card key={slot.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Créneau {index + 1}</h4>
                  <Button
                    onClick={() => removeBookingSlot(slot.id)}
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !slot.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {slot.date ? format(slot.date, "PPP", { locale: fr }) : "Sélectionner une date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={slot.date}
                          onSelect={(date) => {
                            if (date) {
                              updateBookingSlot(slot.id, { date });
                              setIsPopoverOpen(false);
                            }
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Start Time */}
                  <div className="space-y-2">
                    <Label>Heure de début</Label>
                    <Select 
                      value={slot.startTime}
                      onValueChange={(value) => updateBookingSlot(slot.id, { startTime: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner l'heure" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* End Time */}
                  <div className="space-y-2">
                    <Label>Heure de fin</Label>
                    <Select 
                      value={slot.endTime}
                      onValueChange={(value) => updateBookingSlot(slot.id, { endTime: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner l'heure de fin" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration Display */}
                  <div className="space-y-2">
                    <Label>Durée calculée</Label>
                    <div className="flex items-center justify-center h-10 bg-muted rounded-md">
                      <span className="text-sm font-medium">
                        {(() => {
                          const start = new Date(`2000-01-01T${slot.startTime}:00`);
                          const end = new Date(`2000-01-01T${slot.endTime}:00`);
                          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                          return hours > 0 ? `${hours}h` : "0h";
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address" className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Adresse d'intervention *
        </Label>
        <Input
          id="address"
          placeholder="Saisissez l'adresse complète"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes supplémentaires</Label>
        <Textarea
          id="notes"
          placeholder="Informations complémentaires, instructions spéciales..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Summary */}
      {bookingSlots.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total d'heures:</span>
                <span className="font-bold">{getTotalHours()}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Nombre de créneaux:</span>
                <span className="font-bold">{bookingSlots.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Prix total estimé:</span>
                <span className="font-bold text-primary">{getTotalPrice()}€</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onClose} variant="outline" className="flex-1">
          Annuler
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          Ajouter au panier
        </Button>
      </div>
    </div>
  );
};

export default ServiceBookingForm;