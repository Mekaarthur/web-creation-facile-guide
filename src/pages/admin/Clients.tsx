import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, User, Plus, Users, TrendingUp, DollarSign, 
  Activity, Filter, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClientDetailsModal } from "@/components/admin/ClientDetailsModal";
import { CreateClientDialog } from "@/components/admin/CreateClientDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Client {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  account_status: string;
  stats: {
    total_bookings: number;
    total_spent: number;
    average_booking_value: number;
  };
}

interface Stats {
  total: number;
  new: number;
  active: number;
  blocked: number;
  activity_rate: number;
  retention_rate: number;
  total_revenue: number;
  average_revenue_per_client: number;
}

const AdminClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [stats, setStats] = useState<Stats>({
    total: 0,
    new: 0,
    active: 0,
    blocked: 0,
    activity_rate: 0,
    retention_rate: 0,
    total_revenue: 0,
    average_revenue_per_client: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadClients();
    loadStats();
  }, [searchTerm, statusFilter, serviceFilter]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-clients', {
        body: { 
          action: 'list', 
          searchTerm, 
          statusFilter,
          serviceFilter,
          limit: 100 
        }
      });

      if (error) throw error;

      if (data?.success) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-clients', {
        body: { action: 'get_stats', timeRange: '30d' }
      });

      if (error) throw error;

      if (data?.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string }> = {
      active: { variant: 'default' as const, label: 'Actif' },
      inactive: { variant: 'secondary' as const, label: 'Inactif' },
      blocked: { variant: 'destructive' as const, label: 'Bloqué' }
    };

    const config = variants[status] || variants.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setServiceFilter("all");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all" || serviceFilter !== "all";

  if (loading && !clients.length) {
    return <div className="p-6">Chargement des clients...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Gestion des clients de la plateforme</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.new} ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients actifs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active || 0}</div>
              <p className="text-xs text-muted-foreground">
                Taux: {(stats.activity_rate || 0)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CA total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.total_revenue || 0).toFixed(0)}€</div>
              <p className="text-xs text-muted-foreground">
                Moy: {(stats.average_revenue_per_client || 0).toFixed(0)}€/client
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rétention</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.retention_rate || 0)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.blocked || 0} bloqués
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="blocked">Bloqué</SelectItem>
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Univers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les univers</SelectItem>
                <SelectItem value="bika_kids">Bika Kids</SelectItem>
                <SelectItem value="bika_maison">Bika Maison</SelectItem>
                <SelectItem value="bika_vie">Bika Vie</SelectItem>
                <SelectItem value="bika_travel">Bika Travel</SelectItem>
                <SelectItem value="bika_animals">Bika Animal</SelectItem>
                <SelectItem value="bika_seniors">Bika Seniors</SelectItem>
                <SelectItem value="bika_pro">Bika Pro</SelectItem>
                <SelectItem value="bika_plus">Bika Plus</SelectItem>
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

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <Card 
            key={client.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedClientId(client.user_id)}
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={client.avatar_url} />
                  <AvatarFallback>
                    {getInitials(client.first_name, client.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {client.first_name} {client.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                </div>
                {getStatusBadge(client.account_status || 'active')}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Réservations:</span>
                  <span className="font-medium">{client.stats?.total_bookings || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total dépensé:</span>
                  <span className="font-medium">{(client.stats?.total_spent || 0).toFixed(2)}€</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Panier moyen:</span>
                  <span className="font-medium">
                    {(client.stats?.average_booking_value || 0).toFixed(2)}€
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Membre depuis:</span>
                  <span className="font-medium">
                    {new Date(client.created_at).toLocaleDateString('fr-FR', { 
                      year: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clients.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Aucun client trouvé
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {hasActiveFilters 
                ? "Essayez de modifier vos critères de recherche"
                : "Commencez par créer un nouveau client"
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

      <ClientDetailsModal
        clientId={selectedClientId}
        isOpen={!!selectedClientId}
        onClose={() => setSelectedClientId(null)}
        onClientUpdated={() => {
          loadClients();
          loadStats();
        }}
      />

      <CreateClientDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onClientCreated={() => {
          loadClients();
          loadStats();
        }}
      />
    </div>
  );
};

export default AdminClients;