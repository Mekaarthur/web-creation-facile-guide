import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, Euro, Star, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendBookingAccepted, sendBookingRejected } from "@/utils/notifications";

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  location: string;
  notes: string | null;
  total_price: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  services: {
    name: string;
    category: string;
  } | null;
  providers: {
    business_name: string | null;
    profiles: {
      first_name: string | null;
      last_name: string | null;
    } | null;
  } | null;
}

interface BookingsListProps {
  userType: 'client' | 'provider';
}

const BookingsList = ({ userType }: BookingsListProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
  }, [userType]);

  const loadBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      let query = (supabase as any)
        .from('bookings')
        .select(`
          *,
          services(name, category),
          providers(
            business_name,
            profiles(first_name, last_name)
          )
        `);

      if (userType === 'client') {
        query = query.eq('user_id', user.id);
      } else {
        // Pour les prestataires, on récupère les réservations de leurs services
        const { data: providerData } = await (supabase as any)
          .from('providers')
          .select('id')
          .eq('user_id', user.id)
          .single();
          
        if (providerData) {
          query = query.eq('provider_id', providerData.id);
        }
      }

      const { data, error } = await query.order('booking_date', { ascending: false });
      
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case 'confirmed': return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case 'in_progress': return "bg-primary/10 text-primary border-primary/20";
      case 'completed': return "bg-green-500/10 text-green-700 border-green-500/20";
      case 'cancelled': return "bg-red-500/10 text-red-700 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return "En attente";
      case 'confirmed': return "Confirmé";
      case 'in_progress': return "En cours";
      case 'completed': return "Terminé";
      case 'cancelled': return "Annulé";
      default: return status;
    }
  };

  const getProviderDisplayName = (booking: Booking) => {
    if (booking.providers?.business_name) return booking.providers.business_name;
    if (booking.providers?.profiles?.first_name && booking.providers?.profiles?.last_name) {
      return `${booking.providers.profiles.first_name} ${booking.providers.profiles.last_name}`;
    }
    return "Prestataire";
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await (supabase as any)
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      // Envoyer notification selon le statut
      const booking = bookings.find(b => b.id === bookingId);
      if (booking && userType === 'provider') {
        const { data: { user } } = await supabase.auth.getUser();
        const clientEmail = 'client@example.com'; // À récupérer depuis la DB
        const clientName = 'Client'; // À récupérer depuis la DB

        if (newStatus === 'confirmed') {
          await sendBookingAccepted(clientEmail, clientName, {
            id: booking.id,
            serviceName: booking.services?.name || 'Service',
            date: booking.booking_date,
            time: booking.start_time,
            location: booking.location,
            providerName: booking.providers?.business_name || 'Prestataire',
            price: booking.total_price
          });
        } else if (newStatus === 'cancelled') {
          await sendBookingRejected(clientEmail, clientName, {
            id: booking.id,
            serviceName: booking.services?.name || 'Service',
            date: booking.booking_date,
            time: booking.start_time,
            location: booking.location,
            price: booking.total_price
          });
        }
      }

      toast({
        title: "Statut mis à jour",
        description: `La réservation a été ${getStatusText(newStatus).toLowerCase()}`,
      });

      loadBookings();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Aucune réservation
          </h3>
          <p className="text-muted-foreground">
            {userType === 'client' 
              ? "Vous n'avez pas encore de réservation"
              : "Aucune réservation reçue pour le moment"
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="hover:shadow-soft transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {booking.services?.name || "Service"}
                  </h3>
                  <Badge variant="secondary">{booking.services?.category}</Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(booking.booking_date), "PPP", { locale: fr })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{booking.start_time} ({booking.duration_hours}h)</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{booking.location}</span>
                </div>

                {userType === 'client' && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{getProviderDisplayName(booking)}</span>
                  </div>
                )}

                {booking.notes && (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <p className="text-muted-foreground">
                      <MessageCircle className="w-4 h-4 inline mr-1" />
                      {booking.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="text-right space-y-2">
                <Badge className={getStatusColor(booking.status)}>
                  {getStatusText(booking.status)}
                </Badge>
                <div className="flex items-center gap-1 text-lg font-semibold text-foreground">
                  <Euro className="w-4 h-4" />
                  <span>{booking.total_price}€</span>
                </div>
              </div>
            </div>

          <div className="flex gap-2 pt-4 border-t border-border">
              <Button variant="outline" size="sm">
                Voir détails
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  // Navigation vers la page de messages
                  window.location.href = `/messages?booking=${booking.id}`;
                }}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Chat
              </Button>
              
              {userType === 'provider' && booking.status === 'pending' && (
                <>
                  <Button 
                    size="sm" 
                    onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                  >
                    Accepter
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                  >
                    Refuser
                  </Button>
                </>
              )}

              {userType === 'provider' && booking.status === 'confirmed' && (
                <Button 
                  size="sm"
                  onClick={() => updateBookingStatus(booking.id, 'in_progress')}
                >
                  Commencer
                </Button>
              )}

              {userType === 'provider' && booking.status === 'in_progress' && (
                <Button 
                  size="sm"
                  onClick={() => updateBookingStatus(booking.id, 'completed')}
                >
                  Terminer
                </Button>
              )}

              {userType === 'client' && booking.status === 'pending' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                >
                  Annuler
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BookingsList;