import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Euro,
  Eye,
  MessageSquare,
  Phone
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  location: string;
  notes: string | null;
  total_price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  created_at: string;
  client: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  service: {
    name: string;
    description: string;
  } | null;
}

export const BookingManagement = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();
  const { createNotification } = useNotifications();

  useEffect(() => {
    loadBookings();
    setupRealtimeListener();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer l'ID du prestataire
      const { data: provider } = await (supabase as any)
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!provider) return;

      const { data, error } = await (supabase as any)
        .from('bookings')
        .select(`
          *,
          client:profiles!bookings_user_id_fkey(first_name, last_name),
          service:services(name, description)
        `)
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListener = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: provider } = await (supabase as any)
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!provider) return;

    // Écouter les nouvelles réservations
    const channel = supabase
      .channel('booking-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `provider_id=eq.${provider.id}`
        },
        () => {
          loadBookings();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `provider_id=eq.${provider.id}`
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

  const updateBookingStatus = async (bookingId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await (supabase as any)
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      // Créer une notification pour le client
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        const { data: clientData } = await (supabase as any)
          .from('bookings')
          .select('user_id')
          .eq('id', bookingId)
          .single();

        if (clientData) {
          await createNotification(
            clientData.user_id,
            status === 'accepted' ? 'Réservation acceptée' : 'Réservation refusée',
            status === 'accepted' 
              ? `Votre réservation pour ${booking.service?.name} a été acceptée`
              : `Votre réservation pour ${booking.service?.name} a été refusée`,
            status === 'accepted' ? 'booking_accepted' : 'booking_rejected',
            bookingId
          );
        }
      }

      await loadBookings();
      
      toast({
        title: status === 'accepted' ? "Réservation acceptée" : "Réservation refusée",
        description: status === 'accepted' 
          ? "La réservation a été acceptée et le client a été notifié"
          : "La réservation a été refusée et le client a été notifié",
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la réservation",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, text: 'En attente' },
      accepted: { variant: 'default' as const, text: 'Acceptée' },
      rejected: { variant: 'destructive' as const, text: 'Refusée' },
      completed: { variant: 'default' as const, text: 'Terminée' },
      cancelled: { variant: 'destructive' as const, text: 'Annulée' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getClientDisplayName = (client: any) => {
    if (client?.first_name && client?.last_name) {
      return `${client.first_name} ${client.last_name}`;
    }
    return "Client";
  };

  const filteredBookings = bookings.filter(booking => {
    switch (activeTab) {
      case 'pending':
        return booking.status === 'pending';
      case 'accepted':
        return booking.status === 'accepted';
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
        <h2 className="text-2xl font-bold text-foreground">Gestion des réservations</h2>
        <p className="text-muted-foreground">Gérez vos demandes de réservation</p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => b.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acceptées</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => b.status === 'accepted').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Terminées</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenus</p>
                <p className="text-2xl font-bold">
                  {bookings
                    .filter(b => b.status === 'completed')
                    .reduce((sum, b) => sum + b.total_price, 0)
                  }€
                </p>
              </div>
              <Euro className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets des réservations */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            En attente ({bookings.filter(b => b.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Acceptées ({bookings.filter(b => b.status === 'accepted').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Terminées ({bookings.filter(b => b.status === 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Toutes ({bookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {activeTab === 'pending' && "Aucune demande en attente"}
                  {activeTab === 'accepted' && "Aucune réservation acceptée"}
                  {activeTab === 'completed' && "Aucune réservation terminée"}
                  {activeTab === 'all' && "Aucune réservation"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{booking.service?.name}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">{booking.total_price}€</span>
                        </div>
                      </div>

                      {/* Détails */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{getClientDisplayName(booking.client)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {format(new Date(booking.booking_date), 'dd MMMM yyyy', { locale: fr })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{booking.start_time} ({booking.duration_hours}h)</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{booking.location}</span>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="bg-muted/50 p-3 rounded-md">
                          <p className="text-sm text-muted-foreground">
                            <MessageSquare className="w-4 h-4 inline mr-2" />
                            {booking.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedBooking(booking)}>
                            <Eye className="w-4 h-4 mr-1" />
                            Détails
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Détails de la réservation</DialogTitle>
                          </DialogHeader>
                          {selectedBooking && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium">Service</h4>
                                <p className="text-sm text-muted-foreground">{selectedBooking.service?.name}</p>
                              </div>
                              <div>
                                <h4 className="font-medium">Client</h4>
                                <p className="text-sm text-muted-foreground">
                                  {getClientDisplayName(selectedBooking.client)}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium">Date et heure</h4>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(selectedBooking.booking_date), 'dd MMMM yyyy', { locale: fr })} à {selectedBooking.start_time}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium">Durée</h4>
                                <p className="text-sm text-muted-foreground">{selectedBooking.duration_hours} heure(s)</p>
                              </div>
                              <div>
                                <h4 className="font-medium">Lieu</h4>
                                <p className="text-sm text-muted-foreground">{selectedBooking.location}</p>
                              </div>
                              <div>
                                <h4 className="font-medium">Prix total</h4>
                                <p className="text-sm text-muted-foreground">{selectedBooking.total_price}€</p>
                              </div>
                              {selectedBooking.notes && (
                                <div>
                                  <h4 className="font-medium">Notes</h4>
                                  <p className="text-sm text-muted-foreground">{selectedBooking.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>

                    {booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'rejected')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Refuser
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'accepted')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accepter
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};