import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, MapPin, Star, Euro } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendBookingConfirmation } from "@/utils/notifications";

interface Service {
  id: string;
  name: string;
  description: string;
  price_per_hour: number;
  category: string;
  is_active: boolean;
}

interface Provider {
  id: string;
  user_id: string;
  business_name: string | null;
  description: string | null;
  hourly_rate: number | null;
  rating: number | null;
  location: string | null;
  is_verified: boolean;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const ServicesBooking = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState("");
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadServices();
    loadProviders();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
    }
  };

  const loadProviders = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('providers')
        .select(`
          *,
          profiles(first_name, last_name)
        `)
        .eq('is_verified', true)
        .order('rating', { ascending: false });
      
      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des prestataires:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedProvider(null);
    setIsBookingDialogOpen(true);
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
        total_price: selectedService.price_per_hour * parseInt(duration),
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
          price: selectedService.price_per_hour * parseInt(duration)
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

  const getProviderDisplayName = (provider: Provider) => {
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
            Choisissez votre service
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              et réservez en quelques clics
            </span>
          </h2>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-glow transition-all duration-300 hover:scale-[1.02] group">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{service.name}</span>
                  <Badge variant="secondary">{service.category}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">{service.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-primary">
                    <Euro className="w-4 h-4" />
                    <span className="font-semibold">{service.price_per_hour}€/h</span>
                  </div>
                </div>

                <Dialog open={isBookingDialogOpen && selectedService?.id === service.id} onOpenChange={setIsBookingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full"
                      onClick={() => handleServiceSelect(service)}
                    >
                      Réserver ce service
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Réserver - {selectedService?.name}</DialogTitle>
                      <DialogDescription>
                        Remplissez les informations ci-dessous pour réserver votre prestation
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                      {/* Sélection du prestataire */}
                      <div className="space-y-2">
                        <Label>Choisir un prestataire</Label>
                        <Select value={selectedProvider?.id || ""} onValueChange={(value) => {
                          const provider = providers.find(p => p.id === value);
                          setSelectedProvider(provider || null);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un prestataire" />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{getProviderDisplayName(provider)}</span>
                                  <div className="flex items-center gap-2 ml-4">
                                    {provider.rating && (
                                      <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        <span className="text-xs">{provider.rating}</span>
                                      </div>
                                    )}
                                    {provider.hourly_rate && (
                                      <span className="text-xs text-muted-foreground">
                                        {provider.hourly_rate}€/h
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                              {selectedService.price_per_hour * parseInt(duration || "0")}€
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedService.price_per_hour}€/h × {duration}h
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesBooking;