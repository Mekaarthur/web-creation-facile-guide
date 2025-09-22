import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, Star, MapPin, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Provider {
  id: string;
  user_id: string;
  business_name: string;
  status: string;
  created_at: string;
  is_verified?: boolean;
  rating?: number;
  description?: string;
  location?: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  } | null;
  bookings?: any[];
  reviews?: any[];
  documents?: any[];
}

export default function AdminPrestataires() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const { toast } = useToast();

  const loadProviders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-providers', {
        body: { action: 'list', status: statusFilter, searchTerm, limit: 50 }
      });

      if (error) throw error;

      if (data?.success) {
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des prestataires:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les prestataires",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProviderAction = async (providerId: string, action: 'approve' | 'reject' | 'examine') => {
    try {
      if (action === 'examine') {
        // Récupérer les détails via l'edge function
        const { data, error } = await supabase.functions.invoke('admin-providers', {
          body: { action: 'get_provider_details', providerId }
        });

        if (error) throw error;

        if (data?.success) {
          setSelectedProvider(data.provider);
        }
        return;
      }

      // Utiliser l'edge function pour approuver/rejeter
      const { data, error } = await supabase.functions.invoke('admin-providers', {
        body: { action, providerId }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Statut mis à jour",
          description: data.message,
        });

        // Recharger la liste
        loadProviders();
      }
    } catch (error: any) {
      console.error('Erreur action prestataire:', error);
      toast({
        title: "Erreur d'action",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadProviders();
    toast({
      title: "Actualisation",
      description: "Liste des prestataires actualisée",
    });
  };

  useEffect(() => {
    loadProviders();

    // Abonnement temps réel aux changements de prestataires
    const channel = supabase
      .channel('admin-providers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'providers' }, () => {
        loadProviders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = 
      provider.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || provider.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statusCounts = {
    all: providers.length,
    pending: providers.filter(p => p.status === 'pending').length,
    approved: providers.filter(p => p.status === 'approved').length,
    rejected: providers.filter(p => p.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des prestataires</h1>
        <p className="text-muted-foreground">Gérez les prestataires et leur validation</p>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Filtres et recherche</CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Actualiser
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par nom ou entreprise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtres avancés
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Onglets par statut */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            Tous ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            En attente ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approuvés ({statusCounts.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejetés ({statusCounts.rejected})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4">
          {filteredProviders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Aucun prestataire trouvé</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredProviders.map((provider) => (
                <Card key={provider.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            {provider.business_name || `Prestataire ${provider.id.slice(0, 8)}`}
                          </h3>
                          {getStatusBadge(provider.status)}
                        </div>
                        <p className="text-muted-foreground">
                          {provider.business_name || 'Pas d\'entreprise renseignée'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Inscrit le {new Date(provider.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleProviderAction(provider.id, 'examine')}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Voir détails
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Détails du prestataire</DialogTitle>
                            </DialogHeader>
                            {selectedProvider && (
                              <div className="space-y-6">
                                {/* Informations générales */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Nom/Entreprise</label>
                                    <p className="font-semibold">{selectedProvider.business_name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Note moyenne</label>
                                    <div className="flex items-center gap-2">
                                      <Star className="w-4 h-4 text-yellow-500" />
                                      <span>{selectedProvider.rating?.toFixed(1) || 'N/A'}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Localisation</label>
                                    <p>{selectedProvider.location || 'Non renseignée'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Statut</label>
                                    {getStatusBadge(selectedProvider.status)}
                                  </div>
                                </div>

                                {/* Description */}
                                {selectedProvider.description && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                                    <p className="mt-1 p-3 bg-muted rounded">{selectedProvider.description}</p>
                                  </div>
                                )}

                                {/* Documents */}
                                {selectedProvider.documents && selectedProvider.documents.length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Documents</label>
                                    <div className="mt-2 space-y-2">
                                      {selectedProvider.documents.map((doc: any) => (
                                        <div key={doc.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                          <div>
                                            <p className="text-sm font-medium">{doc.document_type}</p>
                                            <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                                          </div>
                                          <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'}>
                                            {doc.status}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Missions récentes */}
                                {selectedProvider.bookings && selectedProvider.bookings.length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Missions récentes</label>
                                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                      {selectedProvider.bookings.slice(0, 5).map((booking: any) => (
                                        <div key={booking.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                          <div>
                                            <p className="text-sm font-medium">{booking.services?.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {format(new Date(booking.booking_date), 'dd/MM/yyyy', { locale: fr })}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <Badge variant="outline" className="text-xs">
                                              {booking.status}
                                            </Badge>
                                            <p className="text-sm font-semibold">{booking.total_price}€</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-4">
                                  {selectedProvider.status === 'pending' && (
                                    <>
                                      <Button 
                                        variant="default" 
                                        size="sm"
                                        onClick={() => handleProviderAction(selectedProvider.id, 'approve')}
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approuver
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => handleProviderAction(selectedProvider.id, 'reject')}
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Rejeter
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {provider.status === 'pending' && (
                          <>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleProviderAction(provider.id, 'approve')}
                            >
                              Approuver
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleProviderAction(provider.id, 'reject')}
                            >
                              Rejeter
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
        </TabsContent>
      </Tabs>
    </div>
  );
}