import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Euro, Download, Search, CreditCard, TrendingUp, Clock, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const AdminPayments = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['admin-financial-transactions'],
    queryFn: async () => {
      // Récupérer les transactions financières avec les détails des bookings
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          bookings:booking_id (
            id,
            booking_date,
            start_time,
            end_time,
            status,
            services:service_id (name)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Également récupérer les paiements de la table payments si elle existe
  const { data: legacyPayments } = useQuery({
    queryKey: ['admin-legacy-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        // Table might not exist, ignore
        return [];
      }
      return data || [];
    }
  });

  const filteredTransactions = transactions?.filter(t => 
    t.booking_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.client_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.provider_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.service_category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      paid: { label: "Payé", variant: "default" },
      client_paid: { label: "Client payé", variant: "default" },
      pending: { label: "En attente", variant: "secondary" },
      provider_paid: { label: "Prestataire payé", variant: "default" },
      failed: { label: "Échoué", variant: "destructive" },
      refunded: { label: "Remboursé", variant: "outline" }
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Calculs des totaux
  const totalClientAmount = transactions?.reduce((sum, t) => sum + (t.client_price || 0), 0) || 0;
  const totalProviderAmount = transactions?.reduce((sum, t) => sum + (t.provider_payment || 0), 0) || 0;
  const totalCommission = transactions?.reduce((sum, t) => sum + (t.company_commission || 0), 0) || 0;
  const paidTransactions = transactions?.filter(t => t.payment_status === 'paid' || t.payment_status === 'client_paid') || [];
  const pendingTransactions = transactions?.filter(t => t.payment_status === 'pending') || [];

  const handleExportCSV = () => {
    if (!transactions?.length) {
      toast.error("Aucune donnée à exporter");
      return;
    }
    
    const headers = [
      'ID Transaction',
      'ID Réservation',
      'ID Client',
      'ID Prestataire',
      'Catégorie Service',
      'Prix Client (€)',
      'Paiement Prestataire (€)',
      'Commission (€)',
      'Statut Paiement',
      'Date Paiement Client',
      'Date Paiement Prestataire',
      'Date Création'
    ];
    
    const csvContent = [
      headers.join(';'),
      ...transactions.map(t => [
        t.id,
        t.booking_id,
        t.client_id,
        t.provider_id,
        t.service_category,
        t.client_price?.toFixed(2),
        t.provider_payment?.toFixed(2),
        t.company_commission?.toFixed(2),
        t.payment_status,
        t.client_paid_at ? format(new Date(t.client_paid_at), 'dd/MM/yyyy HH:mm') : '',
        t.provider_paid_at ? format(new Date(t.provider_paid_at), 'dd/MM/yyyy HH:mm') : '',
        format(new Date(t.created_at), 'dd/MM/yyyy HH:mm')
      ].join(';'))
    ].join('\n');
    
    // Ajouter BOM pour Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_financieres_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`${transactions.length} transactions exportées`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Euro className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Gestion des Paiements</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <p className="text-2xl font-bold">{totalClientAmount.toFixed(2)}€</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Euro className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prestataires</p>
              <p className="text-2xl font-bold">{totalProviderAmount.toFixed(2)}€</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commission</p>
              <p className="text-2xl font-bold">{totalCommission.toFixed(2)}€</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-2xl font-bold">{pendingTransactions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-4">
            <span>Transactions financières ({transactions?.length || 0})</span>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Prix Client</TableHead>
                    <TableHead className="text-right">Prestataire</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucune transaction trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions?.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.created_at), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium capitalize">
                            {transaction.service_category?.replace(/_/g, ' ') || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {transaction.client_price?.toFixed(2)}€
                        </TableCell>
                        <TableCell className="text-right font-medium text-blue-600">
                          {transaction.provider_payment?.toFixed(2)}€
                        </TableCell>
                        <TableCell className="text-right font-medium text-purple-600">
                          {transaction.company_commission?.toFixed(2)}€
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.payment_status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayments;
