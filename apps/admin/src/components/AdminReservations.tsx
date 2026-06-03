import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Search, Filter, Calendar, User, MapPin, Phone, Mail, Euro, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReservationDetailModal } from "@/components/admin/ReservationDetailModal";

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  address: string | null;
  total_price: number;
  status: string;
  created_at: string;
  notes: string | null;
  client_id: string;
  provider_id: string | null;
  service_id: string;
  services: { name: string; category: string } | null;
  client_profile?: { first_name: string | null; last_name: string | null; email: string | null; phone: string | null } | null;
  provider_profile?: { first_name: string | null; last_name: string | null } | null;
}

interface Provider {
  id: string;
  business_name: string;
  location: string;
  rating: number;
  user_id: string;
}

const BOOKINGS_KEY = ['admin-reservations'] as const;
const PROVIDERS_KEY = ['admin-reservations-providers'] as const;

async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`*, services(name, category)`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return Promise.all(
    (data || []).map(async (booking) => {
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('user_id', booking.client_id)
        .single();

      let providerProfile = null;
      if (booking.provider_id) {
        const { data: providerData } = await supabase
          .from('providers')
          .select('user_id')
          .eq('id', booking.provider_id)
          .single();

        if (providerData?.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', providerData.user_id)
            .single();
          providerProfile = profileData;
        }
      }

      return { ...booking, client_profile: clientProfile, provider_profile: providerProfile };
    })
  );
}

async function fetchActiveProviders(): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('id, business_name, location, rating, user_id')
    .eq('status', 'active')
    .eq('is_verified', true);
  if (error) throw error;
  return data || [];
}

const STATUS_BADGE: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
  pending: { label: 'En attente', variant: 'secondary' },
  confirmed: { label: 'Confirmé', variant: 'default' },
  in_progress: { label: 'En cours', variant: 'default' },
  completed: { label: 'Terminé', variant: 'default' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
};

const AdminReservations = () => {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isMutating, setIsMutating] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: BOOKINGS_KEY,
    queryFn: fetchBookings,
  });

  const { data: providers = [] } = useQuery<Provider[]>({
    queryKey: PROVIDERS_KEY,
    queryFn: fetchActiveProviders,
  });

  const filteredBookings = useMemo(() => {
    let filtered = bookings;
    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.client_profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.client_profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.client_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.services?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter);
    }
    return filtered;
  }, [bookings, searchTerm, statusFilter]);

  const updateBookingStatus = async (status: string) => {
    if (!selectedBooking) return;
    setIsMutating(true);
    try {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', selectedBooking.id);
      if (error) throw error;
      toast({ title: "Statut mis à jour", description: "La réservation a été mise à jour avec succès" });
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
      setSelectedBooking({ ...selectedBooking, status });
    } catch {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut", variant: "destructive" });
    } finally {
      setIsMutating(false);
    }
  };

  const assignProvider = async (providerId: string) => {
    if (!selectedBooking) return;
    setIsMutating(true);
    try {
      const { error } = await supabase.from('bookings').update({
        provider_id: providerId,
        status: 'confirmed',
        assigned_at: new Date().toISOString(),
      }).eq('id', selectedBooking.id);
      if (error) throw error;

      const provider = providers.find(p => p.id === providerId);
      if (provider) {
        await supabase.from('notifications').insert({
          user_id: provider.user_id,
          title: 'Nouvelle mission assignée',
          message: `Une nouvelle mission vous a été assignée pour le ${new Date(selectedBooking.booking_date).toLocaleDateString('fr-FR')}`,
          type: 'booking_request',
        });
      }

      toast({ title: "Prestataire assigné", description: "Le prestataire a été assigné avec succès" });
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'assigner le prestataire", variant: "destructive" });
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Gestion des Réservations</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {bookings.length} réservation{bookings.length > 1 ? 's' : ''} au total
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-xs sm:text-sm">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ID, nom, email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs sm:text-sm">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {isLoading ? (
          <Card><CardContent className="py-8 text-center"><p className="text-sm sm:text-base text-muted-foreground">Chargement...</p></CardContent></Card>
        ) : filteredBookings.length === 0 ? (
          <Card><CardContent className="py-8 text-center"><p className="text-sm sm:text-base text-muted-foreground">Aucune réservation trouvée</p></CardContent></Card>
        ) : (
          filteredBookings.map((booking) => {
            const statusConfig = STATUS_BADGE[booking.status] ?? { label: booking.status, variant: 'secondary' as const };
            return (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-2 flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs sm:text-sm font-mono text-muted-foreground">#{booking.id.substring(0, 8)}</span>
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        <span className="text-xs sm:text-sm text-muted-foreground">{new Date(booking.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>

                      {booking.client_profile && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                            <span className="truncate">{booking.client_profile.first_name} {booking.client_profile.last_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                            <span className="truncate">{booking.client_profile.email}</span>
                          </div>
                          {booking.client_profile.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                              <span>{booking.client_profile.phone}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                          <span>{new Date(booking.booking_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                          <span>{booking.start_time} - {booking.end_time}</span>
                        </div>
                        {booking.address && (
                          <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                            <span className="truncate">{booking.address}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                        {booking.services && <Badge variant="outline">{booking.services.name}</Badge>}
                        {booking.provider_profile && (
                          <Badge variant="secondary">
                            Prestataire: {booking.provider_profile.first_name} {booking.provider_profile.last_name}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-primary font-semibold">
                          <Euro className="w-3 h-3 sm:w-4 sm:h-4" />{booking.total_price}€
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setSelectedBooking(booking); setIsDetailOpen(true); }}
                      className="text-xs sm:text-sm"
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <ReservationDetailModal
        booking={selectedBooking}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        providers={providers}
        onStatusUpdate={updateBookingStatus}
        onAssignProvider={assignProvider}
        isMutating={isMutating}
      />
    </div>
  );
};

export default AdminReservations;
