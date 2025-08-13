import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  MapPin,
  Calendar,
  Euro,
  MessageSquare,
  UserCheck,
  Users,
  Timer,
  Ban,
  Send
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ClientRequest {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  service_type: string;
  service_description: string;
  location: string;
  preferred_date: string | null;
  preferred_time: string | null;
  budget_range: string | null;
  urgency_level: string;
  additional_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  assigned_provider_id: string | null;
}

export const AdminClientRequests = () => {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, [searchTerm, statusFilter, urgencyFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('client_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (urgencyFilter !== 'all') {
        query = query.eq('urgency_level', urgencyFilter);
      }

      if (searchTerm) {
        query = query.or(`client_name.ilike.%${searchTerm}%,service_type.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('client_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `La demande a été marquée comme ${newStatus}`,
      });

      // Mettre à jour l'état local
      setRequests(requests.map(req => 
        req.id === requestId 
          ? { ...req, status: newStatus }
          : req
      ));
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const getStatusStats = () => {
    const stats = {
      total: requests.length,
      new: requests.filter(r => r.status === 'new').length,
      searching_provider: requests.filter(r => r.status === 'searching_provider').length,
      awaiting_client_confirmation: requests.filter(r => r.status === 'awaiting_client_confirmation').length,
      confirmed: requests.filter(r => r.status === 'confirmed').length,
      in_progress: requests.filter(r => r.status === 'in_progress').length,
      completed: requests.filter(r => r.status === 'completed').length,
      dispute: requests.filter(r => r.status === 'dispute').length,
      unmatched: requests.filter(r => r.status === 'unmatched').length,
      urgent: requests.filter(r => r.urgency_level === 'urgent').length,
    };
    return stats;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'secondary';
      case 'searching_provider': return 'outline';
      case 'awaiting_client_confirmation': return 'default';
      case 'confirmed': return 'secondary';
      case 'in_progress': return 'outline';
      case 'completed': return 'default';
      case 'dispute': return 'destructive';
      case 'unmatched': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nouvelle demande';
      case 'searching_provider': return 'Recherche prestataire';
      case 'awaiting_client_confirmation': return 'Attente confirmation';
      case 'confirmed': return 'Confirmée';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminée';
      case 'dispute': return 'Litige';
      case 'unmatched': return 'Non pourvue';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <MessageSquare className="w-4 h-4" />;
      case 'searching_provider': return <Search className="w-4 h-4" />;
      case 'awaiting_client_confirmation': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Timer className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'dispute': return <AlertTriangle className="w-4 h-4" />;
      case 'unmatched': return <Ban className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'normal': return 'outline';
      default: return 'outline';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <Clock className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const handleSearchProviders = async (requestId: string) => {
    try {
      const { error } = await supabase.functions.invoke('match-providers', {
        body: { requestId }
      });
      
      if (error) throw error;
      
      await handleStatusUpdate(requestId, 'searching_provider');
      
      toast({
        title: "Recherche lancée",
        description: "Recherche de prestataires en cours",
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de lancer la recherche",
        variant: "destructive",
      });
    }
  };

  const handleSendNotification = async (requestId: string, message: string) => {
    try {
      // Logique d'envoi de notification
      toast({
        title: "Notification envoyée",
        description: message,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la notification",
        variant: "destructive",
      });
    }
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nouvelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.searching_provider}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.in_progress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom, service ou lieu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="new">Nouvelles demandes</SelectItem>
                <SelectItem value="searching_provider">En recherche prestataire</SelectItem>
                <SelectItem value="awaiting_client_confirmation">Attente confirmation</SelectItem>
                <SelectItem value="confirmed">Confirmées</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="dispute">Litiges</SelectItem>
                <SelectItem value="unmatched">Non pourvues</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par urgence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes urgences</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="normal">Normale</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table des demandes */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>Urgence</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.client_name}</div>
                      <div className="text-sm text-muted-foreground">{request.client_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.service_type}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {request.service_description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{request.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getUrgencyColor(request.urgency_level)} className="flex items-center gap-1 w-fit">
                      {getUrgencyIcon(request.urgency_level)}
                      {request.urgency_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(request.status)} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(request.status)}
                      {getStatusLabel(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(request.created_at), 'dd MMM yyyy', { locale: fr })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Voir
                          </Button>
                        </DialogTrigger>
                        
                        {/* Actions rapides selon le statut */}
                        {request.status === 'new' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSearchProviders(request.id)}
                          >
                            <Search className="w-4 h-4 mr-1" />
                            Rechercher
                          </Button>
                        )}
                        
                        {request.status === 'unmatched' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendNotification(request.id, "Aucun prestataire disponible, souhaitez-vous reprogrammer ?")}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Proposer
                          </Button>
                        )}
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Détails de la demande</DialogTitle>
                          </DialogHeader>
                          {selectedRequest && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold">Informations client</h4>
                                  <p><strong>Nom:</strong> {selectedRequest.client_name}</p>
                                  <p><strong>Email:</strong> {selectedRequest.client_email}</p>
                                  <p><strong>Téléphone:</strong> {selectedRequest.client_phone || 'Non renseigné'}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Détails du service</h4>
                                  <p><strong>Type:</strong> {selectedRequest.service_type}</p>
                                  <p><strong>Lieu:</strong> {selectedRequest.location}</p>
                                  <p><strong>Budget:</strong> {selectedRequest.budget_range || 'Non spécifié'}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold">Description</h4>
                                <p className="text-sm bg-gray-50 p-3 rounded">
                                  {selectedRequest.service_description}
                                </p>
                              </div>
                              {selectedRequest.additional_notes && (
                                <div>
                                  <h4 className="font-semibold">Notes supplémentaires</h4>
                                  <p className="text-sm bg-gray-50 p-3 rounded">
                                    {selectedRequest.additional_notes}
                                  </p>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Select
                                  value={selectedRequest.status}
                                  onValueChange={(value) => handleStatusUpdate(selectedRequest.id, value)}
                                >
                                  <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="new">Nouvelle demande</SelectItem>
                                    <SelectItem value="searching_provider">Recherche prestataire</SelectItem>
                                    <SelectItem value="awaiting_client_confirmation">Attente confirmation client</SelectItem>
                                    <SelectItem value="confirmed">Confirmée</SelectItem>
                                    <SelectItem value="in_progress">En cours</SelectItem>
                                    <SelectItem value="completed">Terminée</SelectItem>
                                    <SelectItem value="dispute">Litige</SelectItem>
                                    <SelectItem value="unmatched">Non pourvue</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};