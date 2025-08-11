import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  MapPin, 
  Calendar,
  PlayCircle,
  StopCircle,
  Camera,
  MessageSquare,
  Star
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  address: string;
  total_price: number;
  status: string;
  assigned_at?: string;
  confirmed_at?: string;
  started_at?: string;
  completed_at?: string;
  check_in_location?: string;
  check_out_location?: string;
  before_photos?: string[];
  after_photos?: string[];
  provider_notes?: string;
  service: {
    name: string;
  };
}

export const WorkflowStatusTracker = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
    setupRealtimeListener();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos réservations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListener = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const channel = supabase
      .channel('booking-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `client_id=eq.${user.id}`
        },
        () => {
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getStatusStep = (booking: Booking) => {
    const steps = [
      { key: 'pending', label: 'Commande reçue', completed: true },
      { key: 'assigned', label: 'Prestataire assigné', completed: booking.assigned_at ? true : false },
      { key: 'confirmed', label: 'Confirmé', completed: booking.confirmed_at ? true : false },
      { key: 'in_progress', label: 'En cours', completed: booking.started_at ? true : false },
      { key: 'completed', label: 'Terminé', completed: booking.completed_at ? true : false }
    ];

    const currentStep = steps.findIndex(step => step.completed === false);
    const progress = currentStep === -1 ? 100 : (currentStep / steps.length) * 100;

    return { steps, progress, currentStep: currentStep === -1 ? steps.length - 1 : currentStep };
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { variant: 'secondary' as const, text: 'En attente', icon: Clock },
      assigned: { variant: 'default' as const, text: 'Assigné', icon: User },
      confirmed: { variant: 'default' as const, text: 'Confirmé', icon: CheckCircle },
      in_progress: { variant: 'default' as const, text: 'En cours', icon: PlayCircle },
      completed: { variant: 'default' as const, text: 'Terminé', icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, text: 'Annulé', icon: XCircle }
    };
    
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const filteredBookings = bookings.filter(booking => {
    switch (activeTab) {
      case 'pending':
        return ['pending', 'assigned'].includes(booking.status);
      case 'confirmed':
        return booking.status === 'confirmed';
      case 'in_progress':
        return booking.status === 'in_progress';
      case 'completed':
        return booking.status === 'completed';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Suivi de vos demandes</h2>
        <p className="text-muted-foreground">Suivez le statut de vos prestations en temps réel</p>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            En attente ({bookings.filter(b => ['pending', 'assigned'].includes(b.status)).length})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Confirmées ({bookings.filter(b => b.status === 'confirmed').length})
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            En cours ({bookings.filter(b => b.status === 'in_progress').length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <StopCircle className="w-4 h-4" />
            Terminées ({bookings.filter(b => b.status === 'completed').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {activeTab === 'pending' && "Aucune demande en attente"}
                  {activeTab === 'confirmed' && "Aucune prestation confirmée"}
                  {activeTab === 'in_progress' && "Aucune prestation en cours"}
                  {activeTab === 'completed' && "Aucune prestation terminée"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => {
              const { steps, progress } = getStatusStep(booking);
              
              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-3">
                          {booking.service?.name}
                          {getStatusBadge(booking.status)}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(booking.booking_date), 'dd MMMM yyyy', { locale: fr })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {booking.start_time} - {booking.end_time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {booking.address}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{booking.total_price}€</div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Barre de progression */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progression</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Étapes du workflow */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {steps.map((step, index) => (
                        <div key={step.key} className="text-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                            step.completed 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {step.completed ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <span className="text-xs">{index + 1}</span>
                            )}
                          </div>
                          <div className={`text-xs ${
                            step.completed ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }`}>
                            {step.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Détails spécifiques selon le statut */}
                    {booking.status === 'completed' && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
                        <h4 className="font-medium">Prestation terminée</h4>
                        
                        {booking.provider_notes && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Notes du prestataire:</p>
                            <p className="text-sm">{booking.provider_notes}</p>
                          </div>
                        )}

                        {booking.after_photos && booking.after_photos.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Photos après intervention:</p>
                            <div className="flex gap-2">
                              {booking.after_photos.slice(0, 3).map((photo, idx) => (
                                <div key={idx} className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                  <Camera className="w-6 h-6 text-muted-foreground" />
                                </div>
                              ))}
                              {booking.after_photos.length > 3 && (
                                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                  <span className="text-xs">+{booking.after_photos.length - 3}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <Button variant="outline" size="sm" className="w-full">
                          <Star className="w-4 h-4 mr-2" />
                          Laisser un avis
                        </Button>
                      </div>
                    )}

                    {booking.status === 'in_progress' && (
                      <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-2 text-primary">
                          <PlayCircle className="w-4 h-4" />
                          <span className="font-medium">Prestation en cours</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Votre prestataire a commencé la prestation à {booking.started_at && format(new Date(booking.started_at), 'HH:mm')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};