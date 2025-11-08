import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Clock, User, Star, Search, Filter } from "lucide-react";

interface Mission {
  id: string;
  title: string;
  client_name: string;
  provider_name?: string;
  service_type: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  location: string;
  duration: number;
  price: number;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

const AdminMissions = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data
  const mockMissions: Mission[] = [
    {
      id: '1',
      title: 'Garde d\'enfants',
      client_name: 'Marie Dubois',
      provider_name: 'Sophie Martin',
      service_type: 'BikaKids',
      status: 'in_progress',
      scheduled_date: '2024-12-15T14:00:00Z',
      location: 'Paris 15ème',
      duration: 4,
      price: 120,
      priority: 'medium',
      created_at: '2024-12-10T10:00:00Z'
    },
    {
      id: '2',
      title: 'Ménage à domicile',
      client_name: 'Pierre Martin',
      service_type: 'BikaMaison',
      status: 'pending',
      scheduled_date: '2024-12-16T09:00:00Z',
      location: 'Neuilly-sur-Seine',
      duration: 3,
      price: 90,
      priority: 'high',
      created_at: '2024-12-10T15:30:00Z'
    },
    {
      id: '3',
      title: 'Accompagnement senior',
      client_name: 'Isabelle Leroy',
      provider_name: 'Jean Dupont',
      service_type: 'BikaSeniors',
      status: 'completed',
      scheduled_date: '2024-12-12T10:00:00Z',
      location: 'Versailles',
      duration: 2,
      price: 80,
      priority: 'low',
      created_at: '2024-12-08T11:20:00Z'
    }
  ];

  useEffect(() => {
    const loadMissions = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMissions(mockMissions);
      } finally {
        setLoading(false);
      }
    };
    loadMissions();
  }, []);

  const filteredMissions = missions.filter(mission => {
    const matchesSearch = mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.service_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || mission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Mission['status']) => {
    const variants = {
      pending: { variant: 'outline' as const, label: 'En attente' },
      assigned: { variant: 'secondary' as const, label: 'Assignée' },
      in_progress: { variant: 'default' as const, label: 'En cours' },
      completed: { variant: 'default' as const, label: 'Terminée' },
      cancelled: { variant: 'destructive' as const, label: 'Annulée' }
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: Mission['priority']) => {
    const variants = {
      low: { variant: 'outline' as const, label: 'Faible', color: 'text-green-600' },
      medium: { variant: 'secondary' as const, label: 'Moyenne', color: 'text-yellow-600' },
      high: { variant: 'destructive' as const, label: 'Haute', color: 'text-red-600' }
    };

    const config = variants[priority];
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return missions.length;
    return missions.filter(mission => mission.status === status).length;
  };

  if (loading) {
    return <div className="p-6">Chargement des missions...</div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Missions</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Gestion des missions et assignations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total missions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{missions.length}</div>
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
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount('in_progress')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount('completed')}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une mission..."
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
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMissions.map((mission) => (
              <Card key={mission.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold">{mission.title}</h3>
                      {getStatusBadge(mission.status)}
                      {getPriorityBadge(mission.priority)}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">Client: {mission.client_name}</span>
                        </div>
                        {mission.provider_name && (
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">Prestataire: {mission.provider_name}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{mission.location}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{new Date(mission.scheduled_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{mission.duration}h - €{mission.price}</span>
                        </div>
                        <div>
                          <span className="font-medium truncate block">{mission.service_type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Voir détails
                    </Button>
                    {mission.status === 'pending' && (
                      <Button size="sm" className="w-full sm:w-auto">
                        Assigner
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredMissions.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Aucune mission trouvée
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

export default AdminMissions;