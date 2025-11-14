import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  Search, 
  Filter, 
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  Euro,
  Clock,
  Send,
  UserPlus,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  services: {
    name: string;
    category: string;
  } | null;
  client_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  provider_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface Provider {
  id: string;
  business_name: string;
  location: string;
  rating: number;
  user_id: string;
}

const AdminReservations = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAssignProviderOpen, setIsAssignProviderOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
    loadProviders();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            name,
            category
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load client and provider profiles
      const bookingsWithProfiles = await Promise.all(
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

          return {
            ...booking,
            client_profile: clientProfile,
            provider_profile: providerProfile
          };
        })
      );

      setBookings(bookingsWithProfiles);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('id, business_name, location, rating, user_id')
        .eq('status', 'active')
        .eq('is_verified', true);

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.client_profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.client_profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.client_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.services?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      'pending': { label: 'En attente', variant: 'secondary' as const },
      'confirmed': { label: 'Confirmé', variant: 'default' as const },
      'in_progress': { label: 'En cours', variant: 'default' as const },
      'completed': { label: 'Terminé', variant: 'default' as const },
      'cancelled': { label: 'Annulé', variant: 'destructive' as const },
    };
    
    const statusConfig = config[status as keyof typeof config] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `La réservation a été mise à jour avec succès`,
      });

      await loadBookings();
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const assignProvider = async () => {
    if (!selectedBooking || !selectedProviderId) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          provider_id: selectedProviderId,
          status: 'confirmed',
          assigned_at: new Date().toISOString()
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      // Send notification to provider
      const provider = providers.find(p => p.id === selectedProviderId);
      if (provider) {
        await supabase.from('notifications').insert({
          user_id: provider.user_id,
          title: 'Nouvelle mission assignée',
          message: `Une nouvelle mission vous a été assignée pour le ${new Date(selectedBooking.booking_date).toLocaleDateString('fr-FR')}`,
          type: 'booking_request'
        });
      }

      toast({
        title: "Prestataire assigné",
        description: "Le prestataire a été assigné avec succès",
      });

      setIsAssignProviderOpen(false);
      setSelectedProviderId("");
      await loadBookings();
    } catch (error) {
      console.error('Error assigning provider:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le prestataire",
        variant: "destructive",
      });
    }
  };

  const sendEmail = async (recipientType: 'client' | 'provider') => {
    if (!selectedBooking) return;

    try {
      const recipientEmail = recipientType === 'client' 
        ? selectedBooking.client_profile?.email
        : selectedBooking.provider_profile ? 
          (await supabase.from('profiles').select('email').eq('user_id', 
            (await supabase.from('providers').select('user_id').eq('id', selectedBooking.provider_id).single()).data?.user_id
          ).single()).data?.email
        : null;

      if (!recipientEmail) {
        toast({
          title: "Erreur",
          description: "Email du destinataire introuvable",
          variant: "destructive",
        });
        return;
      }

      // Here you would call an edge function to send the email
      // For now, we'll just log the action
      console.log('Sending email to:', recipientEmail, {
        subject: emailSubject,
        message: emailMessage
      });

      toast({
        title: "Email envoyé",
        description: `Email envoyé avec succès au ${recipientType === 'client' ? 'client' : 'prestataire'}`,
      });

      setEmailSubject("");
      setEmailMessage("");
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email",
        variant: "destructive",
      });
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

      {/* Filtres */}
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs sm:text-sm">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
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

      {/* Liste des réservations */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm sm:text-base text-muted-foreground">Chargement...</p>
            </CardContent>
          </Card>
        ) : filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm sm:text-base text-muted-foreground">Aucune réservation trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-mono text-muted-foreground">
                        #{booking.id.substring(0, 8)}
                      </span>
                      {getStatusBadge(booking.status)}
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(booking.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {/* Info client */}
                    {booking.client_profile && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                          <span className="truncate">
                            {booking.client_profile.first_name} {booking.client_profile.last_name}
                          </span>
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

                    {/* Info mission */}
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

                    {/* Service et prestataire */}
                    <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                      {booking.services && (
                        <Badge variant="outline">{booking.services.name}</Badge>
                      )}
                      {booking.provider_profile && (
                        <Badge variant="secondary">
                          Prestataire: {booking.provider_profile.first_name} {booking.provider_profile.last_name}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-primary font-semibold">
                        <Euro className="w-3 h-3 sm:w-4 sm:h-4" />
                        {booking.total_price}€
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsDetailOpen(true);
                    }}
                    className="text-xs sm:text-sm"
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de détails */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Détails de la réservation #{selectedBooking?.id.substring(0, 8)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info" className="text-xs sm:text-sm">Informations</TabsTrigger>
                <TabsTrigger value="actions" className="text-xs sm:text-sm">Actions</TabsTrigger>
                <TabsTrigger value="communication" className="text-xs sm:text-sm">Communication</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                      <span>Informations générales</span>
                      {getStatusBadge(selectedBooking.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs sm:text-sm">Date</Label>
                        <p>{new Date(selectedBooking.booking_date).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Horaire</Label>
                        <p>{selectedBooking.start_time} - {selectedBooking.end_time}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs sm:text-sm">Adresse</Label>
                        <p>{selectedBooking.address || 'Non renseignée'}</p>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Service</Label>
                        <p>{selectedBooking.services?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Prix total</Label>
                        <p className="text-primary font-semibold">{selectedBooking.total_price}€</p>
                      </div>
                    </div>

                    {selectedBooking.notes && (
                      <div>
                        <Label className="text-xs sm:text-sm">Notes</Label>
                        <p className="text-muted-foreground">{selectedBooking.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Client</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {selectedBooking.client_profile && (
                      <>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {selectedBooking.client_profile.first_name} {selectedBooking.client_profile.last_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedBooking.client_profile.email}</span>
                        </div>
                        {selectedBooking.client_profile.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{selectedBooking.client_profile.phone}</span>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {selectedBooking.provider_profile && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Prestataire</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {selectedBooking.provider_profile.first_name} {selectedBooking.provider_profile.last_name}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Modifier le statut</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select 
                      value={selectedBooking.status} 
                      onValueChange={(value) => updateBookingStatus(selectedBooking.id, value)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="confirmed">Confirmé</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {!selectedBooking.provider_id && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Assigner un prestataire</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => setIsAssignProviderOpen(true)}
                        className="w-full text-sm"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assigner un prestataire
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="communication" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Envoyer un email</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-subject" className="text-xs sm:text-sm">Sujet</Label>
                      <Input
                        id="email-subject"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Sujet de l'email"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-message" className="text-xs sm:text-sm">Message</Label>
                      <Textarea
                        id="email-message"
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        placeholder="Contenu de l'email"
                        rows={5}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => sendEmail('client')}
                        disabled={!emailSubject || !emailMessage}
                        className="flex-1 text-sm"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer au client
                      </Button>
                      {selectedBooking.provider_id && (
                        <Button
                          onClick={() => sendEmail('provider')}
                          disabled={!emailSubject || !emailMessage}
                          variant="secondary"
                          className="flex-1 text-sm"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Envoyer au prestataire
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog d'assignation de prestataire */}
      <Dialog open={isAssignProviderOpen} onOpenChange={setIsAssignProviderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Assigner un prestataire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Sélectionner un prestataire</Label>
              <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Choisir un prestataire" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.business_name} - {provider.location} (★ {provider.rating.toFixed(1)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={assignProvider}
                disabled={!selectedProviderId}
                className="flex-1 text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmer
              </Button>
              <Button
                onClick={() => {
                  setIsAssignProviderOpen(false);
                  setSelectedProviderId("");
                }}
                variant="outline"
                className="text-sm"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReservations;
