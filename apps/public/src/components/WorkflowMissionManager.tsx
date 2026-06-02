import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MissionManagerProps {
  booking: {
    id: string;
    status: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    address: string;
    total_price: number;
    services?: { name: string };
    profiles?: { first_name: string; last_name: string };
  };
  onUpdate: () => void;
}

export const WorkflowMissionManager: React.FC<MissionManagerProps> = ({ booking, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirmMission = async (confirms: boolean) => {
    setIsLoading(true);
    try {
      // Direct SQL update instead of RPC call
      const { error } = await supabase
        .from('bookings')
        .update({
          status: confirms ? 'confirmed' : 'pending',
          confirmed_at: confirms ? new Date().toISOString() : null,
          provider_id: confirms ? undefined : null
        })
        .eq('id', booking.id);

      if (error) throw error;

      // Send notification
      if (confirms) {
        await supabase.from('notifications').insert({
          user_id: booking.profiles ? 'client-id' : null, // You'll need to get the actual client_id
          title: 'Prestation confirmée',
          message: 'Votre prestataire a confirmé sa disponibilité pour votre prestation.',
          type: 'booking_confirmed'
        });
      }

      toast({
        title: confirms ? "Mission confirmée" : "Mission refusée",
        description: confirms 
          ? "Vous avez confirmé cette mission" 
          : "La mission a été refusée et sera réassignée",
      });

      onUpdate();
    } catch (error) {
      console.error('Error confirming mission:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter votre réponse",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const location = `${position.coords.latitude},${position.coords.longitude}`;
      
      const { error } = await supabase
        .from('bookings')
        .update({
          started_at: new Date().toISOString(),
          check_in_location: location,
          status: 'in_progress'
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Check-in effectué",
        description: "Votre mission a commencé",
      });

      onUpdate();
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le check-in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const location = `${position.coords.latitude},${position.coords.longitude}`;
      
      const { error } = await supabase
        .from('bookings')
        .update({
          completed_at: new Date().toISOString(),
          check_out_location: location,
          provider_notes: "Mission terminée avec succès",
          status: 'completed'
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Check-out effectué",
        description: "Votre mission est terminée",
      });

      onUpdate();
    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le check-out",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'assigned':
        return <Badge variant="secondary">Assigné</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmé</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">En cours</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Terminé</Badge>;
      default:
        return <Badge variant="outline">{booking.status}</Badge>;
    }
  };

  const renderActionButtons = () => {
    switch (booking.status) {
      case 'assigned':
        return (
          <div className="flex gap-2">
            <Button 
              onClick={() => handleConfirmMission(true)}
              disabled={isLoading}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmer
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleConfirmMission(false)}
              disabled={isLoading}
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Refuser
            </Button>
          </div>
        );
      case 'confirmed':
        return (
          <Button 
            onClick={handleCheckIn}
            disabled={isLoading}
            className="w-full"
          >
            Commencer la mission
          </Button>
        );
      case 'in_progress':
        return (
          <Button 
            onClick={handleCheckOut}
            disabled={isLoading}
            className="w-full"
          >
            Terminer la mission
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {booking.services?.name || 'Service'}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>
            {format(new Date(booking.booking_date), 'EEEE d MMMM yyyy', { locale: fr })} - 
            {booking.start_time} à {booking.end_time}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span>{booking.address}</span>
        </div>

        <div className="text-sm font-medium">
          Prix: {booking.total_price}€
        </div>

        <div className="pt-4">
          {renderActionButtons()}
        </div>
      </CardContent>
    </Card>
  );
};