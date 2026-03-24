import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Euro, 
  Star, 
  MessageCircle,
  Search,
  Filter,
  SortDesc,
  MoreHorizontal,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  XCircle,
  Play,
  Pause,
  Download,
  Eye,
  Edit,
  Trash2,
  Timer,
  FileText,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  address: string;
  notes: string | null;
  total_price: number;
  hourly_rate: number | null;
  custom_duration: number | null;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  provider_notes: string | null;
  services: {
    name: string;
    category: string;
  } | null;
  providers: {
    business_name: string | null;
    hourly_rate: number | null;
    rating: number | null;
    profiles: {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      email: string | null;
      phone: string | null;
    } | null;
  } | null;
}

interface SmartBookingsListProps {
  userType: 'client' | 'provider';
}

const SmartBookingsList = ({ userType }: SmartBookingsListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['smart-bookings', userType, user?.id],
    queryFn: async (): Promise<Booking[]> => {
      if (!user) return [];

      let query = supabase
        .from('bookings')
        .select(`
          *,
          services(name, category),
          providers(
            business_name,
            hourly_rate,
            rating,
            profiles(first_name, last_name, avatar_url, email, phone)
          )
        `);

      if (userType === 'client') {
        query = query.eq('client_id', user.id);
      } else {
        const { data: providerData } = await supabase
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
      return (data as any[]) || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.services?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.providers?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    switch (sortBy) {
      case 'date_desc':
        return filtered.sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());
      case 'date_asc':
        return filtered.sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());
      case 'price_desc':
        return filtered.sort((a, b) => b.total_price - a.total_price);
      case 'price_asc':
        return filtered.sort((a, b) => a.total_price - b.total_price);
      case 'status':
        return filtered.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return filtered;
    }
  }, [bookings, searchTerm, statusFilter, sortBy]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      pending: {
        color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'En attente'
      },
      confirmed: {
        color: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Confirmé'
      },
      in_progress: {
        color: 'bg-primary/10 text-primary border-primary/20',
        icon: <Play className="w-4 h-4" />,
        label: 'En cours'
      },
      completed: {
        color: 'bg-green-500/10 text-green-700 border-green-500/20',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Terminé'
      },
      cancelled: {
        color: 'bg-red-500/10 text-red-700 border-red-500/20',
        icon: <XCircle className="w-4 h-4" />,
        label: 'Annulé'
      }
    };
    return configs[status] || configs.pending;
  };

  const getProviderDisplayName = (booking: Booking) => {
    if (booking.providers?.business_name) return booking.providers.business_name;
    if (booking.providers?.profiles?.first_name && booking.providers?.profiles?.last_name) {
      return `${booking.providers.profiles.first_name} ${booking.providers.profiles.last_name}`;
    }
    return 'Prestataire';
  };

  const calculateDuration = (start: string, end: string): string => {
    if (!start || !end) return '';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diffMin = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMin <= 0) return '';
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    if (hours > 0 && mins > 0) return `${hours}h${mins.toString().padStart(2, '0')}`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: 'Statut mis à jour',
        description: `La réservation a été ${getStatusConfig(newStatus).label.toLowerCase()}`,
      });

      refetch();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="w-20 h-8 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barre de contrôles */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher par service, prestataire ou adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
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

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Date (récent)</SelectItem>
                  <SelectItem value="date_asc">Date (ancien)</SelectItem>
                  <SelectItem value="price_desc">Prix (élevé)</SelectItem>
                  <SelectItem value="price_asc">Prix (bas)</SelectItem>
                  <SelectItem value="status">Statut</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      {bookings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {bookings.filter(b => b.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">En attente</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {bookings.filter(b => b.status === 'confirmed').length}
              </div>
              <div className="text-sm text-muted-foreground">Confirmées</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Terminées</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {bookings.reduce((sum, b) => sum + (b.status === 'completed' ? b.total_price : 0), 0)}€
              </div>
              <div className="text-sm text-muted-foreground">Total dépensé</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des réservations */}
      {filteredAndSortedBookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Aucune réservation trouvée
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'Essayez de modifier vos filtres de recherche'
                : userType === 'client' 
                  ? "Vous n'avez pas encore de réservation"
                  : "Aucune réservation reçue pour le moment"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedBookings.map((booking, index) => {
            const statusConfig = getStatusConfig(booking.status);
            const duration = booking.custom_duration 
              ? `${booking.custom_duration}h`
              : calculateDuration(booking.start_time, booking.end_time);
            
            return (
              <Card 
                key={booking.id} 
                className="border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={booking.providers?.profiles?.avatar_url || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                            <User className="w-6 h-6 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center ${statusConfig.color.split(' ')[0]}`}>
                          {statusConfig.icon}
                        </div>
                      </div>
                      
                      <div className="space-y-2 flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {booking.services?.name || 'Service'}
                            </h3>
                            <Badge variant="secondary" className="text-xs mb-2">
                              {booking.services?.category}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary mb-1">
                              {booking.total_price}€
                            </div>
                            <Badge className={statusConfig.color}>
                              {statusConfig.icon}
                              <span className="ml-1">{statusConfig.label}</span>
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 shrink-0" />
                            <span>{format(new Date(booking.booking_date), 'PPP', { locale: fr })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>{booking.start_time} → {booking.end_time}</span>
                          </div>
                          {duration && (
                            <div className="flex items-center gap-2">
                              <Timer className="w-4 h-4 shrink-0" />
                              <span>{duration}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">{booking.address || 'Non renseignée'}</span>
                          </div>
                        </div>

                        {userType === 'client' && (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span className="font-medium text-foreground">{getProviderDisplayName(booking)}</span>
                            </div>
                            {booking.providers?.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                                <span>{booking.providers.rating.toFixed(1)}</span>
                              </div>
                            )}
                            {booking.providers?.profiles?.phone && (
                              <a href={`tel:${booking.providers.profiles.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{booking.providers.profiles.phone}</span>
                              </a>
                            )}
                          </div>
                        )}

                        {booking.notes && (
                          <div className="p-3 bg-muted/30 rounded-lg text-sm">
                            <MessageCircle className="w-4 h-4 inline mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground">{booking.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="hover:bg-primary/5"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Détails
                    </Button>
                    
                    {userType === 'provider' && booking.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accepter
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Refuser
                        </Button>
                      </>
                    )}

                    {userType === 'provider' && booking.status === 'confirmed' && (
                      <Button 
                        size="sm"
                        onClick={() => updateBookingStatus(booking.id, 'in_progress')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Commencer
                      </Button>
                    )}

                    {userType === 'provider' && booking.status === 'in_progress' && (
                      <Button 
                        size="sm"
                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Terminer
                      </Button>
                    )}

                    {booking.status === 'completed' && (
                      <Button variant="outline" size="sm" className="hover:bg-primary/5">
                        <Download className="w-4 h-4 mr-1" />
                        Facture
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" className="ml-auto">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modale de détails */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Détails de la réservation
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                {/* Statut + ID */}
                <div className="flex items-center justify-between">
                  <Badge className={getStatusConfig(selectedBooking.status).color}>
                    {getStatusConfig(selectedBooking.status).icon}
                    <span className="ml-1">{getStatusConfig(selectedBooking.status).label}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {selectedBooking.id.slice(0, 8)}
                  </span>
                </div>

                <Separator />

                {/* Service */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Service</h4>
                  <p className="font-semibold text-foreground text-lg">{selectedBooking.services?.name}</p>
                  <Badge variant="secondary" className="text-xs mt-1">{selectedBooking.services?.category}</Badge>
                </div>

                {/* Date & Horaires */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Date
                    </h4>
                    <p className="font-medium text-foreground">
                      {format(new Date(selectedBooking.booking_date), 'EEEE d MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Horaires
                    </h4>
                    <p className="font-medium text-foreground">
                      {selectedBooking.start_time} → {selectedBooking.end_time}
                    </p>
                    {(selectedBooking.custom_duration || (selectedBooking.start_time && selectedBooking.end_time)) && (
                      <p className="text-xs text-muted-foreground">
                        Durée : {selectedBooking.custom_duration 
                          ? `${selectedBooking.custom_duration}h` 
                          : calculateDuration(selectedBooking.start_time, selectedBooking.end_time)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Adresse
                  </h4>
                  <p className="font-medium text-foreground">{selectedBooking.address || 'Non renseignée'}</p>
                </div>

                <Separator />

                {/* Prestataire */}
                {userType === 'client' && selectedBooking.providers && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Prestataire</h4>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedBooking.providers.profiles?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10">
                          <User className="w-5 h-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{getProviderDisplayName(selectedBooking)}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          {selectedBooking.providers.rating && (
                            <span className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-warning text-warning" />
                              {selectedBooking.providers.rating.toFixed(1)}
                            </span>
                          )}
                          {selectedBooking.providers.profiles?.phone && (
                            <a href={`tel:${selectedBooking.providers.profiles.phone}`} className="flex items-center gap-0.5 hover:text-primary">
                              <Phone className="w-3 h-3" />
                              {selectedBooking.providers.profiles.phone}
                            </a>
                          )}
                          {selectedBooking.providers.profiles?.email && (
                            <a href={`mailto:${selectedBooking.providers.profiles.email}`} className="flex items-center gap-0.5 hover:text-primary">
                              <Mail className="w-3 h-3" />
                              Email
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Prix */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Montant total</h4>
                    {selectedBooking.hourly_rate && (
                      <p className="text-xs text-muted-foreground">{selectedBooking.hourly_rate}€/h</p>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-primary">{selectedBooking.total_price}€</p>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Vos notes</h4>
                    <p className="text-sm text-foreground p-3 bg-muted/30 rounded-lg">{selectedBooking.notes}</p>
                  </div>
                )}

                {selectedBooking.provider_notes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes du prestataire</h4>
                    <p className="text-sm text-foreground p-3 bg-muted/30 rounded-lg">{selectedBooking.provider_notes}</p>
                  </div>
                )}

                {selectedBooking.cancellation_reason && (
                  <div>
                    <h4 className="text-sm font-medium text-destructive mb-1">Motif d'annulation</h4>
                    <p className="text-sm text-foreground p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                      {selectedBooking.cancellation_reason}
                    </p>
                  </div>
                )}

                {/* Historique des dates */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Chronologie</h4>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Créée le</span>
                      <span>{format(new Date(selectedBooking.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                    </div>
                    {selectedBooking.confirmed_at && (
                      <div className="flex justify-between">
                        <span>Confirmée le</span>
                        <span>{format(new Date(selectedBooking.confirmed_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                      </div>
                    )}
                    {selectedBooking.started_at && (
                      <div className="flex justify-between">
                        <span>Démarrée le</span>
                        <span>{format(new Date(selectedBooking.started_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                      </div>
                    )}
                    {selectedBooking.completed_at && (
                      <div className="flex justify-between">
                        <span>Terminée le</span>
                        <span>{format(new Date(selectedBooking.completed_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                      </div>
                    )}
                    {selectedBooking.cancelled_at && (
                      <div className="flex justify-between text-destructive">
                        <span>Annulée le</span>
                        <span>{format(new Date(selectedBooking.cancelled_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartBookingsList;
