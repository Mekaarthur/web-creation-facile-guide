import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, Star, Euro, Filter, Zap, Navigation } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendBookingConfirmation } from "@/utils/notifications";
import { useProviderMatching } from "@/hooks/useProviderMatching";
import { MapView } from "@/components/MapView";
import { ReviewSystem } from "@/components/ReviewSystem";

interface LocalProvider {
  id: string;
  user_id: string;
  business_name: string | null;
  description: string | null;
  hourly_rate: number | null;
  rating: number | null;
  location: string | null;
  is_verified: boolean;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const ServicesBooking = () => {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<LocalProvider | null>(null);
  const [showBookingInterface, setShowBookingInterface] = useState(false);
  const [timeSlots, setTimeSlots] = useState<Array<{
    date: Date;
    startTime: string;
    duration: string;
  }>>([]);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [currentSlot, setCurrentSlot] = useState({
    date: undefined as Date | undefined,
    startTime: "",
    duration: ""
  });
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const { toast } = useToast();
  
  const {
    providers,
    services,
    loading,
    error,
    findMatchingProviders,
    getProviderPrice,
    isProviderAvailable
  } = useProviderMatching();

  useEffect(() => {
    // Charger tous les prestataires au démarrage
    findMatchingProviders();
    
    // Écouter l'événement de sélection de service depuis les packages
    const handleServiceSelection = (event: any) => {
      const serviceData = event.detail;
      setSelectedService(serviceData);
      setShowBookingInterface(true);
      setIsBookingDialogOpen(true);
      
      // Filtrer les prestataires pour ce service
      const filters = {
        serviceId: serviceData.id,
        minRating: minRating || undefined,
        maxPrice: maxPrice || undefined,
        dateTime: undefined
      };
      
      findMatchingProviders(filters);
    };

    window.addEventListener('selectService', handleServiceSelection);
    
    return () => {
      window.removeEventListener('selectService', handleServiceSelection);
    };
  }, [minRating, maxPrice]);

  const handleFiltersChange = () => {
    if (selectedService) {
      const filters = {
        serviceId: selectedService.id,
        minRating: minRating || undefined,
        maxPrice: maxPrice || undefined,
        dateTime: undefined
      };
      
      findMatchingProviders(filters);
    }
  };

  const addTimeSlot = () => {
    if (!currentSlot.date || !currentSlot.startTime || !currentSlot.duration) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs du créneau",
        variant: "destructive",
      });
      return;
    }

    setTimeSlots([...timeSlots, {
      date: currentSlot.date,
      startTime: currentSlot.startTime,
      duration: currentSlot.duration
    }]);

    setCurrentSlot({
      date: undefined,
      startTime: "",
      duration: ""
    });
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const getTotalPrice = () => {
    if (!selectedService) return 0;
    return timeSlots.reduce((total, slot) => {
      return total + (selectedService.price_per_hour * parseInt(slot.duration));
    }, 0);
  };

  const handleBooking = async () => {
    if (!selectedService || timeSlots.length === 0 || !location) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un créneau et renseigner l'adresse",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour réserver",
          variant: "destructive",
        });
        return;
      }

      // Créer la réservation principale
      const bookingData = {
        client_id: user.id,
        provider_id: null, // Sera assigné par l'équipe
        service_id: selectedService.id,
        booking_date: format(timeSlots[0].date, 'yyyy-MM-dd'),
        start_time: timeSlots[0].startTime,
        end_time: `${String(parseInt(timeSlots[0].startTime.split(':')[0]) + parseInt(timeSlots[0].duration)).padStart(2, '0')}:${timeSlots[0].startTime.split(':')[1]}`,
        total_price: getTotalPrice(),
        location: location,
        notes: notes || null,
        status: 'pending'
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Créer les créneaux multiples
      const slotsData = timeSlots.map(slot => ({
        booking_id: booking.id,
        booking_date: format(slot.date, 'yyyy-MM-dd'),
        start_time: slot.startTime,
        end_time: `${String(parseInt(slot.startTime.split(':')[0]) + parseInt(slot.duration)).padStart(2, '0')}:${slot.startTime.split(':')[1]}`
      }));

      const { error: slotsError } = await supabase
        .from('booking_slots')
        .insert(slotsData);

      if (slotsError) throw slotsError;

      toast({
        title: "Demande envoyée",
        description: `Votre demande de prestation avec ${timeSlots.length} créneau(x) a été envoyée. Notre équipe vous assignera un prestataire adapté.`,
      });

      setIsBookingDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de votre demande",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedService(null);
    setSelectedProvider(null);
    setTimeSlots([]);
    setCurrentSlot({
      date: undefined,
      startTime: "",
      duration: ""
    });
    setLocation("");
    setNotes("");
  };

  const getProviderDisplayName = (provider: LocalProvider) => {
    if (provider.business_name) return provider.business_name;
    if (provider.profiles?.first_name && provider.profiles?.last_name) {
      return `${provider.profiles.first_name} ${provider.profiles.last_name}`;
    }
    return "Prestataire";
  };

  const availableTimeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
  ];

  if (loading) {
    return (
      <div className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement des services...</p>
          </div>
        </div>
      </div>
    );
  }

  // Ne pas afficher la section si aucun service n'est sélectionné
  if (!showBookingInterface) {
    return null;
  }

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Star className="w-4 h-4" />
            <span>Réserver un service</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Finaliser votre réservation
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              {selectedService?.name} - {selectedService?.package}
            </span>
          </h2>
        </div>

        {/* Interface de réservation directe */}
        <div className="max-w-2xl mx-auto">
          <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Réserver - {selectedService?.name}</DialogTitle>
                <DialogDescription>
                  Remplissez les informations ci-dessous pour réserver votre prestation
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                {/* Filtres de matching */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Matching automatique activé
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter className="w-4 h-4 mr-1" />
                        Filtres
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowMap(!showMap)}
                      >
                        <Navigation className="w-4 h-4 mr-1" />
                        Carte
                      </Button>
                    </div>
                  </div>
                  
                  {showFilters && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                        <Label>Note minimum</Label>
                        <Select value={minRating.toString()} onValueChange={(value) => {
                          setMinRating(parseFloat(value));
                          handleFiltersChange();
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Toutes les notes</SelectItem>
                            <SelectItem value="3">3+ étoiles</SelectItem>
                            <SelectItem value="4">4+ étoiles</SelectItem>
                            <SelectItem value="4.5">4.5+ étoiles</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Prix maximum (€/h)</Label>
                        <Input
                          type="number"
                          value={maxPrice || ""}
                          onChange={(e) => {
                            setMaxPrice(parseFloat(e.target.value) || 0);
                            handleFiltersChange();
                          }}
                          placeholder="Sans limite"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Information sur l'attribution automatique */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <Zap className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-primary">Attribution automatique</p>
                      <p className="text-sm text-muted-foreground">
                        Notre équipe vous assignera automatiquement le meilleur prestataire selon vos critères, votre localisation et les disponibilités.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Créneaux multiples */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Créneaux de prestation</Label>
                    <Badge variant="outline">{timeSlots.length} créneau(x)</Badge>
                  </div>

                  {/* Créneaux existants */}
                  {timeSlots.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Créneaux ajoutés :</Label>
                      {timeSlots.map((slot, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="font-medium">
                              {format(slot.date, "EEEE dd MMMM", { locale: fr })}
                            </span>
                            <span className="text-muted-foreground">
                              {slot.startTime} - {String(parseInt(slot.startTime.split(':')[0]) + parseInt(slot.duration)).padStart(2, '0')}:{slot.startTime.split(':')[1]}
                            </span>
                            <Badge variant="secondary">{slot.duration}h</Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeTimeSlot(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ajouter un nouveau créneau */}
                  <div className="p-4 border-2 border-dashed border-border rounded-lg space-y-4">
                    <Label className="text-sm font-medium">Ajouter un créneau :</Label>
                    
                    <div className="grid gap-4">
                      {/* Date */}
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {currentSlot.date ? format(currentSlot.date, "PPP", { locale: fr }) : "Choisir une date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
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

                      {/* Heure et durée */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Heure de début</Label>
                          <Select 
                            value={currentSlot.startTime} 
                            onValueChange={(value) => setCurrentSlot({...currentSlot, startTime: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Heure" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTimeSlots.map((time) => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Durée (heures)</Label>
                          <Select 
                            value={currentSlot.duration} 
                            onValueChange={(value) => setCurrentSlot({...currentSlot, duration: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Durée" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
                                <SelectItem key={hours} value={hours.toString()}>
                                  {hours}h
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={addTimeSlot}
                        disabled={!currentSlot.date || !currentSlot.startTime || !currentSlot.duration}
                        className="w-full"
                      >
                        + Ajouter ce créneau
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Adresse */}
                <div className="space-y-2">
                  <Label htmlFor="location">Adresse de la prestation</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Adresse complète"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Instructions particulières (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Précisions, codes d'accès, instructions spéciales..."
                    rows={3}
                  />
                </div>

                {/* Récapitulatif prix */}
                {selectedService && timeSlots.length > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Prix total estimé :</span>
                        <span className="text-xl font-bold text-primary">
                          {getTotalPrice()}€
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {timeSlots.map((slot, index) => (
                          <div key={index} className="flex justify-between">
                            <span>Créneau {index + 1}: {slot.duration}h</span>
                            <span>{selectedService.price_per_hour * parseInt(slot.duration)}€</span>
                          </div>
                        ))}
                        <div className="border-t pt-1 flex justify-between font-medium">
                          <span>Total: {timeSlots.reduce((sum, slot) => sum + parseInt(slot.duration), 0)}h</span>
                          <span>{getTotalPrice()}€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleBooking}
                  disabled={!selectedService || timeSlots.length === 0 || !location}
                  className="bg-gradient-hero text-white hover:opacity-90"
                >
                  Envoyer ma demande ({timeSlots.length} créneau{timeSlots.length > 1 ? 'x' : ''})
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
};

export default ServicesBooking;