import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Clock, User, Search, DollarSign, TrendingUp, Eye, PieChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MissionDetailsModal } from "@/components/admin/MissionDetailsModal";
import { ProviderStatsModal } from "@/components/admin/ProviderStatsModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Mission {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  address: string | null;
  total_price: number;
  status: string;
  created_at: string;
  client_id: string;
  provider_id: string | null;
  service_id: string;
  notes?: string | null;
  cancellation_reason?: string | null;
  services: {
    name: string;
    category: string;
  } | null;
  client_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  provider_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const AdminMissions = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [universeFilter, setUniverseFilter] = useState("all");
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<{ id: string; name: string } | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    revenue: 0,
    commission: 0,
    providerPayment: 0,
    byStatus: [] as { name: string; value: number; color: string }[]
  });

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            name,
            category
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load client and provider profiles separately
      const missionsWithDetails = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          // Load client profile
          const { data: clientProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('user_id', booking.client_id)
            .single();

          let providerProfile = null;
          if (booking.provider_id) {
            const { data: providerData } = await supabase
              .from('providers')
              .select('user_id')
              .eq('id', booking.provider_id)
              .single();

            if (providerData?.user_id) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('user_id', providerData.user_id)
                .single();

              providerProfile = profileData;
            }
          }

          return {
            ...booking,
            client_profile: clientProfile,
            provider_profile: providerProfile
          };
        })
      );

      setMissions(missionsWithDetails as Mission[]);

      // Calculate stats
      const totalRevenue = missionsWithDetails.reduce((sum, m) => sum + (Number(m.total_price) || 0), 0);
      const commission = totalRevenue * 0.28;
      const providerPayment = totalRevenue * 0.72;

      // Calcul des stats par statut
      const statusColors: Record<string, string> = {
        pending: 'hsl(var(--chart-1))',
        assigned: 'hsl(var(--chart-2))',
        accepted: 'hsl(var(--chart-3))',
        in_progress: 'hsl(var(--chart-4))',
        completed: 'hsl(var(--chart-5))',
        cancelled: 'hsl(var(--destructive))',
        paid: 'hsl(var(--primary))'
      };

      const statusLabels: Record<string, string> = {
        pending: 'En attente',
        assigned: 'Assignée',
        accepted: 'Acceptée',
        in_progress: 'En cours',
        completed: 'Terminée',
        cancelled: 'Annulée',
        paid: 'Payée'
      };

      const statusCounts = missionsWithDetails.reduce((acc, m) => {
        acc[m.status] = (acc[m.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
        color: statusColors[status] || 'hsl(var(--muted))'
      }));

      setStats({
        total: missionsWithDetails.length,
        revenue: totalRevenue,
        commission,
        providerPayment,
        byStatus
      });
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMissions = missions.filter(mission => {
    const matchesSearch = 
      (mission.services?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mission.client_profile?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mission.client_profile?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mission.provider_profile?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mission.provider_profile?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mission.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || mission.status === statusFilter;
    const matchesUniverse = universeFilter === "all" || mission.services?.category === universeFilter;
    
    return matchesSearch && matchesStatus && matchesUniverse;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string }> = {
      pending: { variant: 'outline', label: 'En attente' },
      assigned: { variant: 'secondary', label: 'Assignée' },
      accepted: { variant: 'default', label: 'Acceptée' },
      in_progress: { variant: 'default', label: 'En cours' },
      completed: { variant: 'default', label: 'Terminée' },
      cancelled: { variant: 'destructive', label: 'Annulée' },
      paid: { variant: 'default', label: 'Payée' }
    };

    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return missions.length;
    return missions.filter(mission => mission.status === status).length;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diff.toFixed(1);
  };

  const calculateCommission = (totalPrice: number) => {
    return (totalPrice * 0.28).toFixed(2);
  };

  const calculateProviderPayment = (totalPrice: number) => {
    return (totalPrice * 0.72).toFixed(2);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Missions</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Gestion complète des missions et paiements</p>
      </div>

      {/* Statistics Cards & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total missions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {getStatusCount('pending')} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.revenue.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground">
              Total des missions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Bikawo</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.commission.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground">
              28% des missions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reversé prestataires</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.providerPayment.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground">
              72% des missions
            </p>
          </CardContent>
        </Card>
        </div>

        {/* Graphique répartition par statut */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Répartition par statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={stats.byStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et recherche</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par client, prestataire, adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="assigned">Assignée</SelectItem>
                <SelectItem value="accepted">Acceptée</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
                <SelectItem value="paid">Payée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={universeFilter} onValueChange={setUniverseFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
          </div>
        </CardHeader>
      </Card>

      {/* Missions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des missions ({filteredMissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Mission</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Prestataire</TableHead>
                  <TableHead>Univers / Service</TableHead>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Montant total</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Revenu prestataire</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">
                        Aucune mission trouvée
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Essayez de modifier vos critères de recherche
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMissions.map((mission) => (
                    <TableRow key={mission.id}>
                      <TableCell className="font-mono text-xs">
                        {mission.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {mission.client_profile?.first_name} {mission.client_profile?.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {mission.client_profile?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {mission.provider_profile && mission.provider_id ? (
                          <Button
                            variant="link"
                            className="font-medium p-0 h-auto"
                            onClick={() => setSelectedProvider({
                              id: mission.provider_id!,
                              name: `${mission.provider_profile.first_name} ${mission.provider_profile.last_name}`
                            })}
                          >
                            {mission.provider_profile.first_name} {mission.provider_profile.last_name}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">Non assigné</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{mission.services?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {mission.services?.category}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{new Date(mission.booking_date).toLocaleDateString('fr-FR')}</div>
                          <div className="text-xs text-muted-foreground">
                            {mission.start_time} - {mission.end_time}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {calculateDuration(mission.start_time, mission.end_time)}h
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(mission.status)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {Number(mission.total_price).toFixed(2)}€
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {calculateCommission(Number(mission.total_price))}€
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {calculateProviderPayment(Number(mission.total_price))}€
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMission(mission)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mission Details Modal */}
      {selectedMission && (
        <MissionDetailsModal
          mission={selectedMission}
          onClose={() => setSelectedMission(null)}
          onUpdate={loadMissions}
        />
      )}

      {/* Provider Stats Modal */}
      {selectedProvider && (
        <ProviderStatsModal
          providerId={selectedProvider.id}
          providerName={selectedProvider.name}
          onClose={() => setSelectedProvider(null)}
        />
      )}
    </div>
  );
};

export default AdminMissions;