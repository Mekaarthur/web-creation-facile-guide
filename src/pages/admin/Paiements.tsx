import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, CreditCard, DollarSign, TrendingUp, AlertCircle, Download, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_date: string;
  client_name: string;
  provider_name: string;
  service_type: string;
  transaction_id: string;
}

export default function AdminPaiements() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const loadPayments = async () => {
    try {
      // Simuler des données de paiement pour la démo
      const mockPayments: Payment[] = [
        {
          id: '1',
          amount: 85.50,
          status: 'completed',
          payment_date: new Date().toISOString(),
          client_name: 'Marie Dupont',
          provider_name: 'Jean Martin',
          service_type: 'Aide ménagère',
          transaction_id: 'txn_1234567890'
        },
        {
          id: '2',
          amount: 120.00,
          status: 'pending',
          payment_date: new Date(Date.now() - 3600000).toISOString(),
          client_name: 'Sophie Laurent',
          provider_name: 'Paul Dubois',
          service_type: 'Garde d\'enfants',
          transaction_id: 'txn_1234567891'
        },
        {
          id: '3',
          amount: 65.00,
          status: 'failed',
          payment_date: new Date(Date.now() - 7200000).toISOString(),
          client_name: 'Pierre Moreau',
          provider_name: 'Claire Petit',
          service_type: 'Aide aux seniors',
          transaction_id: 'txn_1234567892'
        },
        {
          id: '4',
          amount: 95.75,
          status: 'refunded',
          payment_date: new Date(Date.now() - 86400000).toISOString(),
          client_name: 'Julie Roux',
          provider_name: 'Marc Blanc',
          service_type: 'Aide administrative',
          transaction_id: 'txn_1234567893'
        },
      ];

      setPayments(mockPayments);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paiements",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.provider_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Complété</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>;
      case 'refunded':
        return <Badge variant="outline">Remboursé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statusCounts = {
    all: payments.length,
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length,
    refunded: payments.filter(p => p.status === 'refunded').length,
  };

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

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
        <h1 className="text-3xl font-bold">Gestion des paiements</h1>
        <p className="text-muted-foreground">Suivi des transactions et revenus de la plateforme</p>
      </div>

      {/* Statistiques financières */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Revenus totaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+12% ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-orange-600" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">€{pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{statusCounts.pending} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Échecs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.failed}</div>
            <p className="text-xs text-muted-foreground">À résoudre</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Croissance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">+24%</div>
            <p className="text-xs text-muted-foreground">vs mois dernier</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recherche et filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, ID transaction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtres avancés
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Onglets par statut */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            Tous ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Complétés ({statusCounts.completed})
          </TabsTrigger>
          <TabsTrigger value="pending">
            En attente ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Échoués ({statusCounts.failed})
          </TabsTrigger>
          <TabsTrigger value="refunded">
            Remboursés ({statusCounts.refunded})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4">
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun paiement trouvé</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-lg">€{payment.amount.toFixed(2)}</span>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Client:</span> {payment.client_name}
                          </div>
                          <div>
                            <span className="font-medium">Prestataire:</span> {payment.provider_name}
                          </div>
                          <div>
                            <span className="font-medium">Service:</span> {payment.service_type}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>ID: {payment.transaction_id}</span>
                          <span>Date: {new Date(payment.payment_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          Voir détails
                        </Button>
                        {payment.status === 'failed' && (
                          <Button variant="default" size="sm">
                            Relancer
                          </Button>
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