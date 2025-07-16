import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Phone, Mail, DollarSign, AlertCircle, Users, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientRequest {
  id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  service_type: string;
  service_description: string;
  preferred_date?: string;
  preferred_time?: string;
  budget_range?: string;
  location: string;
  urgency_level: string;
  additional_notes?: string;
  status: string;
  created_at: string;
}

export const ClientRequestsList = () => {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingProviders, setMatchingProviders] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('client_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching client requests:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchMatchingProviders = async (serviceType: string, location: string, urgency: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('match-providers', {
        body: { serviceType, location, urgency }
      });
      
      if (error) throw error;
      return data.providers || [];
    } catch (error) {
      console.error('Error matching providers:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchServices();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('client-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'assigned': return 'secondary';
      case 'in_progress': return 'outline';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-green-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const handleViewProviders = async (request: ClientRequest) => {
    setSelectedRequestId(request.id);
    const providers = await fetchMatchingProviders(
      request.service_type, 
      request.location, 
      request.urgency_level
    );
    setMatchingProviders(providers);
  };

  const handleConvertToBooking = async (requestId: string, providerId: string, serviceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('convert-request-to-booking', {
        body: { requestId, providerId, serviceId }
      });

      if (error) throw error;

      toast({
        title: "Mission créée",
        description: "La demande a été convertie en mission avec succès",
      });
      
      fetchRequests(); // Refresh the list
      setSelectedRequestId(null); // Close dialog
    } catch (error) {
      console.error('Error converting request:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la mission",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('client_requests')
        .update({ status: 'assigned' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Demande acceptée",
        description: "Vous avez accepté cette demande client",
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accepter la demande",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des demandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Demandes Clients</h2>
        <Badge variant="outline">{requests.length} demande(s)</Badge>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Aucune demande client pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {request.client_name}
                      <Badge 
                        variant={getStatusBadgeVariant(request.status)}
                        className="ml-2"
                      >
                        {request.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {request.client_email}
                      </span>
                      {request.client_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {request.client_phone}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`h-4 w-4 ${getUrgencyColor(request.urgency_level)}`} />
                    <span className={`text-sm font-medium ${getUrgencyColor(request.urgency_level)}`}>
                      {request.urgency_level}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Service demandé</h4>
                  <Badge variant="secondary" className="mb-2">{request.service_type}</Badge>
                  <p className="text-sm text-muted-foreground">{request.service_description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{request.location}</span>
                  </div>
                  
                  {request.preferred_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(request.preferred_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  
                  {request.preferred_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{request.preferred_time}</span>
                    </div>
                  )}
                  
                  {request.budget_range && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{request.budget_range}</span>
                    </div>
                  )}
                </div>

                {request.additional_notes && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Notes additionnelles</h4>
                    <p className="text-sm text-muted-foreground">{request.additional_notes}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-xs text-muted-foreground">
                    Reçu le {new Date(request.created_at).toLocaleDateString('fr-FR')} à {new Date(request.created_at).toLocaleTimeString('fr-FR')}
                  </span>
                  
                  <div className="flex gap-2">
                    {request.status === 'new' && (
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProviders(request)}
                            >
                              <Users className="h-4 w-4 mr-1" />
                              Voir prestataires
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Prestataires disponibles</DialogTitle>
                            </DialogHeader>
                            
                            <div className="max-h-96 overflow-y-auto space-y-4">
                              {matchingProviders.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                  Aucun prestataire trouvé pour cette demande
                                </p>
                              ) : (
                                matchingProviders.map((provider) => (
                                  <Card key={provider.provider_id} className="p-4">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <h4 className="font-semibold">{provider.business_name || 'Prestataire'}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="outline">Note: {provider.rating}/5</Badge>
                                          <Badge variant="secondary">Match: {provider.match_score}%</Badge>
                                          {provider.recommended && (
                                            <Badge className="bg-green-500">
                                              <CheckCircle2 className="h-3 w-3 mr-1" />
                                              Recommandé
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          <MapPin className="h-3 w-3 inline mr-1" />
                                          {provider.location}
                                        </p>
                                      </div>
                                      
                                      <div className="flex flex-col gap-2">
                                        <Select onValueChange={(serviceId) => {
                                          if (serviceId && selectedRequestId) {
                                            handleConvertToBooking(selectedRequestId, provider.provider_id, serviceId);
                                          }
                                        }}>
                                          <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Créer mission" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {services.map((service) => (
                                              <SelectItem key={service.id} value={service.id}>
                                                {service.name} - {service.price_per_hour}€/h
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </Card>
                                ))
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          onClick={() => handleAcceptRequest(request.id)}
                          size="sm"
                        >
                          Accepter
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};