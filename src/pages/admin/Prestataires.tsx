import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Provider {
  id: string;
  user_id: string;
  business_name: string;
  status: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

export default function AdminPrestataires() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select(`
          *,
          profiles (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders((data as any) || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les prestataires",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
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
        <CardHeader>
          <CardTitle className="text-lg">Filtres et recherche</CardTitle>
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
                            {provider.profiles?.first_name || 'Prénom'} {provider.profiles?.last_name || 'Nom'}
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
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Voir détails
                        </Button>
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