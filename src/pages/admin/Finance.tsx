import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Receipt, AlertCircle, Download, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FinanceStats {
  revenue: number;
  commissions: number;
  pendingPayments: number;
  refunds: number;
  providerPayments: number;
  trends: {
    revenue: string;
    commissions: string;
    pendingPayments: string;
    refunds: string;
  };
}

interface Transaction {
  id: string;
  type: string;
  client: string;
  amount: string;
  service: string;
  status: string;
  date: string;
}

interface ProviderPayment {
  id: string;
  provider: string;
  amount: string;
  missions: number;
  dueDate: string;
  invoice_id: string;
}

const AdminFinance = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [pendingPayments, setPendingPayments] = useState<ProviderPayment[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      // Fetch statistics
      const statsResponse = await fetch(`https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/admin-payments?action=finance_stats&timeRange=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch recent transactions
      const transactionsResponse = await fetch(`https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/admin-payments?action=recent_transactions&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch provider payments
      const providerPaymentsResponse = await fetch(`https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/admin-payments?action=provider_payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setFinanceStats(stats);
      }

      if (transactionsResponse.ok) {
        const { transactions } = await transactionsResponse.json();
        setRecentTransactions(transactions);
      }

      if (providerPaymentsResponse.ok) {
        const { payments, total } = await providerPaymentsResponse.json();
        setPendingPayments(payments);
        setTotalPending(total);
      }

    } catch (error) {
      console.error('Error fetching finance data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données financières",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [selectedPeriod]);

  const handleExportData = async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await fetch(`https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/admin-payments?action=export&format=csv`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rapport_financier_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Export terminé",
          description: "Le rapport financier a été téléchargé"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive"
      });
    }
  };

  const handleProcessPayment = async (invoiceId: string, provider: string) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await fetch(`https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/admin-payments?action=process_provider_payment&invoiceId=${invoiceId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: `Paiement traité pour ${provider}` })
      });

      if (response.ok) {
        toast({
          title: "Paiement traité",
          description: `Le paiement pour ${provider} a été traité avec succès`
        });
        fetchFinanceData(); // Refresh data
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter le paiement",
        variant: "destructive"
      });
    }
  };

  const handleProcessAllPayments = async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await fetch(`https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/admin-payments?action=bulk_process_providers`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: "Traitement en lot des paiements prestataires" })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Paiements traités",
          description: `${result.processed} paiements traités pour un total de €${result.total_amount.toFixed(2)}`
        });
        fetchFinanceData(); // Refresh data
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter les paiements en lot",
        variant: "destructive"
      });
    }
  };

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

  const financeStatsDisplay = [
    { 
      label: "Chiffre d'affaires", 
      value: `€${financeStats?.revenue?.toFixed(2) || '0.00'}`, 
      change: financeStats?.trends?.revenue || "+0%", 
      trend: "up", 
      icon: DollarSign 
    },
    { 
      label: "Commissions", 
      value: `€${financeStats?.commissions?.toFixed(2) || '0.00'}`, 
      change: financeStats?.trends?.commissions || "+0%", 
      trend: "up", 
      icon: CreditCard 
    },
    { 
      label: "Paiements en attente", 
      value: `€${financeStats?.pendingPayments?.toFixed(2) || '0.00'}`, 
      change: financeStats?.trends?.pendingPayments || "+0%", 
      trend: financeStats?.trends?.pendingPayments?.includes('-') ? "down" : "up", 
      icon: Receipt 
    },
    { 
      label: "Remboursements", 
      value: `€${financeStats?.refunds?.toFixed(2) || '0.00'}`, 
      change: financeStats?.trends?.refunds || "+0%", 
      trend: "up", 
      icon: AlertCircle 
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finance</h1>
          <p className="text-muted-foreground">Vue d'ensemble financière et comptabilité</p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats financières */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {financeStatsDisplay.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-xs ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <stat.icon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payments">Paiements en attente</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className="w-5 h-5 mr-2" />
                Transactions récentes
              </CardTitle>
              <CardDescription>
                Historique des dernières transactions financières
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-500' : 
                        transaction.status === 'pending' ? 'bg-orange-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium">{transaction.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.client} - {transaction.service}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${transaction.amount.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Paiements prestataires en attente
              </CardTitle>
              <CardDescription>
                Rémunérations à verser aux prestataires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{payment.provider}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.missions} missions - Échéance: {payment.dueDate}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium text-green-600">{payment.amount}</p>
                        <Badge variant="outline">En attente</Badge>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleProcessPayment(payment.id, payment.provider)}
                      >
                        Payer
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total à payer:</span>
                    <span className="text-lg font-bold text-green-600">€{totalPending.toFixed(2)}</span>
                  </div>
                  <Button className="w-full mt-4" onClick={handleProcessAllPayments}>
                    Traiter tous les paiements
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Rapports financiers
              </CardTitle>
              <CardDescription>
                Générer et consulter les rapports financiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Receipt className="w-6 h-6 mb-2" />
                  Rapport mensuel
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="w-6 h-6 mb-2" />
                  Analyse des tendances
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <DollarSign className="w-6 h-6 mb-2" />
                  Bilan comptable
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Download className="w-6 h-6 mb-2" />
                  Export CSV/PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFinance;