import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, Eye, TrendingUp, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FinancialTransaction {
  id: string;
  booking_id: string;
  client_id: string;
  provider_id: string;
  service_category: string;
  client_price: number;
  provider_payment: number;
  company_commission: number;
  payment_status: string;
  client_paid_at: string | null;
  provider_paid_at: string | null;
  created_at: string;
  bookings?: {
    booking_date: string;
    services?: { name: string };
  };
  profiles?: { first_name: string; last_name: string };
  providers?: {
    business_name: string;
    profiles?: { first_name: string; last_name: string };
  };
}

interface FinancialStats {
  totalRevenue: number;
  totalCommissions: number;
  totalProviderPayments: number;
  pendingPayments: number;
  transactionCount: number;
}

const FinancialReporting = () => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalCommissions: 0,
    totalProviderPayments: 0,
    pendingPayments: 0,
    transactionCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchFinancialData();
  }, [selectedPeriod]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Build date filter
      let dateFilter = '';
      const now = new Date();
      switch (selectedPeriod) {
        case 'today':
          dateFilter = `created_at.gte.${now.toISOString().split('T')[0]}`;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = `created_at.gte.${weekAgo.toISOString()}`;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = `created_at.gte.${monthAgo.toISOString()}`;
          break;
      }

      // Fetch transactions
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          bookings (
            booking_date,
            services (name)
          ),
          profiles!financial_transactions_client_id_fkey (
            first_name,
            last_name
          ),
          providers!financial_transactions_provider_id_fkey (
            business_name,
            profiles (first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (dateFilter) {
        query = query.filter('created_at', 'gte', dateFilter.split('.')[2]);
      }

      const { data: transactionsData, error } = await query;

      if (error) throw error;

      setTransactions((transactionsData || []) as any);

      // Calculate stats
      const totalRevenue = (transactionsData || []).reduce((sum, t) => sum + t.client_price, 0);
      const totalCommissions = (transactionsData || []).reduce((sum, t) => sum + t.company_commission, 0);
      const totalProviderPayments = (transactionsData || []).reduce((sum, t) => sum + t.provider_payment, 0);
      const pendingPayments = (transactionsData || [])
        .filter(t => t.payment_status === 'pending' || t.payment_status === 'client_paid')
        .reduce((sum, t) => sum + t.provider_payment, 0);

      setStats({
        totalRevenue,
        totalCommissions,
        totalProviderPayments,
        pendingPayments,
        transactionCount: transactionsData?.length || 0
      });

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données financières",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayProvider = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({
          payment_status: 'provider_paid',
          provider_paid_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Paiement prestataire marqué comme effectué",
      });

      fetchFinancialData();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer le paiement",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const csvHeaders = [
      'Date',
      'Service',
      'Client',
      'Prestataire',
      'Prix Client',
      'Paiement Prestataire',
      'Commission',
      'Statut Paiement'
    ];

    const csvData = transactions.map(t => [
      format(new Date(t.created_at), 'dd/MM/yyyy', { locale: fr }),
      t.service_category,
      `${t.profiles?.first_name || ''} ${t.profiles?.last_name || ''}`.trim(),
      t.providers?.business_name || `${t.providers?.profiles?.first_name || ''} ${t.providers?.profiles?.last_name || ''}`.trim(),
      t.client_price,
      t.provider_payment,
      t.company_commission,
      t.payment_status
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'client_paid':
        return <Badge variant="default">Client payé</Badge>;
      case 'provider_paid':
        return <Badge variant="outline">Prestataire payé</Badge>;
      case 'completed':
        return <Badge>Terminé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-6">Chargement des données financières...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reporting Financier</h1>
          <p className="text-muted-foreground">
            Suivi des revenus, commissions et paiements prestataires
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'Tout' },
          { value: 'today', label: 'Aujourd\'hui' },
          { value: 'week', label: '7 derniers jours' },
          { value: 'month', label: '30 derniers jours' }
        ].map((period) => (
          <Button
            key={period.value}
            variant={selectedPeriod === period.value ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod(period.value)}
          >
            {period.label}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-muted-foreground">Chiffre d'affaires</div>
            </div>
            <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)}€</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <div className="text-sm font-medium text-muted-foreground">Commissions</div>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.totalCommissions.toFixed(2)}€</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <div className="text-sm font-medium text-muted-foreground">Paiements prestataires</div>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalProviderPayments.toFixed(2)}€</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-orange-600" />
              <div className="text-sm font-medium text-muted-foreground">En attente</div>
            </div>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingPayments.toFixed(2)}€</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <div className="text-sm font-medium text-muted-foreground">Transactions</div>
            </div>
            <div className="text-2xl font-bold">{stats.transactionCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions Récentes</CardTitle>
          <CardDescription>
            Liste détaillée des transactions financières
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">{transaction.service_category}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {transaction.profiles?.first_name} {transaction.profiles?.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">Client</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {transaction.providers?.business_name || 
                       `${transaction.providers?.profiles?.first_name || ''} ${transaction.providers?.profiles?.last_name || ''}`}
                    </div>
                    <div className="text-sm text-muted-foreground">Prestataire</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold">{transaction.client_price}€</div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.provider_payment}€ + {transaction.company_commission}€
                    </div>
                  </div>
                  
                  {getStatusBadge(transaction.payment_status)}
                  
                  {(transaction.payment_status === 'client_paid') && (
                    <Button
                      size="sm"
                      onClick={() => handlePayProvider(transaction.id)}
                    >
                      Marquer payé
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {transactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune transaction trouvée pour cette période
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReporting;