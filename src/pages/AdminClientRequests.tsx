import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StatusManager from '@/components/StatusManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter,
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface ClientRequest {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_type: string;
  service_description: string;
  location: string;
  preferred_date: string;
  preferred_time: string;
  budget_range: string;
  urgency_level: string;
  status: string;
  assigned_provider_id: string;
  additional_notes: string;
  created_at: string;
  updated_at: string;
}

const AdminClientRequests = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('client_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (serviceFilter !== 'all') {
        query = query.eq('service_type', serviceFilter);
      }

      if (searchTerm) {
        query = query.or(
          `client_name.ilike.%${searchTerm}%,client_email.ilike.%${searchTerm}%,service_description.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les demandes"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [searchTerm, statusFilter, serviceFilter]);

  const handleStatusUpdate = (requestId: string, newStatus: string) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status: newStatus } : req
      )
    );
  };

  const getStatusStats = () => {
    const stats = {
      total: requests.length,
      new: requests.filter(r => r.status === 'new').length,
      processing: requests.filter(r => r.status === 'processing').length,
      assigned: requests.filter(r => r.status === 'assigned').length,
      converted: requests.filter(r => r.status === 'converted').length,
      urgent: requests.filter(r => r.urgency_level === 'urgent').length,
    };
    return stats;
  };

  const stats = getStatusStats();

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4" />;
      case 'high':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Gestion des Demandes Clients - Admin Bikawo</title>
        <meta name="description" content="Gestion et suivi des demandes clients" />
      </Helmet>

      <Navbar />
      
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Gestion des Demandes Clients
            </h1>
            <p className="text-muted-foreground">
              Gérez et suivez toutes les demandes de services reçues
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="flex items-center p-4">
                <Users className="w-6 h-6 text-primary mr-3" />
                <div>
                  <p className="text-xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-4">
                <Clock className="w-6 h-6 text-blue-500 mr-3" />
                <div>
                  <p className="text-xl font-bold">{stats.new}</p>
                  <p className="text-xs text-muted-foreground">Nouvelles</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-4">
                <Eye className="w-6 h-6 text-yellow-500 mr-3" />
                <div>
                  <p className="text-xl font-bold">{stats.processing}</p>
                  <p className="text-xs text-muted-foreground">En traitement</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-4">
                <Users className="w-6 h-6 text-purple-500 mr-3" />
                <div>
                  <p className="text-xl font-bold">{stats.assigned}</p>
                  <p className="text-xs text-muted-foreground">Assignées</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-4">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <div>
                  <p className="text-xl font-bold">{stats.converted}</p>
                  <p className="text-xs text-muted-foreground">Converties</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-4">
                <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                <div>
                  <p className="text-xl font-bold">{stats.urgent}</p>
                  <p className="text-xs text-muted-foreground">Urgentes</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtres */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtres et Recherche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="new">Nouvelles</SelectItem>
                    <SelectItem value="processing">En traitement</SelectItem>
                    <SelectItem value="assigned">Assignées</SelectItem>
                    <SelectItem value="converted">Converties</SelectItem>
                    <SelectItem value="rejected">Rejetées</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrer par service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les services</SelectItem>
                    <SelectItem value="ménage">Ménage</SelectItem>
                    <SelectItem value="garde-enfants">Garde d'enfants</SelectItem>
                    <SelectItem value="aide-seniors">Aide aux seniors</SelectItem>
                    <SelectItem value="jardinage">Jardinage</SelectItem>
                    <SelectItem value="bricolage">Bricolage</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button onClick={fetchRequests} variant="outline">
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Liste des demandes */}
          <Card>
            <CardHeader>
              <CardTitle>Demandes récentes ({requests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Chargement...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucune demande trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold flex items-center gap-3">
                            {request.client_name}
                            <Badge className={getUrgencyColor(request.urgency_level)}>
                              <span className="flex items-center gap-1">
                                {getUrgencyIcon(request.urgency_level)}
                                {request.urgency_level}
                              </span>
                            </Badge>
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.service_type} • {request.location}
                          </p>
                        </div>
                        
                        <StatusManager
                          itemId={request.id}
                          currentStatus={request.status}
                          itemType="client_request"
                          onStatusUpdate={(newStatus) => handleStatusUpdate(request.id, newStatus)}
                          itemData={request}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {request.client_email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {request.client_phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {request.preferred_date && new Date(request.preferred_date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      
                      <p className="text-sm mb-3 text-foreground">
                        <strong>Service:</strong> {request.service_description}
                      </p>
                      
                      {request.budget_range && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Budget:</strong> {request.budget_range}
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-xs text-muted-foreground">
                          Créée le {new Date(request.created_at).toLocaleString('fr-FR')}
                        </span>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Voir détails
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                Demande de {selectedRequest?.client_name}
                              </DialogTitle>
                            </DialogHeader>
                            
                            {selectedRequest && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Informations client</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><strong>Nom:</strong> {selectedRequest.client_name}</p>
                                      <p><strong>Email:</strong> {selectedRequest.client_email}</p>
                                      <p><strong>Téléphone:</strong> {selectedRequest.client_phone}</p>
                                      <p><strong>Localisation:</strong> {selectedRequest.location}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold mb-2">Détails du service</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><strong>Type:</strong> {selectedRequest.service_type}</p>
                                      <p><strong>Date souhaitée:</strong> {selectedRequest.preferred_date}</p>
                                      <p><strong>Heure:</strong> {selectedRequest.preferred_time}</p>
                                      <p><strong>Budget:</strong> {selectedRequest.budget_range}</p>
                                      <p><strong>Urgence:</strong> {selectedRequest.urgency_level}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold mb-2">Description du service</h4>
                                  <p className="text-sm bg-muted p-3 rounded-lg">
                                    {selectedRequest.service_description}
                                  </p>
                                </div>
                                
                                {selectedRequest.additional_notes && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Notes supplémentaires</h4>
                                    <p className="text-sm bg-muted p-3 rounded-lg">
                                      {selectedRequest.additional_notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminClientRequests;