import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Users, CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const FinanceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [financialStats, setFinancialStats] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    pendingPayments: 0,
    completedPayments: 0,
    providerPayments: 0
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [providerPayments, setProviderPayments] = useState<any[]>([]);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      // Charger les transactions financières
      const { data: transactionsData } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          booking:bookings(booking_date, start_time),
          client:profiles!financial_transactions_client_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Charger les paiements prestataires
      const { data: providerInvoices } = await supabase
        .from('provider_invoices')
        .select(`
          *,
          provider:providers(business_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // Calculer les stats
      const totalRevenue = transactionsData?.reduce((sum, t) => sum + (t.client_price || 0), 0) || 0;
      const totalCommission = transactionsData?.reduce((sum, t) => sum + (t.company_commission || 0), 0) || 0;
      const pendingPayments = transactionsData?.filter(t => t.payment_status === 'pending').length || 0;
      const completedPayments = transactionsData?.filter(t => t.payment_status === 'completed').length || 0;
      const providerPayments = providerInvoices?.reduce((sum, i) => sum + (i.amount_brut || 0), 0) || 0;

      setFinancialStats({
        totalRevenue,
        totalCommission,
        pendingPayments,
        completedPayments,
        providerPayments
      });

      setTransactions(transactionsData || []);
      setProviderPayments(providerInvoices || []);

    } catch (error: any) {
      console.error('Erreur chargement finances:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const exportFinancialReport = () => {
    const csvData = transactions.map(t => ({
      Date: new Date(t.created_at).toLocaleDateString('fr-FR'),
      Client: `${t.client?.first_name} ${t.client?.last_name}`,
      'Prix Client': t.client_price,
      'Paiement Prestataire': t.provider_payment,
      Commission: t.company_commission,
      Statut: t.payment_status,
      Catégorie: t.service_category
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-financier-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Rapport exporté');
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard Financier</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble des transactions et commissions
          </p>
        </div>
        <Button onClick={exportFinancialReport}>
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* KPIs Financiers */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Revenu Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialStats.totalRevenue.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground mt-1">Montant clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {financialStats.totalCommission.toFixed(2)}€
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((financialStats.totalCommission / financialStats.totalRevenue) * 100).toFixed(1)}% du CA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Paiements En Attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{financialStats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">Transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Paiements Complétés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{financialStats.completedPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">Transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Paiements Prestataires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialStats.providerPayments.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground mt-1">À verser</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">
            Transactions ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="providers">
            Paiements Prestataires ({providerPayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dernières Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {transaction.client?.first_name} {transaction.client?.last_name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {transaction.service_category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-bold">{transaction.client_price}€</div>
                      <div className="text-sm text-green-600">
                        Commission: {transaction.company_commission}€
                      </div>
                      <Badge variant={transaction.payment_status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.payment_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paiements Prestataires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {providerPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{payment.provider?.business_name}</div>
                      <p className="text-sm text-muted-foreground">
                        Facture {payment.invoice_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Émise: {new Date(payment.issued_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-bold">{payment.amount_brut}€</div>
                      <div className="text-sm text-muted-foreground">
                        Net: {payment.amount_net}€
                      </div>
                      <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
