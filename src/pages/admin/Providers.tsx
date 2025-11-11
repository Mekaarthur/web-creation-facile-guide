import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search, Users, TrendingUp, Star, Activity, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProviderDetailsModal } from "@/components/admin/ProviderDetailsModal";
import { universeServices } from "@/utils/universeServices";

interface Provider {
  id: string;
  user_id: string;
  business_name: string;
  email?: string;
  phone?: string;
  created_at: string;
  status: string;
  is_verified: boolean;
  universes: string[];
  average_rating?: number;
  total_missions?: number;
  total_earned?: number;
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  suspended: number;
  total_missions: number;
  total_revenue: number;
  average_rating: number;
}

const AdminProviders = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [universeFilter, setUniverseFilter] = useState("all");
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    active: 0,
    suspended: 0,
    total_missions: 0,
    total_revenue: 0,
    average_rating: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProviders();
    loadStats();
  }, [searchTerm, statusFilter, universeFilter]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      console.log('Loading providers with filters:', { statusFilter, searchTerm, universeFilter });
      
      const { data, error } = await supabase.functions.invoke('admin-providers', {
        body: { 
          action: 'list',
          status: statusFilter,
          searchTerm: searchTerm,
          limit: 100
        }
      });

      console.log('Providers response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.success) {
        console.log('Received providers:', data.providers?.length || 0);
        let filteredProviders = data.providers || [];
        
        // Filter by universe on the client side if needed
        if (universeFilter && universeFilter !== 'all') {
          filteredProviders = filteredProviders.filter((p: Provider) =>
            p.universes?.includes(universeFilter)
          );
        }

        console.log('Filtered providers:', filteredProviders.length);
        setProviders(filteredProviders);
      } else {
        console.error('Unexpected response format:', data);
        setProviders([]);
      }
    } catch (error: any) {
      console.error('Erreur chargement prestataires:', error);
      setProviders([]);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les prestataires",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('Loading stats...');
      const { data, error } = await supabase.functions.invoke('admin-providers', {
        body: { action: 'get_stats', timeRange: '30d' }
      });

      console.log('Stats response:', { data, error });

      if (error) {
        console.error('Stats error:', error);
        throw error;
      }

      if (data?.success && data?.stats) {
        console.log('Setting stats:', data.stats);
        setStats(data.stats);
      } else {
        console.error('Unexpected stats format:', data);
        // Set default stats on error
        setStats({
          total: 0,
          pending: 0,
          active: 0,
          suspended: 0,
          total_missions: 0,
          total_revenue: 0,
          average_rating: 0,
        });
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      // Set default stats on error
      setStats({
        total: 0,
        pending: 0,
        active: 0,
        suspended: 0,
        total_missions: 0,
        total_revenue: 0,
        average_rating: 0,
      });
    }
  };

  const getStatusBadge = (provider: Provider) => {
    if (provider.status === 'active' && provider.is_verified) {
      return <Badge variant="default">Actif</Badge>;
    } else if (provider.status === 'inactive') {
      return <Badge variant="destructive">Suspendu</Badge>;
    } else if (provider.status === 'pending_validation') {
      return <Badge variant="secondary">En attente</Badge>;
    } else if (provider.status === 'documents_validated') {
      return <Badge variant="outline">En cours d'examen</Badge>;
    } else {
      return <Badge variant="secondary">En attente</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setUniverseFilter("all");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all" || universeFilter !== "all";

  if (loading && !providers.length) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Prestataires</h1>
        <p className="text-muted-foreground">Gestion des prestataires de la plateforme</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total prestataires</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pending} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestataires actifs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Taux: {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missions totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_missions}</div>
            <p className="text-xs text-muted-foreground">
              Moy: {stats.active > 0 ? (stats.total_missions / stats.active).toFixed(1) : 0}/prestataire
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.average_rating || 0).toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              Revenus: {(stats.total_revenue || 0).toFixed(0)}€
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
              </SelectContent>
            </Select>

            <Select value={universeFilter} onValueChange={setUniverseFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Univers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les univers</SelectItem>
                {universeServices.map(universe => (
                  <SelectItem key={universe.id} value={universe.id}>
                    {universe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => {
          try {
            return (
              <Card
                key={provider.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedProviderId(provider.user_id)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(provider.business_name || 'N/A')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {provider.business_name || 'Sans nom'}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {provider.email || 'Pas d\'email'}
                      </p>
                    </div>
                    {getStatusBadge(provider)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Missions:</span>
                      <span className="font-medium">{provider.total_missions || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Note:</span>
                      <span className="font-medium flex items-center gap-1">
                        {(provider.average_rating || 0).toFixed(1)}
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Revenus:</span>
                      <span className="font-medium">
                        {(provider.total_earned || 0).toFixed(2)}€
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Univers:</span>
                      <span className="font-medium">
                        {provider.universes?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Inscription:</span>
                      <span className="font-medium">
                        {provider.created_at
                          ? new Date(provider.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'short',
                            })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          } catch (renderError) {
            console.error('Error rendering provider card:', provider?.id, renderError);
            return null;
          }
        })}
      </div>

      {providers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Aucun prestataire trouvé
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {hasActiveFilters
                ? "Essayez de modifier vos critères"
                : "Aucun prestataire enregistré"
              }
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                <X className="h-4 w-4 mr-2" />
                Réinitialiser les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <ProviderDetailsModal
        providerId={selectedProviderId}
        isOpen={!!selectedProviderId}
        onClose={() => setSelectedProviderId(null)}
        onProviderUpdated={() => {
          loadProviders();
          loadStats();
        }}
      />
    </div>
  );
};

export default AdminProviders;
