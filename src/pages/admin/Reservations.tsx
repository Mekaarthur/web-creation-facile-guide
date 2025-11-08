import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Clock, User, Search, DollarSign, TrendingUp, Eye, PieChart, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ReservationDetailsModal } from "@/components/admin/ReservationDetailsModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Reservation {
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

const AdminReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [universeFilter, setUniverseFilter] = useState("all");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    convertedToMission: 0,
    revenue: 0,
    byStatus: [] as { name: string; value: number; color: string }[]
  });

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
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

      // Charger les profils clients et prestataires
      const reservationsWithDetails = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          // Profil client
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

      setReservations(reservationsWithDetails as Reservation[]);

      // Calculer les stats
      const totalRevenue = reservationsWithDetails
        .filter(r => r.status !== 'cancelled')
        .reduce((sum, r) => sum + (Number(r.total_price) || 0), 0);

      const pending = reservationsWithDetails.filter(r => r.status === 'pending').length;
      const confirmed = reservationsWithDetails.filter(r => r.status === 'confirmed').length;
      const cancelled = reservationsWithDetails.filter(r => r.status === 'cancelled').length;
      const convertedToMission = reservationsWithDetails.filter(r => r.status === 'in_progress' || r.status === 'completed').length;

      // Stats par statut pour le graphique
      const statusColors: Record<string, string> = {
        pending: 'hsl(var(--chart-1))',
        confirmed: 'hsl(var(--chart-3))',
        assigned: 'hsl(var(--chart-2))',
        in_progress: 'hsl(var(--chart-4))',
        completed: 'hsl(var(--chart-5))',
        cancelled: 'hsl(var(--destructive))'
      };

      const statusLabels: Record<string, string> = {
        pending: 'En attente',
        confirmed: 'Confirmée',
        assigned: 'Assignée',
        in_progress: 'En cours',
        completed: 'Terminée',
        cancelled: 'Annulée'
      };

      const statusCounts = reservationsWithDetails.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
        color: statusColors[status] || 'hsl(var(--muted))'
      }));

      setStats({
        total: reservationsWithDetails.length,
        pending,
        confirmed,
        cancelled,
        convertedToMission,
        revenue: totalRevenue,
        byStatus
      });
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      (reservation.services?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reservation.client_profile?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reservation.client_profile?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reservation.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter;
    const matchesUniverse = universeFilter === "all" || reservation.services?.category === universeFilter;
    
    return matchesSearch && matchesStatus && matchesUniverse;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string }> = {
      pending: { variant: 'outline', label: 'En attente' },
      confirmed: { variant: 'default', label: 'Confirmée' },
      assigned: { variant: 'secondary', label: 'Assignée' },
      in_progress: { variant: 'default', label: 'En cours' },
      completed: { variant: 'default', label: 'Terminée' },
      cancelled: { variant: 'destructive', label: 'Annulée' }
    };

    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diff.toFixed(1);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
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
        <h1 className="text-2xl sm:text-3xl font-bold">Réservations</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Gestion complète des réservations de services</p>
      </div>

      {/* Statistics Cards & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total du mois</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmed}</div>
              <p className="text-xs text-muted-foreground">
                Validées par admin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annulées</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cancelled}</div>
              <p className="text-xs text-muted-foreground">
                Taux: {stats.total > 0 ? ((stats.cancelled / stats.total) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Converties</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.convertedToMission}</div>
              <p className="text-xs text-muted-foreground">
                En missions
              </p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.revenue.toFixed(2)}€</div>
              <p className="text-xs text-muted-foreground">
                Réservations payées
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Graphique répartition par statut */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Statuts des réservations
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

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et recherche</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par client, service, adresse..."
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
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="assigned">Assignée</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
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

      {/* Liste des réservations */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des réservations ({filteredReservations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Réservation</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Univers / Service</TableHead>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Prestataire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">
                        Aucune réservation trouvée
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Essayez de modifier vos critères de recherche
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-mono text-xs">
                        {reservation.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {reservation.client_profile?.first_name} {reservation.client_profile?.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {reservation.client_profile?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{reservation.services?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {reservation.services?.category}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{new Date(reservation.booking_date).toLocaleDateString('fr-FR')}</div>
                          <div className="text-xs text-muted-foreground">
                            {reservation.start_time} - {reservation.end_time}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {calculateDuration(reservation.start_time, reservation.end_time)}h
                      </TableCell>
                      <TableCell>
                        {reservation.provider_profile ? (
                          <div className="font-medium">
                            {reservation.provider_profile.first_name} {reservation.provider_profile.last_name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Non assigné</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(reservation.status)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {Number(reservation.total_price).toFixed(2)}€
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReservation(reservation)}
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

      {/* Modal détails */}
      {selectedReservation && (
        <ReservationDetailsModal
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onUpdate={loadReservations}
        />
      )}
    </div>
  );
};

export default AdminReservations;
