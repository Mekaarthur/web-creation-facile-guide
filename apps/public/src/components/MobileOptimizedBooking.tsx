import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Phone, MessageCircle } from 'lucide-react';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MobileOptimizedBookingProps {
  booking: {
    id: string;
    service_name: string;
    service_date: string;
    service_time: string;
    address: string;
    status: string;
    provider?: {
      business_name: string;
      phone?: string;
    };
  };
  onCallProvider?: () => void;
  onMessageProvider?: () => void;
  onOpenLocation?: () => void;
}

export const MobileOptimizedBooking: React.FC<MobileOptimizedBookingProps> = ({
  booking,
  onCallProvider,
  onMessageProvider,
  onOpenLocation
}) => {
  const { isNative, platform } = useMobileCapabilities();

  const getStatusBadge = (status: string) => {
    const variants = {
      'confirmed': { variant: 'default' as const, label: 'Confirmé' },
      'pending': { variant: 'secondary' as const, label: 'En attente' },
      'in_progress': { variant: 'outline' as const, label: 'En cours' },
      'completed': { variant: 'secondary' as const, label: 'Terminé' }
    };
    
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const handleCallProvider = () => {
    if (booking.provider?.phone) {
      if (isNative) {
        window.open(`tel:${booking.provider.phone}`);
      } else {
        onCallProvider?.();
      }
    }
  };

  const handleOpenLocation = () => {
    if (isNative && platform === 'ios') {
      window.open(`maps://maps.apple.com/?q=${encodeURIComponent(booking.address)}`);
    } else if (isNative && platform === 'android') {
      window.open(`geo:0,0?q=${encodeURIComponent(booking.address)}`);
    } else {
      onOpenLocation?.();
    }
  };

  const badgeInfo = getStatusBadge(booking.status);

  return (
    <Card className="w-full shadow-sm border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-medium text-foreground line-clamp-1">
            {booking.service_name}
          </CardTitle>
          <Badge variant={badgeInfo.variant} className="ml-2 shrink-0">
            {badgeInfo.label}
          </Badge>
        </div>
        
        {booking.provider && (
          <p className="text-sm text-muted-foreground">
            avec {booking.provider.business_name}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date et heure */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            {format(new Date(booking.service_date), 'EEEE d MMMM yyyy', { locale: fr })} à {booking.service_time}
          </span>
        </div>

        {/* Adresse */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <span className="line-clamp-2">{booking.address}</span>
        </div>

        {/* Actions mobiles */}
        {booking.provider && (
          <div className="flex gap-2 pt-2">
            {booking.provider.phone && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCallProvider}
                className="flex-1"
              >
                <Phone className="h-4 w-4 mr-1" />
                Appeler
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onMessageProvider}
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Message
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenLocation}
              className="flex-1"
            >
              <MapPin className="h-4 w-4 mr-1" />
              Localiser
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};