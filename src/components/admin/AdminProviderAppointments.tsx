import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Appointment {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  address: string;
  notes?: string;
  client_id: string;
  service: {
    name: string;
    category: string;
  };
  client: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
}

interface AdminProviderAppointmentsProps {
  providerId: string;
}

const AdminProviderAppointments = ({ providerId }: AdminProviderAppointmentsProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const { toast } = useToast();

  const loadAppointments = async () => {
    try {
      setLoading(true);
      
      // Récupérer d'abord les bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          status,
          total_price,
          address,
          notes,
          client_id,
          service_id
        `)
        .eq('provider_id', providerId)
        .order('booking_date', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Récupérer les services
      const serviceIds = [...new Set(bookingsData?.map(b => b.service_id).filter(Boolean))];
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name, category')
        .in('id', serviceIds);

      // Récupérer les profils clients
      const clientIds = [...new Set(bookingsData?.map(b => b.client_id).filter(Boolean))];
      const { data: clientsData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, phone')
        .in('user_id', clientIds);

      // Combiner les données
      const formattedData = bookingsData?.map(booking => {
        const service = servicesData?.find(s => s.id === booking.service_id) || 
          { name: 'Service inconnu', category: 'Non défini' };
        const client = clientsData?.find(c => c.user_id === booking.client_id) || 
          { first_name: 'Client', last_name: 'Inconnu' };

        return {
          ...booking,
          service,
          client
        };
      }) || [];

      setAppointments(formattedData);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les rendez-vous",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [providerId, filter]);

  const getStatusBadge = (status: string, date: string) => {
    const isUpcoming = new Date(date) > new Date();
    
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant={isUpcoming ? "default" : "secondary"}>
            {isUpcoming ? 'À venir' : 'Confirmé'}
          </Badge>
        );
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    switch (filter) {
      case 'upcoming':
        return appointment.status === 'confirmed' && new Date(appointment.booking_date) > new Date();
      case 'completed':
        return appointment.status === 'completed';
      case 'cancelled':
        return appointment.status === 'cancelled';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Rendez-vous du prestataire</h2>
        <div className="flex gap-2">
          {(['all', 'upcoming', 'completed', 'cancelled'] as const).map(filterType => (
            <Button
              key={filterType}
              variant={filter === filterType ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filterType)}
            >
              {filterType === 'all' ? 'Tous' :
               filterType === 'upcoming' ? 'À venir' :
               filterType === 'completed' ? 'Terminés' : 'Annulés'}
            </Button>
          ))}
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun rendez-vous trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{appointment.service?.name}</h3>
                      {getStatusBadge(appointment.status, appointment.booking_date)}
                    </div>
                    <p className="text-sm text-muted-foreground">{appointment.service?.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">{appointment.total_price}€</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(appointment.booking_date), 'EEEE dd MMMM yyyy', { locale: fr })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{appointment.start_time} - {appointment.end_time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{appointment.address}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4" />
                      <span>{appointment.client?.first_name} {appointment.client?.last_name}</span>
                    </div>
                    {appointment.client?.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4" />
                        <span>{appointment.client.email}</span>
                      </div>
                    )}
                    {appointment.client?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4" />
                        <span>{appointment.client.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {appointment.notes && (
                  <div className="mt-4 p-3 bg-muted rounded">
                    <p className="text-sm"><strong>Notes:</strong> {appointment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProviderAppointments;