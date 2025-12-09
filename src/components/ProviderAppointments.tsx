import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  RotateCcw,
  Eye,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  address: string;
  total_price: number;
  notes?: string;
  services?: { name: string; category: string } | null;
  profiles?: { 
    first_name: string; 
    last_name: string; 
    email: string;
    phone: string;
  } | null;
  created_at: string;
}

const ProviderAppointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'cancelled'>('upcoming');
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    try {
      // Get provider data
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (providerData) {
        setProvider(providerData);

        // Load all appointments
        const { data: appointmentsData } = await supabase
          .from('bookings')
          .select(`
            *,
            services(name, category),
            profiles!bookings_client_id_fkey(first_name, last_name, email, phone)
          `)
          .eq('provider_id', providerData.id)
          .order('booking_date', { ascending: true })
          .order('start_time', { ascending: true });

        setAppointments((appointmentsData || []).map((appointment: any) => ({
          ...appointment,
          services: appointment.services || null,
          profiles: appointment.profiles || null
        })));
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les rendez-vous",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(`${appointment.booking_date}T${appointment.start_time}`);
      
      const matchesSearch = searchTerm === '' ||
        appointment.services?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.address?.toLowerCase().includes(searchTerm.toLowerCase());

      if (statusFilter === 'upcoming') {
        return matchesSearch && 
               appointmentDate >= now && 
               !['cancelled', 'completed'].includes(appointment.status);
      } else {
        return matchesSearch && appointment.status === 'cancelled';
      }
    });
  }, [appointments, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'in_progress': return 'bg-info/10 text-info border-info/20';
      case 'completed': return 'bg-muted text-muted-foreground border-border';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `Le rendez-vous a été ${newStatus === 'confirmed' ? 'confirmé' : 'modifié'}`,
      });

      loadAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Mes Rendez-vous
          </h2>
          <p className="text-muted-foreground">Gérez vos rendez-vous clients</p>
        </div>
        
        {/* Search and filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAppointments}
            className="hover:bg-primary/10"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Tabs for upcoming and cancelled */}
      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'upcoming' | 'cancelled')}>
        <TabsList className="bg-white shadow-sm border">
          <TabsTrigger 
            value="upcoming" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white"
          >
            <Calendar className="h-4 w-4" />
            À venir ({filteredAppointments.length})
          </TabsTrigger>
          <TabsTrigger 
            value="cancelled"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white"
          >
            <XCircle className="h-4 w-4" />
            Annulés
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {filteredAppointments.length > 0 ? (
            <div className="grid gap-4">
              {filteredAppointments.map((appointment) => (
                <Card 
                  key={appointment.id} 
                  className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:-translate-y-1"
                >
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Date and time */}
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                          <Calendar className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">
                            {format(new Date(appointment.booking_date), 'dd MMM', { locale: fr })}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {appointment.start_time} - {appointment.end_time}
                          </div>
                        </div>
                      </div>

                      {/* Service and client info */}
                      <div className="lg:col-span-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{appointment.services?.name}</h3>
                          <Badge className={cn("text-xs", getStatusColor(appointment.status))}>
                            {getStatusLabel(appointment.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{appointment.profiles?.first_name} {appointment.profiles?.last_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{appointment.profiles?.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{appointment.profiles?.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{appointment.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <div className="text-right mb-2">
                          <p className="text-2xl font-bold text-primary">{formatCurrency(appointment.total_price)}</p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {appointment.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirmer
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-blue-50"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contacter
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-gray-50"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Aucun rendez-vous à venir</h3>
                <p className="text-muted-foreground">
                  Vos prochains rendez-vous s'afficheront ici
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {filteredAppointments.length > 0 ? (
            <div className="grid gap-4">
              {filteredAppointments.map((appointment) => (
                <Card 
                  key={appointment.id} 
                  className="border-red-100 bg-red-50/30"
                >
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                          <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {format(new Date(appointment.booking_date), 'dd MMM yyyy', { locale: fr })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.start_time} - {appointment.end_time}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold">{appointment.services?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {appointment.profiles?.first_name} {appointment.profiles?.last_name}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatCurrency(appointment.total_price)}</p>
                        <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                          Annulé
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <XCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Aucun rendez-vous annulé</h3>
                <p className="text-muted-foreground">
                  Les rendez-vous annulés s'afficheront ici
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProviderAppointments;