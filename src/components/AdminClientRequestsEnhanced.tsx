import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  MapPin,
  Euro,
  MessageSquare,
  CreditCard,
  History,
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
  city: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  budget_range: string | null;
  urgency_level: string;
  additional_notes: string | null;
  status: string;
  payment_status: string;
  payment_amount: number;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  assigned_provider_id: string | null;
}

interface ActionHistory {
  id: string;
  action_type: string;
  old_value: string | null;
  new_value: string | null;
  admin_comment: string | null;
  created_at: string;
  admin_user_id: string | null;
}

export const AdminClientRequestsEnhanced = () => {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [actionHistory, setActionHistory] = useState<ActionHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [cities, setCities] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
    fetchFiltersData();
  }, [searchTerm, statusFilter, cityFilter, serviceFilter, paymentFilter, urgencyFilter]);

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
      
      if (cityFilter !== 'all') {
        query = query.eq('city', cityFilter);
      }
      
      if (serviceFilter !== 'all') {
        query = query.eq('service_type', serviceFilter);
      }
      
      if (paymentFilter !== 'all') {
        query = query.eq('payment_status', paymentFilter);
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

  const fetchFiltersData = async () => {
    try {
      // Récupérer les villes uniques
      const { data: cityData } = await supabase
        .from('client_requests')
        .select('city')
        .not('city', 'is', null);
      
      if (cityData) {
        const uniqueCities = [...new Set(cityData.map(item => item.city).filter(Boolean))];
        setCities(uniqueCities);
      }

      // Récupérer les types de services uniques
      const { data: serviceData } = await supabase
        .from('client_requests')
        .select('service_type');
      
      if (serviceData) {
        const uniqueServices = [...new Set(serviceData.map(item => item.service_type))];
        setServices(uniqueServices);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de filtres:', error);
    }
  };

  const fetchActionHistory = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('action_history')
        .select('*')
        .eq('entity_type', 'client_request')
        .eq('entity_id', requestId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActionHistory(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
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

      // Envoyer notification automatique
      await sendStatusNotification(requestId, newStatus);

      toast({
        title: "Statut mis à jour",
        description: `La demande a été marquée comme ${getStatusLabel(newStatus)}`,
      });

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

  const handlePaymentStatusUpdate = async (requestId: string, newPaymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('client_requests')
        .update({ 
          payment_status: newPaymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Statut de paiement mis à jour",
        description: `Le paiement a été marqué comme ${getPaymentStatusLabel(newPaymentStatus)}`,
      });

      setRequests(requests.map(req => 
        req.id === requestId 
          ? { ...req, payment_status: newPaymentStatus }
          : req
      ));
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de paiement",
        variant: "destructive",
      });
    }
  };

  const sendStatusNotification = async (requestId: string, status: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const messages = {
        'new': "Votre demande a bien été reçue, nous recherchons un prestataire disponible.",
        'searching_provider': "Nous recherchons un prestataire pour votre demande.",
        'awaiting_client_confirmation': "Un prestataire est disponible pour votre demande.",
        'confirmed': "Votre prestation est confirmée.",
        'in_progress': "Votre prestataire arrive.",
        'completed': "Merci pour votre confiance, donnez-nous votre avis.",
        'dispute': "Nous avons bien pris en compte votre réclamation.",
        'unmatched': "Aucun prestataire n'était disponible, souhaitez-vous reprogrammer ?"
      };

      await supabase.functions.invoke('send-notification-email', {
        body: {
          email: request.client_email,
          name: request.client_name,
          subject: `Mise à jour de votre demande - ${getStatusLabel(status)}`,
          message: messages[status as keyof typeof messages] || 'Mise à jour de votre demande'
        }
      });

      // Enregistrer la notification dans les logs
      await supabase
        .from('notification_logs')
        .insert({
          user_id: request.client_email, // Utiliser l'email comme identifiant temporaire
          notification_type: 'email',
          subject: `Mise à jour de votre demande - ${getStatusLabel(status)}`,
          content: messages[status as keyof typeof messages] || 'Mise à jour de votre demande',
          entity_type: 'client_request',
          entity_id: requestId,
          status: 'sent',
          sent_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erreur envoi notification:', error);
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
      pending_payment: requests.filter(r => r.payment_status === 'pending').length,
      paid: requests.filter(r => r.payment_status === 'paid').length,
      blocked: requests.filter(r => r.payment_status === 'blocked').length,
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'paid': return 'default';
      case 'blocked': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'paid': return 'Payé';
      case 'blocked': return 'Bloqué';
      default: return status;
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

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Statistiques étendues */}
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
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.in_progress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Litiges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.dispute}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres étendus */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes clients - Gestion avancée</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
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
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="new">Nouvelles demandes</SelectItem>
                <SelectItem value="searching_provider">En recherche</SelectItem>
                <SelectItem value="confirmed">Confirmées</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="dispute">Litiges</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes villes</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous services</SelectItem>
                {services.map(service => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous paiements</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="blocked">Bloqué</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table avec colonnes étendues */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Montant</TableHead>
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
                      <div className="text-sm text-muted-foreground">{request.city || request.location}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{request.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(request.status)}>
                      {getStatusLabel(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentStatusColor(request.payment_status)}>
                      {getPaymentStatusLabel(request.payment_status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Euro className="w-4 h-4 text-muted-foreground" />
                      <span>{request.payment_amount || 0}€</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              fetchActionHistory(request.id);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Gérer
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Gestion complète de la demande</DialogTitle>
                          </DialogHeader>
                          {selectedRequest && (
                            <div className="space-y-6">
                              {/* Informations principales */}
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <h4 className="font-semibold mb-3">Informations client</h4>
                                  <div className="space-y-2">
                                    <p><strong>Nom:</strong> {selectedRequest.client_name}</p>
                                    <p><strong>Email:</strong> {selectedRequest.client_email}</p>
                                    <p><strong>Téléphone:</strong> {selectedRequest.client_phone || 'Non renseigné'}</p>
                                    <p><strong>Lieu:</strong> {selectedRequest.location}</p>
                                    {selectedRequest.city && (
                                      <p><strong>Ville:</strong> {selectedRequest.city}</p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-3">Détails du service</h4>
                                  <div className="space-y-2">
                                    <p><strong>Type:</strong> {selectedRequest.service_type}</p>
                                    <p><strong>Budget:</strong> {selectedRequest.budget_range || 'Non spécifié'}</p>
                                    <p><strong>Date souhaitée:</strong> {selectedRequest.preferred_date || 'Flexible'}</p>
                                    <p><strong>Urgence:</strong> {selectedRequest.urgency_level}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Description */}
                              <div>
                                <h4 className="font-semibold mb-3">Description</h4>
                                <p className="text-sm bg-gray-50 p-3 rounded">
                                  {selectedRequest.service_description}
                                </p>
                              </div>

                              {/* Gestion des statuts */}
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <h4 className="font-semibold mb-3">Statut de la demande</h4>
                                  <Select
                                    value={selectedRequest.status}
                                    onValueChange={(value) => handleStatusUpdate(selectedRequest.id, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="new">Nouvelle demande</SelectItem>
                                      <SelectItem value="searching_provider">Recherche prestataire</SelectItem>
                                      <SelectItem value="awaiting_client_confirmation">Attente confirmation</SelectItem>
                                      <SelectItem value="confirmed">Confirmée</SelectItem>
                                      <SelectItem value="in_progress">En cours</SelectItem>
                                      <SelectItem value="completed">Terminée</SelectItem>
                                      <SelectItem value="dispute">Litige</SelectItem>
                                      <SelectItem value="unmatched">Non pourvue</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold mb-3">Statut de paiement</h4>
                                  <Select
                                    value={selectedRequest.payment_status}
                                    onValueChange={(value) => handlePaymentStatusUpdate(selectedRequest.id, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">En attente de paiement</SelectItem>
                                      <SelectItem value="paid">Payé</SelectItem>
                                      <SelectItem value="blocked">Bloqué</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Historique des actions */}
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <History className="w-4 h-4" />
                                  Historique des actions
                                </h4>
                                <div className="max-h-40 overflow-y-auto border rounded p-3">
                                  {actionHistory.length > 0 ? (
                                    actionHistory.map((action) => (
                                      <div key={action.id} className="text-sm border-b pb-2 mb-2 last:border-b-0">
                                        <div className="flex justify-between">
                                          <span className="font-medium">{action.action_type}</span>
                                          <span className="text-muted-foreground">
                                            {format(new Date(action.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                          </span>
                                        </div>
                                        {action.old_value && action.new_value && (
                                          <div className="text-xs text-muted-foreground">
                                            {action.old_value} → {action.new_value}
                                          </div>
                                        )}
                                        {action.admin_comment && (
                                          <div className="text-xs italic">{action.admin_comment}</div>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground">Aucun historique disponible</p>
                                  )}
                                </div>
                              </div>

                              {/* Actions rapides */}
                              <div>
                                <h4 className="font-semibold mb-3">Actions rapides</h4>
                                <div className="flex gap-2 flex-wrap">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => sendStatusNotification(selectedRequest.id, selectedRequest.status)}
                                  >
                                    <Send className="w-4 h-4 mr-1" />
                                    Notifier client
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                    Messagerie
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <CreditCard className="w-4 h-4 mr-1" />
                                    Paiement
                                  </Button>
                                </div>
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