import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  MapPin, 
  Euro,
  CheckCircle,
  X,
  AlertTriangle
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MissionAssignment {
  id: string;
  client_request_id: string;
  response_deadline: string;
  assigned_provider_id: string | null;
  client_requests: {
    client_name: string;
    service_type: string;
    location: string;
    preferred_date: string | null;
    preferred_time: string | null;
    budget_range: string | null;
    service_description: string;
  };
}

export const ProviderMissionResponse = () => {
  const [availableMissions, setAvailableMissions] = useState<MissionAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProviderData();
    loadAvailableMissions();
    
    // Écouter les nouvelles assignations en temps réel
    const channel = supabase
      .channel('missions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'missions'
        },
        () => {
          loadAvailableMissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProviderData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (provider) {
        setProviderId(provider.id);
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
    }
  };

  const loadAvailableMissions = async () => {
    if (!providerId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('missions')
        .select(`
          *,
          client_requests (
            client_name,
            service_type,
            location,
            preferred_date,
            preferred_time,
            budget_range,
            service_description
          )
        `)
        .is('assigned_provider_id', null)
        .gt('response_deadline', new Date().toISOString())
        .contains('eligible_providers', [providerId]);

      if (error) throw error;

      setAvailableMissions(data || []);
    } catch (error) {
      console.error('Error loading available missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToMission = async (assignmentId: string, responseType: 'accept' | 'decline') => {
    if (!providerId) return;

    try {
      const { data, error } = await supabase.functions.invoke('provider-response', {
        body: {
          assignmentId,
          providerId,
          responseType
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: responseType === 'accept' ? "Mission acceptée !" : "Réponse enregistrée",
          description: data.message,
        });

        // Recharger les missions disponibles
        loadAvailableMissions();
      } else {
        toast({
          title: "Attention",
          description: data.message,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error responding to mission:', error);
      toast({
        title: "Erreur",
        description: "Impossible de répondre à la mission",
        variant: "destructive",
      });
    }
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins <= 0) return "Expiré";
    if (diffMins < 60) return `${diffMins} min`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };

  if (!providerId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Veuillez créer votre profil prestataire pour voir les missions disponibles.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Missions disponibles</h2>
        <Badge variant="secondary">
          {availableMissions.length} mission{availableMissions.length !== 1 ? 's' : ''} disponible{availableMissions.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : availableMissions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Aucune mission disponible pour le moment.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Nous vous notifierons dès qu'une mission correspondant à votre profil sera disponible.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {availableMissions.map((assignment) => {
            const timeRemaining = getTimeRemaining(assignment.response_deadline);
            const isExpiring = new Date(assignment.response_deadline).getTime() - new Date().getTime() < 2 * 60 * 1000; // Moins de 2 minutes
            
            return (
              <Card key={assignment.id} className={`border-l-4 ${isExpiring ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {assignment.client_requests.service_type}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <Badge variant={isExpiring ? "destructive" : "default"}>
                        {timeRemaining}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{assignment.client_requests.location}</span>
                    </div>
                    
                    {assignment.client_requests.budget_range && (
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{assignment.client_requests.budget_range}</span>
                      </div>
                    )}
                    
                    {assignment.client_requests.preferred_date && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(assignment.client_requests.preferred_date), 'dd/MM/yyyy', { locale: fr })}
                          {assignment.client_requests.preferred_time && ` à ${assignment.client_requests.preferred_time}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Description :</h4>
                    <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                      {assignment.client_requests.service_description}
                    </p>
                  </div>

                  {isExpiring && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700">
                        ⚠️ Mission expirant bientôt ! Répondez rapidement.
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => respondToMission(assignment.id, 'accept')}
                      className="flex-1"
                      disabled={timeRemaining === "Expiré"}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accepter la mission
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => respondToMission(assignment.id, 'decline')}
                      disabled={timeRemaining === "Expiré"}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Décliner
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