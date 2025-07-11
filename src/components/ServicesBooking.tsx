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
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  }>>([]);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [currentSlot, setCurrentSlot] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    startTime: "",
    endTime: ""
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

  // Suppression du système anti-superposition pour permettre la flexibilité

  const addTimeSlot = () => {
    if (!currentSlot.startDate || !currentSlot.endDate || !currentSlot.startTime || !currentSlot.endTime) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs de la plage",
        variant: "destructive",
      });
      return;
    }

    if (currentSlot.endDate < currentSlot.startDate) {
      toast({
        title: "Erreur",
        description: "La date de fin doit être postérieure à la date de début",
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

    // Autoriser les réservations multiples même pour le même service à des heures différentes

    setTimeSlots([...timeSlots, {
      startDate: currentSlot.startDate,
      endDate: currentSlot.endDate,
      startTime: currentSlot.startTime,
      endTime: currentSlot.endTime
    }]);

    setCurrentSlot({
      startDate: undefined,
      endDate: undefined,
      startTime: "",
      endTime: ""
    });

    toast({
      title: "Plage ajoutée",
      description: "La plage de dates a été ajoutée avec succès",
    });
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const getTotalPrice = () => {
    if (!selectedService) return 0;
    return timeSlots.reduce((total, slot) => {
      const startHour = parseInt(slot.startTime.split(':')[0]);
      const endHour = parseInt(slot.endTime.split(':')[0]);
      const hours = endHour - startHour;
      const daysDiff = Math.ceil((slot.endDate.getTime() - slot.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return total + (selectedService.price_per_hour * hours * daysDiff);
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
        booking_date: format(timeSlots[0].startDate, 'yyyy-MM-dd'),
        start_time: timeSlots[0].startTime,
        end_time: timeSlots[0].endTime,
        total_price: getTotalPrice(),
        address: location,
        notes: notes || null,
        status: 'pending'
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Créer les créneaux multiples pour chaque jour de la plage
      const slotsData: any[] = [];
      timeSlots.forEach(slot => {
        const current = new Date(slot.startDate);
        const end = new Date(slot.endDate);
        
        while (current <= end) {
          slotsData.push({
            booking_id: booking.id,
            booking_date: format(current, 'yyyy-MM-dd'),
            start_time: slot.startTime,
            end_time: slot.endTime
          });
          current.setDate(current.getDate() + 1);
        }
      });

      const { error: slotsError } = await supabase
        .from('booking_slots')
        .insert(slotsData);

      if (slotsError) throw slotsError;

      toast({
        title: "Demande envoyée",
        description: `Votre demande de prestation avec ${timeSlots.length} créneau(x) a été envoyée. Notre équipe vous assignera un prestataire adapté.`,
      });

      setIsBookingDialogOpen(false);
      setShowBookingInterface(false);
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
      startDate: undefined,
      endDate: undefined,
      startTime: "",
      endTime: ""
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

                  {/* Plages de réservation */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Plages de prestation</Label>
                    <Badge variant="outline">{timeSlots.length} plage(s)</Badge>
                  </div>

                  {/* Plages existantes */}
                  {timeSlots.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Plages ajoutées :</Label>
                      {timeSlots.map((slot, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-primary" />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                Du {format(slot.startDate, "dd/MM", { locale: fr })} au {format(slot.endDate, "dd/MM/yyyy", { locale: fr })}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
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

                  {/* Ajouter une nouvelle plage */}
                  <div className="p-4 border-2 border-dashed border-border rounded-lg space-y-4">
                    <Label className="text-sm font-medium">Ajouter une plage :</Label>
                    
                    <div className="grid gap-4">
                      {/* Dates de début et fin */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date de début</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {currentSlot.startDate ? format(currentSlot.startDate, "PPP", { locale: fr }) : "Date début"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={currentSlot.startDate}
                                onSelect={(date) => setCurrentSlot({...currentSlot, startDate: date})}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Date de fin</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {currentSlot.endDate ? format(currentSlot.endDate, "PPP", { locale: fr }) : "Date fin"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={currentSlot.endDate}
                                onSelect={(date) => setCurrentSlot({...currentSlot, endDate: date})}
                                disabled={(date) => date < new Date() || (currentSlot.startDate && date < currentSlot.startDate)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Heures de début et fin */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Heure de début</Label>
                          <Select 
                            value={currentSlot.startTime} 
                            onValueChange={(value) => setCurrentSlot({...currentSlot, startTime: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Heure début" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTimeSlots.map((time) => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Heure de fin</Label>
                          <Select 
                            value={currentSlot.endTime} 
                            onValueChange={(value) => setCurrentSlot({...currentSlot, endTime: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Heure fin" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTimeSlots.map((time) => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button 
                        onClick={addTimeSlot} 
                        variant="outline" 
                        className="w-full"
                      >
                        Ajouter cette plage
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
                         {timeSlots.map((slot, index) => {
                           const startHour = parseInt(slot.startTime.split(':')[0]);
                           const endHour = parseInt(slot.endTime.split(':')[0]);
                           const hours = endHour - startHour;
                           const daysDiff = Math.ceil((slot.endDate.getTime() - slot.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                           return (
                             <div key={index} className="flex justify-between">
                               <span>Plage {index + 1}: {hours}h x {daysDiff} jour(s)</span>
                               <span>{selectedService.price_per_hour * hours * daysDiff}€</span>
                             </div>
                           );
                         })}
                         <div className="border-t pt-1 flex justify-between font-medium">
                           <span>Total</span>
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