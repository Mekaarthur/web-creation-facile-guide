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
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState("");
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
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
        dateTime: date && timeSlot ? new Date(`${format(date, 'yyyy-MM-dd')}T${timeSlot}:00`) : undefined
      };
      
      findMatchingProviders(filters);
    };

    window.addEventListener('selectService', handleServiceSelection);
    
    return () => {
      window.removeEventListener('selectService', handleServiceSelection);
    };
  }, [minRating, maxPrice, date, timeSlot]);

  const handleFiltersChange = () => {
    if (selectedService) {
      const filters = {
        serviceId: selectedService.id,
        minRating: minRating || undefined,
        maxPrice: maxPrice || undefined,
        dateTime: date && timeSlot ? new Date(`${format(date, 'yyyy-MM-dd')}T${timeSlot}:00`) : undefined
      };
      
      findMatchingProviders(filters);
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedProvider || !date || !timeSlot || !duration || !location) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
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

      const bookingData = {
        user_id: user.id,
        provider_id: selectedProvider.id,
        service_id: selectedService.id,
        booking_date: format(date, 'yyyy-MM-dd'),
        start_time: timeSlot,
        duration_hours: parseInt(duration),
        location: location,
        notes: notes || null,
        total_price: getProviderPrice(selectedProvider, selectedService.id) * parseInt(duration),
        status: 'pending'
      };

      const { error } = await (supabase as any)
        .from('bookings')
        .insert([bookingData]);

      if (error) throw error;

      // Envoyer notification de confirmation
      await sendBookingConfirmation(
        user.email,
        user.user_metadata?.first_name || user.email,
        {
          id: 'temp-id', // Sera remplacé par l'ID réel de la DB
          serviceName: selectedService.name,
          date: format(date, 'yyyy-MM-dd'),
          time: timeSlot,
          location: location,
          price: getProviderPrice(selectedProvider, selectedService.id) * parseInt(duration)
        }
      );

      toast({
        title: "Réservation confirmée",
        description: "Votre demande de réservation a été envoyée au prestataire et vous recevrez un email de confirmation",
      });

      setIsBookingDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la réservation",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedService(null);
    setSelectedProvider(null);
    setDate(undefined);
    setTimeSlot("");
    setDuration("");
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

  const timeSlots = [
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

                {/* Sélection du prestataire avec matching score */}
                <div className="space-y-2">
                  <Label>Prestataires recommandés</Label>
                  
                  {showMap ? (
                    <MapView
                      providers={providers.map(p => ({ 
                        ...p, 
                        profiles: p.profiles || null,
                        provider_services: p.provider_services || [],
                        provider_availability: p.provider_availability || [],
                        provider_documents: p.provider_documents || []
                      }))}
                      selectedServiceId={selectedService?.id}
                      onProviderSelect={(provider) => setSelectedProvider(provider)}
                    />
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {providers.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Aucun prestataire disponible pour ce service
                        </div>
                      ) : (
                        providers.map((provider, index) => {
                          const price = getProviderPrice(provider, selectedService?.id || '');
                          const isAvailable = date && timeSlot ? 
                            isProviderAvailable(provider, new Date(`${format(date, 'yyyy-MM-dd')}T${timeSlot}:00`)) : 
                            true;
                          
                          return (
                            <Card 
                              key={provider.id} 
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                selectedProvider?.id === provider.id ? 'ring-2 ring-primary' : ''
                              } ${index === 0 ? 'bg-primary/5 border-primary/20' : ''}`}
                              onClick={() => setSelectedProvider(provider)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{getProviderDisplayName(provider)}</span>
                                      {index === 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          <Zap className="w-3 h-3 mr-1" />
                                          Recommandé
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                      {provider.rating && (
                                        <div className="flex items-center gap-1">
                                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                          <span>{provider.rating}</span>
                                        </div>
                                      )}
                                      
                                      <div className="flex items-center gap-1">
                                        <Euro className="w-3 h-3" />
                                        <span className="font-medium">{price}€/h</span>
                                      </div>
                                      
                                      {provider.location && (
                                        <div className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          <span className="truncate max-w-24">{provider.location}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {!isAvailable && date && timeSlot && (
                                      <Badge variant="destructive" className="text-xs mt-1">
                                        Non disponible à cette heure
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  )}
                  
                  {/* Avis du prestataire sélectionné */}
                  {selectedProvider && (
                    <div className="mt-4">
                      <ReviewSystem 
                        providerId={selectedProvider.id}
                        mode="display"
                      />
                    </div>
                  )}
                </div>

                {/* Sélection de la date */}
                <div className="space-y-2">
                  <Label>Date de la prestation</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: fr }) : "Choisir une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
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

                {/* Créneau horaire */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Heure de début</Label>
                    <Select value={timeSlot} onValueChange={setTimeSlot}>
                      <SelectTrigger>
                        <SelectValue placeholder="Heure" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Durée (heures)</Label>
                    <Select value={duration} onValueChange={setDuration}>
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
                {selectedService && duration && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Prix estimé :</span>
                      <span className="text-xl font-bold text-primary">
                        {selectedProvider && selectedService ? 
                          getProviderPrice(selectedProvider, selectedService.id) * parseInt(duration || "0") :
                          selectedService.price_per_hour * parseInt(duration || "0")
                        }€
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedProvider ? getProviderPrice(selectedProvider, selectedService.id) : selectedService.price_per_hour}€/h × {duration}h
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleBooking}>
                  Confirmer la réservation
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