import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Phone, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AssignedProviderCardProps {
  bookingId: string;
  onOpenChat: () => void;
}

interface ProviderInfo {
  id: string;
  business_name: string;
  rating: number;
  location: string;
  total_earnings: number;
  missions_completed: number;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    phone: string;
  };
  provider_services: Array<{
    services: {
      name: string;
      category: string;
    };
  }>;
}

interface BookingInfo {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  address: string;
  total_price: number;
  services: {
    name: string;
    category: string;
  };
}

const AssignedProviderCard = ({ bookingId, onOpenChat }: AssignedProviderCardProps) => {
  const [provider, setProvider] = useState<ProviderInfo | null>(null);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviderInfo();
  }, [bookingId]);

  const loadProviderInfo = async () => {
    try {
      // Charger les infos de la réservation
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`
          *,
          services(name, category)
        `)
        .eq('id', bookingId)
        .single();

      if (bookingData?.provider_id) {
        // Charger les infos du prestataire séparément
        const { data: providerData } = await supabase
          .from('providers')
          .select(`
            id,
            business_name,
            rating,
            location,
            total_earnings,
            missions_completed,
            user_id,
            provider_services(
              services(name, category)
            )
          `)
          .eq('id', bookingData.provider_id)
          .single();

        if (providerData) {
          // Charger le profil utilisateur du prestataire
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url, phone')
            .eq('user_id', providerData.user_id)
            .single();

          setBooking(bookingData);
          setProvider({
            ...providerData,
            profiles: profileData || {
              first_name: '',
              last_name: '',
              avatar_url: '',
              phone: ''
            }
          });
        }
      } else {
        setBooking(bookingData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des infos prestataire:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned':
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'Prestataire assigné';
      case 'pending':
        return 'En attente de confirmation';
      case 'confirmed':
        return 'Prestation confirmée';
      case 'in_progress':
        return 'Prestation en cours';
      case 'completed':
        return 'Prestation terminée';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-32 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!provider || !booking) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Recherche d'un prestataire en cours...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(booking.status)}
          {getStatusText(booking.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info prestataire */}
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={provider.profiles?.avatar_url} />
            <AvatarFallback className="text-lg">
              {provider.business_name?.charAt(0) || 
               `${provider.profiles?.first_name?.charAt(0)}${provider.profiles?.last_name?.charAt(0)}`}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {provider.business_name || 
               `${provider.profiles?.first_name} ${provider.profiles?.last_name}`}
            </h3>
            
            <div className="flex items-center gap-2 mt-1">
              {provider.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{provider.rating.toFixed(1)}</span>
                </div>
              )}
              <Badge variant="secondary" className="text-xs">
                {provider.missions_completed} missions
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{provider.location}</span>
            </div>
          </div>
        </div>

        {/* Détails de la mission */}
        <div className="border-t pt-4 space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-2">Détails de votre prestation</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-medium">{booking.services.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{format(new Date(booking.booking_date), 'PPP', { locale: fr })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horaire:</span>
                <span>{booking.start_time} - {booking.end_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adresse:</span>
                <span className="text-right max-w-[200px]">{booking.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prix:</span>
                <span className="font-semibold">{booking.total_price}€</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t pt-4 flex gap-2">
          <Button 
            onClick={onOpenChat}
            className="flex-1"
            variant="outline"
            size="sm"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contacter
          </Button>
          
          {provider.profiles?.phone && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`tel:${provider.profiles.phone}`)}
            >
              <Phone className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignedProviderCard;