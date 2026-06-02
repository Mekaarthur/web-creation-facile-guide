import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  bookings?: { booking_date: string; services?: { name: string } };
  profiles?: { first_name: string; last_name: string };
  providers?: { business_name: string; profiles?: { first_name: string; last_name: string } };
}

function getDateFilter(period: string): string | null {
  const now = new Date();
  if (period === 'today') return now.toISOString().split('T')[0];
  if (period === 'week')  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (period === 'month') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

const FinancialReporting = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const { data: transactions = [], isLoading: loading } = useQuery<FinancialTransaction[]>({
    queryKey: ['financial-reporting', selectedPeriod],
    queryFn: async () => {
      let query = supabase.from('financial_transactions').select('*').order('created_at', { ascending: false });
      const cutoff = getDateFilter(selectedPeriod);
      if (cutoff) query = query.gte('created_at', cutoff);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any;
    },
  });

  const stats = useMemo(() => ({
    totalRevenue:          transactions.reduce((s, t) => s + t.client_price, 0),
    totalCommissions:      transactions.reduce((s, t) => s + t.company_commission, 0),
    totalProviderPayments: transactions.reduce((s, t) => s + t.provider_payment, 0),
    pendingPayments:       transactions.filter(t => t.payment_status === 'pending' || t.payment_status === 'client_paid').reduce((s, t) => s + t.provider_payment, 0),
    transactionCount:      transactions.length,
  }), [transactions]);

  const handlePayProvider = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({ payment_status: 'provider_paid', provider_paid_at: new Date().toISOString() })
        .eq('id', transactionId);
      if (error) throw error;
      toast({ title: "Succès", description: "Paiement prestataire marqué comme effectué" });
      qc.invalidateQueries({ queryKey: ['financial-reporting'] });
    } catch {
      toast({ title: "Erreur", description: "Impossible de marquer le paiement", variant: "destructive" });
    }
  };

  const exportToCSV = () => {
    const csvHeaders = ['Date','Service','Client','Prestataire','Prix Client','Paiement Prestataire','Commission','Statut Paiement'];
    const csvData = transactions.map(t => [
      format(new Date(t.created_at), 'dd/MM/yyyy', { locale: fr }),
      t.service_category,
      `${t.profiles?.first_name || ''} ${t.profiles?.last_name || ''}`.trim(),
      t.providers?.business_name || `${t.providers?.profiles?.first_name || ''} ${t.providers?.profiles?.last_name || ''}`.trim(),
      t.client_price, t.provider_payment, t.company_commission, t.payment_status,
    ]);
    const csvContent = [csvHeaders, ...csvData].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    if (status === 'pending')       return <Badge variant="secondary">En attente</Badge>;
    if (status === 'client_paid')   return <Badge variant="default">Client payé</Badge>;
    if (status === 'provider_paid') return <Badge variant="outline">Prestataire payé</Badge>;
    if (status === 'completed')     return <Badge>Terminé</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  if (loading) return <div className="p-6">Chargement des données financières...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reporting Financier</h1>
          <p className="text-muted-foreground">Suivi des revenus, commissions et paiements prestataires</p>
        </div>
        <Button variant="outline" onClick={exportToCSV}><Download className="w-4 h-4 mr-2" />Exporter CSV</Button>
      </div>

      <div className="flex gap-2">
        {[
          { value: 'all',   label: 'Tout' },
          { value: 'today', label: "Aujourd'hui" },
          { value: 'week',  label: '7 derniers jours' },
          { value: 'month', label: '30 derniers jours' },
        ].map(p => (
          <Button key={p.value} variant={selectedPeriod === p.value ? 'default' : 'outline'} onClick={() => setSelectedPeriod(p.value)}>
            {p.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { icon: TrendingUp,  color: 'text-primary',   label: "Chiffre d'affaires",       value: `${stats.totalRevenue.toFixed(2)}€` },
          { icon: DollarSign,  color: 'text-green-600', label: 'Commissions',               value: `${stats.totalCommissions.toFixed(2)}€` },
          { icon: Users,       color: 'text-blue-600',  label: 'Paiements prestataires',    value: `${stats.totalProviderPayments.toFixed(2)}€` },
          { icon: Eye,         color: 'text-orange-600',label: 'En attente',                value: `${stats.pendingPayments.toFixed(2)}€` },
          { icon: TrendingUp,  color: '',               label: 'Transactions',              value: stats.transactionCount },
        ].map(({ icon: Icon, color, label, value }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${color}`} /><div className="text-sm font-medium text-muted-foreground">{label}</div></div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions Récentes</CardTitle>
          <CardDescription>Liste détaillée des transactions financières</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Aucune transaction trouvée pour cette période</div>
            ) : (
              transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">{t.service_category}</div>
                      <div className="text-sm text-muted-foreground">{format(new Date(t.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{t.profiles?.first_name} {t.profiles?.last_name}</div>
                      <div className="text-sm text-muted-foreground">Client</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {t.providers?.business_name || `${t.providers?.profiles?.first_name || ''} ${t.providers?.profiles?.last_name || ''}`}
                      </div>
                      <div className="text-sm text-muted-foreground">Prestataire</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{t.client_price}€</div>
                      <div className="text-sm text-muted-foreground">{t.provider_payment}€ + {t.company_commission}€</div>
                    </div>
                    {getStatusBadge(t.payment_status)}
                    {t.payment_status === 'client_paid' && (
                      <Button size="sm" onClick={() => handlePayProvider(t.id)}>Marquer payé</Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReporting;
