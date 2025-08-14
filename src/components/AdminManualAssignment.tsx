import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  MapPin, 
  Clock,
  UserCheck,
  AlertCircle 
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ClientRequest {
  id: string;
  client_name: string;
  service_type: string;
  location: string;
  postal_code?: string;
  preferred_date?: string;
  preferred_time?: string;
  status: string;
  created_at: string;
  service_description: string;
}

interface Provider {
  id: string;
  business_name: string;
  location: string;
  rating: number;
  postal_codes?: string[];
  performance_score: number;
  missions_completed: number;
}

export const AdminManualAssignment = () => {
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUnassignedRequests();
    loadProviders();
  }, []);

  const loadUnassignedRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_requests')
        .select('*')
        .in('status', ['new', 'unmatched'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes",
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
        .select('*')
        .eq('status', 'active')
        .eq('is_verified', true)
        .order('performance_score', { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  };

  const getCompatibleProviders = (request: ClientRequest) => {
    return providers.filter(provider => {
      // Vérifier la zone géographique
      const locationMatch = provider.location?.toLowerCase().includes(request.location?.toLowerCase()) ||
                           (request.postal_code && provider.postal_codes?.includes(request.postal_code));
      
      // Pour l'instant, on affiche tous les prestataires, l'admin peut choisir
      return true;
    }).sort((a, b) => {
      // Priorité : zone géographique, puis performance
      const aLocationMatch = a.location?.toLowerCase().includes(request.location?.toLowerCase()) ||
                            (request.postal_code && a.postal_codes?.includes(request.postal_code));
      const bLocationMatch = b.location?.toLowerCase().includes(request.location?.toLowerCase()) ||
                            (request.postal_code && b.postal_codes?.includes(request.postal_code));
      
      if (aLocationMatch && !bLocationMatch) return -1;
      if (!aLocationMatch && bLocationMatch) return 1;
      
      return (b.performance_score || 0) - (a.performance_score || 0);
    });
  };

  const handleManualAssignment = async () => {
    if (!selectedRequest || !selectedProviderId) return;

    setAssignmentLoading(true);
    try {
      // D'abord créer une mission
      const { data: mission, error: missionError } = await supabase
        .from('missions')
        .insert({
          client_request_id: selectedRequest.id,
          eligible_providers: [selectedProviderId],
          assigned_provider_id: selectedProviderId,
          assigned_by_admin: true,
          admin_assignment_time: new Date().toISOString(),
          assigned_at: new Date().toISOString(),
          sent_notifications: 1,
          responses_received: 1
        })
        .select()
        .single();

      if (missionError) throw missionError;

      // Utiliser la fonction SQL pour l'attribution
      const { data, error } = await supabase.rpc('assign_mission_manually', {
        p_mission_id: mission.id,
        p_provider_id: selectedProviderId
      });

      if (error) throw error;

      toast({
        title: "Mission assignée",
        description: "Le prestataire a été notifié de son attribution",
      });

      // Recharger les données
      loadUnassignedRequests();
      setSelectedRequest(null);
      setSelectedProviderId('');

    } catch (error: any) {
      console.error('Error assigning mission:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'assigner la mission",
        variant: "destructive",
      });
    } finally {
      setAssignmentLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="default">Nouvelle</Badge>;
      case 'unmatched':
        return <Badge variant="destructive">Non pourvue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Attribution manuelle des missions</h2>
        <Badge variant="secondary">
          {clientRequests.length} demande{clientRequests.length !== 1 ? 's' : ''} à traiter
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
      ) : clientRequests.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <UserCheck className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium">Toutes les demandes sont traitées !</p>
            <p className="text-sm text-muted-foreground mt-2">
              Aucune demande en attente d'attribution manuelle.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {clientRequests.map((request) => {
            const compatibleProviders = getCompatibleProviders(request);
            
            return (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {request.service_type} - {request.client_name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Attribuer
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Attribuer un prestataire</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Détails de la demande */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h3 className="font-medium mb-2">Détails de la demande</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span>{request.location}</span>
                                </div>
                                {request.preferred_date && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span>
                                      {format(new Date(request.preferred_date), 'dd/MM/yyyy', { locale: fr })}
                                      {request.preferred_time && ` à ${request.preferred_time}`}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">
                                {request.service_description}
                              </p>
                            </div>

                            {/* Sélection du prestataire */}
                            <div>
                              <h3 className="font-medium mb-3">
                                Choisir un prestataire ({compatibleProviders.length} disponible{compatibleProviders.length !== 1 ? 's' : ''})
                              </h3>
                              
                              <Select 
                                value={selectedProviderId} 
                                onValueChange={setSelectedProviderId}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un prestataire" />
                                </SelectTrigger>
                                <SelectContent>
                                  {compatibleProviders.map((provider) => {
                                    const isInZone = provider.location?.toLowerCase().includes(request.location?.toLowerCase()) ||
                                                   (request.postal_code && provider.postal_codes?.includes(request.postal_code));
                                    
                                    return (
                                      <SelectItem key={provider.id} value={provider.id}>
                                        <div className="flex items-center justify-between w-full">
                                          <div>
                                            <span className="font-medium">{provider.business_name}</span>
                                            <span className="text-sm text-muted-foreground ml-2">
                                              ({provider.location})
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {!isInZone && (
                                              <AlertCircle className="w-4 h-4 text-amber-500" />
                                            )}
                                            <Badge variant="secondary" className="text-xs">
                                              ⭐ {provider.rating || 0}
                                            </Badge>
                                          </div>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex justify-end gap-3">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(null);
                                  setSelectedProviderId('');
                                }}
                              >
                                Annuler
                              </Button>
                              <Button
                                onClick={handleManualAssignment}
                                disabled={!selectedProviderId || assignmentLoading}
                              >
                                {assignmentLoading ? "Attribution..." : "Attribuer la mission"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{request.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{compatibleProviders.length} prestataire{compatibleProviders.length !== 1 ? 's' : ''} compatible{compatibleProviders.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm mt-3 p-3 bg-gray-50 rounded">
                    {request.service_description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};