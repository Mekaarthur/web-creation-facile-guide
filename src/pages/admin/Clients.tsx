import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, User, Mail, Phone, Calendar, MapPin, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  total_bookings: number;
  total_spent: number;
  average_rating: number;
  status: 'active' | 'inactive' | 'suspended';
}

const AdminClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();

  // Mock data
  const mockClients: Client[] = [
    {
      id: '1',
      first_name: 'Marie',
      last_name: 'Dubois',
      email: 'marie.dubois@email.com',
      phone: '+33 6 12 34 56 78',
      created_at: '2024-01-15T10:00:00Z',
      total_bookings: 12,
      total_spent: 980.50,
      average_rating: 4.8,
      status: 'active'
    },
    {
      id: '2',
      first_name: 'Pierre',
      last_name: 'Martin',
      email: 'pierre.martin@email.com',
      phone: '+33 6 98 76 54 32',
      created_at: '2024-02-20T14:30:00Z',
      total_bookings: 8,
      total_spent: 650.00,
      average_rating: 4.5,
      status: 'active'
    },
    {
      id: '3',
      first_name: 'Sophie',
      last_name: 'Bernard',
      email: 'sophie.bernard@email.com',
      created_at: '2024-03-10T09:15:00Z',
      total_bookings: 3,
      total_spent: 210.00,
      average_rating: 4.2,
      status: 'inactive'
    }
  ];

  useEffect(() => {
  const loadClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-clients', {
        body: { action: 'list', searchTerm, limit: 100 }
      });

      if (error) throw error;

      if (data?.success) {
        setClients(data.clients.map((client: any) => ({
          ...client,
          total_bookings: client.stats?.total_bookings || 0,
          total_spent: client.stats?.total_spent || 0,
          average_rating: client.stats?.average_booking_value > 0 ? 4.5 : 0,
          status: 'active'
        })));
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

    loadClients();
  }, [toast]);

  const filteredClients = clients.filter(client =>
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Client['status']) => {
    const variants = {
      active: { variant: 'default' as const, label: 'Actif' },
      inactive: { variant: 'secondary' as const, label: 'Inactif' },
      suspended: { variant: 'destructive' as const, label: 'Suspendu' }
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return <div className="p-6">Chargement des clients...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clients</h1>
        <p className="text-muted-foreground">Gestion des clients de la plateforme</p>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={client.avatar_url} />
                  <AvatarFallback>
                    {getInitials(client.first_name, client.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {client.first_name} {client.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </div>
                {getStatusBadge(client.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Réservations:</span>
                  <span className="font-medium">{client.total_bookings}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total dépensé:</span>
                  <span className="font-medium">€{client.total_spent}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Note moyenne:</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{client.average_rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Membre depuis:</span>
                  <span className="font-medium">
                    {new Date(client.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setSelectedClient(client)}
                >
                  Voir détails
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Aucun client trouvé
            </p>
            <p className="text-sm text-muted-foreground">
              Essayez de modifier vos critères de recherche
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-2xl">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Détails du client - {selectedClient.first_name} {selectedClient.last_name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedClient.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {getInitials(selectedClient.first_name, selectedClient.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedClient.first_name} {selectedClient.last_name}
                    </h3>
                    {getStatusBadge(selectedClient.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedClient.email}</span>
                    </div>
                    {selectedClient.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedClient.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Inscrit le {new Date(selectedClient.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Total réservations:</span>
                      <span className="ml-2 font-medium">{selectedClient.total_bookings}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Total dépensé:</span>
                      <span className="ml-2 font-medium">€{selectedClient.total_spent}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Note moyenne:</span>
                      <div className="inline-flex items-center ml-2">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="font-medium">{selectedClient.average_rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClients;