/**
 * MissionTracker
 * Suivi visuel d'une mission cliente — étapes, horodatage, géolocalisation.
 * Données chargées via useMissionTracking (React Query + Realtime).
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, MapPin, CheckCircle, AlertTriangle, PlayCircle, StopCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMissionTracking, type MissionTrackingData } from '@/hooks/queries/useMissionTracking';
import { cn } from '@/lib/utils';

interface MissionTrackerProps {
  bookingId: string;
}

const PROGRESS_BY_STATUS: Record<string, number> = {
  pending: 25,
  assigned: 25,
  confirmed: 50,
  in_progress: 75,
  completed: 100,
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  assigned: 'Assigné',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-muted-foreground',
  assigned: 'bg-muted-foreground',
  confirmed: 'bg-secondary',
  in_progress: 'bg-primary',
  completed: 'bg-primary',
  cancelled: 'bg-destructive',
};

const formatTime = (iso: string | null) =>
  iso ? format(new Date(iso), 'HH:mm', { locale: fr }) : null;

const buildSteps = (mission: MissionTrackingData) => [
  {
    key: 'assigned',
    label: 'Prestataire assigné',
    icon: <CheckCircle className="w-4 h-4" />,
    completed: !!mission.assigned_at,
    time: formatTime(mission.assigned_at),
  },
  {
    key: 'confirmed',
    label: 'Prestation confirmée',
    icon: <CheckCircle className="w-4 h-4" />,
    completed: !!mission.confirmed_at,
    time: formatTime(mission.confirmed_at),
  },
  {
    key: 'started',
    label: 'Prestation commencée',
    icon: <PlayCircle className="w-4 h-4" />,
    completed: !!mission.started_at,
    time: formatTime(mission.started_at),
    location: mission.check_in_location,
  },
  {
    key: 'completed',
    label: 'Prestation terminée',
    icon: <StopCircle className="w-4 h-4" />,
    completed: !!mission.completed_at,
    time: formatTime(mission.completed_at),
    location: mission.check_out_location,
  },
];

const MissionTracker = ({ bookingId }: MissionTrackerProps) => {
  const { data: mission, isLoading, error } = useMissionTracking(bookingId);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6 space-y-4">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-2 bg-muted rounded" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !mission) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Impossible de charger le suivi de mission</p>
        </CardContent>
      </Card>
    );
  }

  const steps = buildSteps(mission);
  const progressValue = PROGRESS_BY_STATUS[mission.status] ?? 0;
  const nextIndex = steps.findIndex((s) => !s.completed);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Suivi de votre prestation
          </span>
          <Badge className={cn(STATUS_COLOR[mission.status] ?? 'bg-muted', 'text-white')}>
            {STATUS_LABEL[mission.status] ?? mission.status}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">{mission.service?.name ?? 'Prestation'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(mission.booking_date), 'PPP', { locale: fr })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{mission.start_time} - {mission.end_time}</span>
            </div>
            {mission.address && (
              <div className="flex items-center gap-1 col-span-full">
                <MapPin className="w-4 h-4" />
                <span>{mission.address}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Étapes de la prestation</h4>
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isCurrent = index === nextIndex;
              return (
                <div
                  key={step.key}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg transition-colors border',
                    step.completed
                      ? 'bg-primary/5 border-primary/30'
                      : isCurrent
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-muted/30 border-transparent'
                  )}
                >
                  <div
                    className={cn(
                      'p-1 rounded-full',
                      step.completed
                        ? 'bg-primary text-primary-foreground'
                        : isCurrent
                        ? 'bg-primary/80 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={cn(
                          'font-medium',
                          step.completed ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {step.label}
                      </p>
                      {step.time && (
                        <span className="text-xs text-muted-foreground">{step.time}</span>
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
              );
            })}
          </div>
        </div>

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
