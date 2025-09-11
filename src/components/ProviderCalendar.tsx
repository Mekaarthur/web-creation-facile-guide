import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format, addDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Mission {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  address: string;
  total_price: number;
  services?: { name: string } | null;
  profiles?: { first_name: string; last_name: string } | null;
}

interface Availability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const ProviderCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [missions, setMissions] = useState<Mission[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadCalendarData();
    }
  }, [user]);

  const loadCalendarData = async () => {
    try {
      // Récupérer le profil prestataire
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (providerData) {
        setProvider(providerData);

        // Charger les missions
        const { data: missionsData } = await supabase
          .from('bookings')
          .select(`
            *,
            services(name),
            profiles!bookings_client_id_fkey(first_name, last_name)
          `)
          .eq('provider_id', providerData.id)
          .gte('booking_date', format(new Date(), 'yyyy-MM-dd'))
          .order('booking_date', { ascending: true });

        setMissions((missionsData || []).map((mission: any) => ({
          ...mission,
          services: mission.services || null,
          profiles: mission.profiles || null
        })));

        // Charger les disponibilités
        const { data: availabilityData } = await supabase
          .from('provider_availability')
          .select('*')
          .eq('provider_id', providerData.id)
          .order('day_of_week', { ascending: true });

        setAvailability(availabilityData || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du calendrier",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMissionsForDate = (date: Date) => {
    return missions.filter(mission => 
      isSameDay(new Date(mission.booking_date), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const updateAvailability = async (dayOfWeek: number, startTime: string, endTime: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('provider_availability')
        .upsert({
          provider_id: provider.id,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          is_available: isAvailable
        }, {
          onConflict: 'provider_id,day_of_week'
        });

      if (error) throw error;

      toast({
        title: "Disponibilité mise à jour",
        description: "Vos horaires ont été enregistrés avec succès",
      });

      loadCalendarData();
      setShowAvailabilityDialog(false);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les disponibilités",
        variant: "destructive",
      });
    }
  };

  const getDayAvailability = (dayOfWeek: number) => {
    return availability.find(a => a.day_of_week === dayOfWeek);
  };

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions rapides */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Planning interactif</h3>
        <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Gérer mes disponibilités
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Mes disponibilités hebdomadaires</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {dayNames.map((dayName, index) => {
                const dayAvailability = getDayAvailability(index);
                return (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{dayName}</h4>
                      <Badge variant={dayAvailability?.is_available ? "default" : "secondary"}>
                        {dayAvailability?.is_available ? "Disponible" : "Non disponible"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`start-${index}`}>Heure de début</Label>
                        <Input
                          id={`start-${index}`}
                          type="time"
                          defaultValue={dayAvailability?.start_time || "09:00"}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`end-${index}`}>Heure de fin</Label>
                        <Input
                          id={`end-${index}`}
                          type="time"
                          defaultValue={dayAvailability?.end_time || "17:00"}
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() => {
                        const startInput = document.getElementById(`start-${index}`) as HTMLInputElement;
                        const endInput = document.getElementById(`end-${index}`) as HTMLInputElement;
                        updateAvailability(
                          index,
                          startInput.value,
                          endInput.value,
                          !dayAvailability?.is_available
                        );
                      }}
                    >
                      {dayAvailability?.is_available ? "Marquer indisponible" : "Marquer disponible"}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendrier */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              {format(selectedDate, 'MMMM yyyy', { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={fr}
              className="pointer-events-auto"
              modifiers={{
                hasMissions: (date) => getMissionsForDate(date).length > 0
              }}
              modifiersStyles={{
                hasMissions: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold'
                }
              }}
            />
            <div className="mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded"></div>
                <span>Jours avec missions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missions du jour sélectionné */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getMissionsForDate(selectedDate).length > 0 ? (
              <div className="space-y-4">
                {getMissionsForDate(selectedDate).map((mission) => (
                  <div key={mission.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getStatusColor(mission.status)}>
                        {getStatusLabel(mission.status)}
                      </Badge>
                      <span className="font-bold text-sm">{formatCurrency(mission.total_price)}</span>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{mission.services?.name}</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {mission.start_time} - {mission.end_time}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {mission.profiles?.first_name} {mission.profiles?.last_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {mission.address || 'Adresse à confirmer'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground text-sm">Aucune mission ce jour</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vue d'ensemble de la semaine */}
      <Card>
        <CardHeader>
          <CardTitle>Aperçu de la semaine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {eachDayOfInterval({
              start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
              end: endOfWeek(selectedDate, { weekStartsOn: 1 })
            }).map((day) => {
              const dayMissions = getMissionsForDate(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              
              return (
                <div 
                  key={day.toISOString()}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted",
                    isToday && "border-primary bg-primary/5",
                    isSelected && "bg-primary/10"
                  )}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      {format(day, 'EEE', { locale: fr })}
                    </p>
                    <p className={cn(
                      "text-sm font-medium",
                      isToday && "text-primary font-bold"
                    )}>
                      {format(day, 'd')}
                    </p>
                    {dayMissions.length > 0 && (
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {dayMissions.length}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderCalendar;