import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, MapPin, Euro, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useCart } from "@/components/Cart";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const HourlyBooking = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [hours, setHours] = useState(2);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [serviceType, setServiceType] = useState("");
  
  const { addToCart } = useCart();
  const { toast } = useToast();

  const serviceTypes = [
    { value: "childcare", label: "Garde d'enfants", price: 22 },
    { value: "cleaning", label: "Préparation culinaire / batch cooking", price: 20 },
    { value: "shopping", label: "Courses", price: 18 },
    { value: "admin", label: "Aide administrative", price: 25 },
    { value: "elderly", label: "Aide aux seniors", price: 24 },
    { value: "pet", label: "Garde d'animaux", price: 20 },
    { value: "handyman", label: "Petits travaux", price: 28 },
    { value: "personal", label: "Assistant personnel", price: 30 }
  ];

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  const getServicePrice = () => {
    const service = serviceTypes.find(s => s.value === serviceType);
    return service ? service.price : 25;
  };

  const getTotalPrice = () => {
    return getServicePrice() * hours;
  };

  const handleBooking = () => {
    if (!selectedDate || !startTime || !serviceType || !address) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (hours < 2) {
      toast({
        title: "Durée insuffisante",
        description: "Durée minimum : 2 heures par service",
        variant: "destructive",
      });
      return;
    }

    const service = serviceTypes.find(s => s.value === serviceType);
    if (!service) return;

    addToCart({
      serviceName: `${service.label} - ${hours}h`,
      packageTitle: "Réservation personnalisée",
      price: getTotalPrice(),
      description: `${format(selectedDate, "dd/MM/yyyy", { locale: fr })} à ${startTime} - ${address}`,
      customBooking: {
        date: selectedDate,
        time: startTime,
        hours,
        address,
        notes
      }
    });

    toast({
      title: "Service ajouté",
      description: `${service.label} (${hours}h) ajouté au panier`,
    });

    // Reset form
    setSelectedDate(undefined);
    setStartTime("");
    setHours(2);
    setAddress("");
    setNotes("");
    setServiceType("");
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-foreground">Réservation par heures</h3>
        <p className="text-muted-foreground">
          Choisissez exactement le nombre d'heures et le jour qui vous conviennent
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Type de service */}
        <div className="space-y-2">
          <Label htmlFor="service-type" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Type de service *
          </Label>
          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un type de service" />
            </SelectTrigger>
            <SelectContent>
              {serviceTypes.map((service) => (
                <SelectItem key={service.value} value={service.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{service.label}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {service.price}€/h
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Date souhaitée *
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : "Choisir une date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Heure et durée */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Heure de début *</Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger>
                <SelectValue placeholder="Heure" />
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

          <div className="space-y-2">
            <Label>Nombre d'heures * (minimum 2h)</Label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHours(Math.max(2, hours - 1))}
                disabled={hours <= 2}
              >
                -
              </Button>
              <Input
                type="number"
                min="2"
                max="12"
                value={hours}
                onChange={(e) => setHours(Math.max(2, parseInt(e.target.value) || 2))}
                className="text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHours(Math.min(12, hours + 1))}
                disabled={hours >= 12}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Adresse */}
        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Adresse *
          </Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Adresse complète pour l'intervention"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes complémentaires</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Précisions sur la prestation souhaitée..."
            rows={3}
          />
        </div>

        {/* Récapitulatif prix */}
        {serviceType && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Service sélectionné:</span>
              <span>{serviceTypes.find(s => s.value === serviceType)?.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Durée:</span>
              <span>{hours}h</span>
            </div>
            <div className="flex items-center justify-between text-lg font-bold border-t pt-2">
              <span className="flex items-center gap-1">
                <Euro className="w-4 h-4" />
                Total:
              </span>
              <span>{getTotalPrice()}€</span>
            </div>
          </div>
        )}

        {/* Bouton de réservation */}
        <Button
          onClick={handleBooking}
          className="w-full"
          size="lg"
          disabled={!selectedDate || !startTime || !serviceType || !address}
        >
          Ajouter au panier
        </Button>
      </Card>
    </div>
  );
};

export default HourlyBooking;