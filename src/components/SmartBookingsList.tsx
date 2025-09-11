import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
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
  Trash2
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
  address: string;
  notes: string | null;
  total_price: number;
  status: string; // Type générique pour compatibilité avec Supabase
  created_at: string;
  duration?: number; // Optionnel pour compatibilité
  services: {
    name: string;
    category: string;
  } | null;
  providers: {
    business_name: string | null;
    profiles: {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
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

  // Charger les réservations avec React Query
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
            profiles(first_name, last_name, avatar_url)
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
      return data || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  // Filtrage et tri intelligents
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.services?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.providers?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Tri
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
    const configs = {
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
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getProviderDisplayName = (booking: Booking) => {
    if (booking.providers?.business_name) return booking.providers.business_name;
    if (booking.providers?.profiles?.first_name && booking.providers?.profiles?.last_name) {
      return `${booking.providers.profiles.first_name} ${booking.providers.profiles.last_name}`;
    }
    return 'Prestataire';
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
      {/* Barre de contrôles avancée */}
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
              <div className="text-sm text-muted-foreground">Chiffre d'affaires</div>
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
                            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(booking.booking_date), 'PPP', { locale: fr })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{booking.start_time} {booking.duration ? `(${booking.duration}h)` : ''}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{booking.address}</span>
                          </div>
                        </div>

                        {userType === 'client' && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>{getProviderDisplayName(booking)}</span>
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
                    <Button variant="outline" size="sm" className="hover:bg-primary/5">
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
    </div>
  );
};

export default SmartBookingsList;