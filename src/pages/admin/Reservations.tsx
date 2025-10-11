import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, Euro, Search, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ListPageSkeleton } from "@/components/ui/page-skeleton";
import { ExcelExportButton } from "@/components/admin/ExcelExportButton";

interface Reservation {
  id: string;
  client_name: string;
  provider_name?: string;
  service_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  total_price: number;
  address: string;
  created_at: string;
}

const AdminReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  // Mock data
  const mockReservations: Reservation[] = [
    {
      id: '1',
      client_name: 'Marie Dubois',
      provider_name: 'Sophie Martin',
      service_name: 'Garde d\'enfants à domicile',
      booking_date: '2024-12-15',
      start_time: '14:00',
      end_time: '18:00',
      status: 'confirmed',
      total_price: 120,
      address: '123 Rue de la Paix, Paris 15ème',
      created_at: '2024-12-10T10:00:00Z'
    },
    {
      id: '2',
      client_name: 'Pierre Martin',
      service_name: 'Ménage complet',
      booking_date: '2024-12-16',
      start_time: '09:00',
      end_time: '12:00',
      status: 'pending',
      total_price: 90,
      address: '456 Avenue des Champs, Neuilly-sur-Seine',
      created_at: '2024-12-10T15:30:00Z'
    },
    {
      id: '3',
      client_name: 'Isabelle Leroy',
      provider_name: 'Jean Dupont',
      service_name: 'Accompagnement médical',
      booking_date: '2024-12-12',
      start_time: '10:00',
      end_time: '12:00',
      status: 'completed',
      total_price: 80,
      address: '789 Boulevard Royal, Versailles',
      created_at: '2024-12-08T11:20:00Z'
    }
  ];

  useEffect(() => {
    const loadReservations = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('admin-reservations', {
          body: { action: 'list', status: statusFilter, limit: 100 }
        });

        if (error) throw error;

        if (data?.success) {
          setReservations(data.bookings);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des réservations:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les réservations",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadReservations();
  }, [statusFilter]);

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reservation.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (reservation.provider_name && reservation.provider_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Reservation['status']) => {
    const variants = {
      pending: { variant: 'outline' as const, label: 'En attente' },
      confirmed: { variant: 'secondary' as const, label: 'Confirmée' },
      in_progress: { variant: 'default' as const, label: 'En cours' },
      completed: { variant: 'default' as const, label: 'Terminée' },
      cancelled: { variant: 'destructive' as const, label: 'Annulée' }
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return reservations.length;
    return reservations.filter(reservation => reservation.status === status).length;
  };

  if (loading) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Réservations</h1>
          <p className="text-muted-foreground">Gestion des réservations de services</p>
        </div>
        <ExcelExportButton
          data={filteredReservations}
          filename="reservations-bikawo"
          sheetName="Réservations"
          title="Réservations Bikawo"
          subtitle={`Généré le ${new Date().toLocaleDateString('fr-FR')}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount('pending')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount('confirmed')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{reservations.reduce((sum, r) => sum + r.total_price, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <div className="flex space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une réservation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReservations.map((reservation) => (
              <Card key={reservation.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{reservation.service_name}</h3>
                      {getStatusBadge(reservation.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <div>
                          <strong>Client:</strong> {reservation.client_name}
                        </div>
                        {reservation.provider_name && (
                          <div>
                            <strong>Prestataire:</strong> {reservation.provider_name}
                          </div>
                        )}
                        <div>
                          <strong>Adresse:</strong> {reservation.address}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(reservation.booking_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{reservation.start_time} - {reservation.end_time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Euro className="h-4 w-4" />
                          <span className="font-medium">€{reservation.total_price}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Détails
                    </Button>
                    {reservation.status === 'pending' && (
                      <Button size="sm">
                        Confirmer
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredReservations.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Aucune réservation trouvée
              </p>
              <p className="text-sm text-muted-foreground">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReservations;