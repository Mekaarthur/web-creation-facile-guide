import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, MapPin, CheckCircle, AlertTriangle, PlayCircle, StopCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MissionTrackerProps {
  bookingId: string;
}

interface MissionStatus {
  id: string;
  status: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  assigned_at: string | null;
  confirmed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  address: string;
  check_in_location: string | null;
  check_out_location: string | null;
  provider_notes: string | null;
  services: {
    name: string;
  };
  providers: {
    business_name: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

const MissionTracker = ({ bookingId }: MissionTrackerProps) => {
  const [mission, setMission] = useState<MissionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMissionStatus();
    
    // Écouter les mises à jour en temps réel
    const channel = supabase
      .channel('mission-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          console.log('Mission status updated:', payload);
          loadMissionStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const loadMissionStatus = async () => {
    try {
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`
          *,
          services(name)
        `)
        .eq('id', bookingId)
        .single();

      if (bookingData?.provider_id) {
        // Charger les infos du prestataire séparément
        const { data: providerData } = await supabase
          .from('providers')
          .select(`
            business_name,
            user_id
          `)
          .eq('id', bookingData.provider_id)
          .single();

        let providerInfo = { business_name: '', profiles: { first_name: '', last_name: '' } };
        
        if (providerData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', providerData.user_id)
            .single();

          providerInfo = {
            business_name: providerData.business_name,
            profiles: profileData || { first_name: '', last_name: '' }
          };
        }

        setMission({
          ...bookingData,
          providers: providerInfo
        });
      } else {
        setMission({
          ...bookingData,
          providers: { business_name: '', profiles: { first_name: '', last_name: '' } }
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du statut de mission:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'pending':
      case 'assigned':
        return 25;
      case 'confirmed':
        return 50;
      case 'in_progress':
        return 75;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  const getStatusSteps = (mission: MissionStatus) => {
    const baseSteps = [
      {
        key: 'assigned',
        label: 'Prestataire assigné',
        icon: <CheckCircle className="w-4 h-4" />,
        completed: !!mission.assigned_at,
        time: mission.assigned_at ? format(new Date(mission.assigned_at), 'HH:mm', { locale: fr }) : null
      },
      {
        key: 'confirmed',
        label: 'Prestation confirmée',
        icon: <CheckCircle className="w-4 h-4" />,
        completed: !!mission.confirmed_at,
        time: mission.confirmed_at ? format(new Date(mission.confirmed_at), 'HH:mm', { locale: fr }) : null
      },
      {
        key: 'started',
        label: 'Prestation commencée',
        icon: <PlayCircle className="w-4 h-4" />,
        completed: !!mission.started_at,
        time: mission.started_at ? format(new Date(mission.started_at), 'HH:mm', { locale: fr }) : null,
        location: mission.check_in_location
      },
      {
        key: 'completed',
        label: 'Prestation terminée',
        icon: <StopCircle className="w-4 h-4" />,
        completed: !!mission.completed_at,
        time: mission.completed_at ? format(new Date(mission.completed_at), 'HH:mm', { locale: fr }) : null,
        location: mission.check_out_location
      }
    ];

    return baseSteps;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'assigned':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-primary';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'assigned':
        return 'Assigné';
      case 'confirmed':
        return 'Confirmé';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mission) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Impossible de charger le suivi de mission</p>
        </CardContent>
      </Card>
    );
  }

  const steps = getStatusSteps(mission);
  const progressValue = getProgressValue(mission.status);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Suivi de votre prestation
          </span>
          <Badge className={`${getStatusColor(mission.status)} text-white`}>
            {getStatusText(mission.status)}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Informations de base */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">{mission.services.name}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(mission.booking_date), 'PPP', { locale: fr })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{mission.start_time} - {mission.end_time}</span>
            </div>
            <div className="flex items-center gap-1 col-span-full">
              <MapPin className="w-4 h-4" />
              <span>{mission.address}</span>
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Étapes du processus */}
        <div className="space-y-4">
          <h4 className="font-medium">Étapes de la prestation</h4>
          
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div 
                key={step.key}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  step.completed 
                    ? 'bg-green-50 border border-green-200' 
                    : index === steps.findIndex(s => !s.completed)
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-muted/30'
                }`}
              >
                <div className={`p-1 rounded-full ${
                  step.completed 
                    ? 'bg-green-500 text-white' 
                    : index === steps.findIndex(s => !s.completed)
                    ? 'bg-blue-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium ${
                      step.completed ? 'text-green-700' : 'text-foreground'
                    }`}>
                      {step.label}
                    </p>
                    
                    {step.time && (
                      <span className="text-xs text-muted-foreground">
                        {step.time}
                      </span>
                    )}
                  </div>
                  
                  {step.location && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{step.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes du prestataire */}
        {mission.provider_notes && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Notes du prestataire</h4>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm">{mission.provider_notes}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MissionTracker;