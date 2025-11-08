import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, DollarSign, TrendingUp, AlertCircle, Download, RefreshCw, ExternalLink, Euro, CreditCard, ArrowUpRight, PieChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PaymentDetailsModal } from '@/components/admin/PaymentDetailsModal';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Transaction {
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
    start_time: string;
    end_time: string;
    address: string;
    services?: {
      name: string;
      category: string;
    } | null;
  };
  client_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  provider_profile?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface ProviderPayout {
  provider_id: string;
  provider_name: string;
  missions_count: number;
  total_amount: number;
  last_payout_date: string | null;
  pending_missions: number;
}

interface Statistics {
  total_encaisse: number;
  commission_bikawo: number;
  verse_prestataires: number;
  paiements_attente: number;
  litiges_count: number;
  weekly_revenue: any[];
}

export default function AdminPaiements() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [providerPayouts, setProviderPayouts] = useState<ProviderPayout[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [universeFilter, setUniverseFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('month');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [statusFilter, universeFilter, periodFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTransactions(),
        loadProviderPayouts(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    let query = supabase
      .from('financial_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('payment_status', statusFilter);
    }

    if (universeFilter !== 'all') {
      query = query.eq('service_category', universeFilter);
    }

    // Filtre période
    const now = new Date();
    if (periodFilter === 'day') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      query = query.gte('created_at', startOfDay.toISOString());
    } else if (periodFilter === 'week') {
      const startOfWeek = new Date(now.setDate(now.getDate() - 7));
      query = query.gte('created_at', startOfWeek.toISOString());
    } else if (periodFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      query = query.gte('created_at', startOfMonth.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Charger les réservations, profils clients et prestataires
    const transactionsWithDetails = await Promise.all(
      (data || []).map(async (transaction) => {
        const [booking, clientProfile, providerData] = await Promise.all([
          supabase
            .from('bookings')
            .select('booking_date, start_time, end_time, address, service_id')
            .eq('id', transaction.booking_id)
            .single(),
          supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('user_id', transaction.client_id)
            .single(),
          supabase
            .from('providers')
            .select('user_id')
            .eq('id', transaction.provider_id)
            .single()
        ]);

        let services = null;
        if (booking.data?.service_id) {
          const { data: serviceData } = await supabase
            .from('services')
            .select('name, category')
            .eq('id', booking.data.service_id)
            .single();
          services = serviceData;
        }

        let providerProfile = null;
        if (providerData.data?.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', providerData.data.user_id)
            .single();
          providerProfile = profileData;
        }

        return {
          ...transaction,
          bookings: booking.data ? {
            booking_date: booking.data.booking_date,
            start_time: booking.data.start_time,
            end_time: booking.data.end_time,
            address: booking.data.address,
            services
          } : undefined,
          client_profile: clientProfile.data,
          provider_profile: providerProfile
        };
      })
    );

    setTransactions(transactionsWithDetails as Transaction[]);
  };

  const loadProviderPayouts = async () => {
    const { data: providers, error } = await supabase
      .from('providers')
      .select('id, user_id')
      .eq('is_verified', true);

    if (error) throw error;

    const payouts: ProviderPayout[] = await Promise.all(
      (providers || []).map(async (provider) => {
        const [transactionsData, profileData] = await Promise.all([
          supabase
            .from('financial_transactions')
            .select('provider_payment, payment_status, provider_paid_at')
            .eq('provider_id', provider.id),
          supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', provider.user_id)
            .single()
        ]);

        const transactions = transactionsData.data || [];
        const validatedTransactions = transactions.filter(t => t.payment_status === 'paid');
        const pendingTransactions = transactions.filter(t => t.payment_status === 'pending' || t.payment_status === 'processing');
        
        const totalAmount = validatedTransactions
          .filter(t => !t.provider_paid_at)
          .reduce((sum, t) => sum + Number(t.provider_payment), 0);

        const lastPayout = validatedTransactions
          .filter(t => t.provider_paid_at)
          .sort((a, b) => new Date(b.provider_paid_at!).getTime() - new Date(a.provider_paid_at!).getTime())[0];

        return {
          provider_id: provider.id,
          provider_name: profileData.data ? `${profileData.data.first_name} ${profileData.data.last_name}` : 'N/A',
          missions_count: validatedTransactions.filter(t => !t.provider_paid_at).length,
          total_amount: totalAmount,
          last_payout_date: lastPayout?.provider_paid_at || null,
          pending_missions: pendingTransactions.length
        };
      })
    );

    setProviderPayouts(payouts.filter(p => p.total_amount > 0 || p.pending_missions > 0));
  };

  const loadStatistics = async () => {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*');

    if (error) throw error;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTransactions = (data || []).filter(t => new Date(t.created_at) >= startOfMonth);
    const paidTransactions = monthTransactions.filter(t => t.payment_status === 'paid');

    const total_encaisse = paidTransactions.reduce((sum, t) => sum + Number(t.client_price), 0);
    const commission_bikawo = paidTransactions.reduce((sum, t) => sum + Number(t.company_commission), 0);
    const verse_prestataires = paidTransactions.filter(t => t.provider_paid_at).reduce((sum, t) => sum + Number(t.provider_payment), 0);
    const paiements_attente = monthTransactions.filter(t => t.payment_status === 'pending').length;

    // Calcul revenus hebdomadaires pour le graphique
    const weeklyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTransactions = paidTransactions.filter(t => {
        const tDate = new Date(t.created_at);
        return tDate.toDateString() === date.toDateString();
      });
      const revenue = dayTransactions.reduce((sum, t) => sum + Number(t.client_price), 0);
      weeklyRevenue.push({
        name: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        revenue: revenue
      });
    }

    setStatistics({
      total_encaisse,
      commission_bikawo,
      verse_prestataires,
      paiements_attente,
      litiges_count: 0,
      weekly_revenue: weeklyRevenue
    });
  };

  const handleProviderPayout = async (providerId: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({ provider_paid_at: new Date().toISOString() })
        .eq('provider_id', providerId)
        .eq('payment_status', 'paid')
        .is('provider_paid_at', null);

      if (error) throw error;

      toast({
        title: "Versement effectué",
        description: "Le prestataire a été payé avec succès",
      });

      loadData();
    } catch (error) {
      console.error('Erreur versement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le versement",
        variant: "destructive"
      });
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const clientName = transaction.client_profile 
      ? `${transaction.client_profile.first_name} ${transaction.client_profile.last_name}`
      : '';
    const providerName = transaction.provider_profile
      ? `${transaction.provider_profile.first_name} ${transaction.provider_profile.last_name}`
      : '';
    const serviceName = transaction.bookings?.services?.name || '';
    
    return (
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      'paid': <Badge className="bg-green-100 text-green-800">Confirmé</Badge>,
      'pending': <Badge variant="secondary">En attente</Badge>,
      'failed': <Badge variant="destructive">En échec</Badge>,
      'refunded': <Badge variant="outline">Remboursé</Badge>,
      'disputed': <Badge variant="destructive" className="bg-red-100 text-red-800">En litige</Badge>,
    };
    return badges[status as keyof typeof badges] || <Badge variant="outline">{status}</Badge>;
  };

  const commissionData = statistics ? [
    { name: 'Bikawo', value: statistics.commission_bikawo, color: '#f59e0b' },
    { name: 'Prestataires', value: statistics.total_encaisse - statistics.commission_bikawo, color: '#10b981' }
  ] : [];

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Gestion des paiements</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Suivi des transactions Stripe et versements prestataires</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Total encaissé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics?.total_encaisse.toFixed(2)}€
            </div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Euro className="w-4 h-4 text-amber-600" />
              Commission Bikawo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {statistics?.commission_bikawo.toFixed(2)}€
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics && statistics.total_encaisse > 0
                ? `${((statistics.commission_bikawo / statistics.total_encaisse) * 100).toFixed(1)}%`
                : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
              Versé prestataires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statistics?.verse_prestataires.toFixed(2)}€
            </div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
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
            <div className="text-2xl font-bold text-orange-600">
              {statistics?.paiements_attente || 0}
            </div>
            <p className="text-xs text-muted-foreground">Paiements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Litiges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics?.litiges_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Encaissements sur 7 jours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statistics?.weekly_revenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition des commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPieChart>
                <Pie
                  data={commissionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {commissionData.map((entry, index) => (
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
          <CardTitle className="text-lg">Recherche et filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="paid">Confirmé</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">En échec</SelectItem>
                <SelectItem value="refunded">Remboursé</SelectItem>
                <SelectItem value="disputed">En litige</SelectItem>
              </SelectContent>
            </Select>

            <Select value={universeFilter} onValueChange={setUniverseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Univers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les univers</SelectItem>
                <SelectItem value="bika_kids">Bika Kids</SelectItem>
                <SelectItem value="bika_maison">Bika Maison</SelectItem>
                <SelectItem value="bika_seniors">Bika Seniors</SelectItem>
                <SelectItem value="bika_pro">Bika Pro</SelectItem>
                <SelectItem value="bika_plus">Bika Plus</SelectItem>
              </SelectContent>
            </Select>

            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Aujourd'hui</SelectItem>
                <SelectItem value="week">7 derniers jours</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="all">Tout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions ({filteredTransactions.length})</TabsTrigger>
          <TabsTrigger value="payouts">Versements prestataires ({providerPayouts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Prestataire</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Montant total</TableHead>
                    <TableHead className="text-right">Part Bikawo</TableHead>
                    <TableHead className="text-right">Part Prestataire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Aucune transaction trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-xs">
                          {transaction.id.substring(0, 8)}
                        </TableCell>
                        <TableCell>
                          {transaction.client_profile
                            ? `${transaction.client_profile.first_name} ${transaction.client_profile.last_name}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {transaction.provider_profile
                            ? `${transaction.provider_profile.first_name} ${transaction.provider_profile.last_name}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {transaction.bookings?.services?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {transaction.client_price.toFixed(2)}€
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          {transaction.company_commission.toFixed(2)}€
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {transaction.provider_payment.toFixed(2)}€
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.payment_status)}</TableCell>
                        <TableCell>
                          {transaction.client_paid_at
                            ? new Date(transaction.client_paid_at).toLocaleDateString('fr-FR')
                            : new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTransaction(transaction)}
                            >
                              Détails
                            </Button>
                            {transaction.payment_status === 'paid' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`https://dashboard.stripe.com/payments/${transaction.id}`, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Versements prestataires en attente</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestataire</TableHead>
                    <TableHead className="text-center">Missions validées</TableHead>
                    <TableHead className="text-center">Missions en attente</TableHead>
                    <TableHead className="text-right">Montant à verser</TableHead>
                    <TableHead>Dernier versement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providerPayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucun versement en attente
                      </TableCell>
                    </TableRow>
                  ) : (
                    providerPayouts.map((payout) => (
                      <TableRow key={payout.provider_id}>
                        <TableCell className="font-medium">{payout.provider_name}</TableCell>
                        <TableCell className="text-center">{payout.missions_count}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{payout.pending_missions}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {payout.total_amount.toFixed(2)}€
                        </TableCell>
                        <TableCell>
                          {payout.last_payout_date
                            ? new Date(payout.last_payout_date).toLocaleDateString('fr-FR')
                            : 'Jamais'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="default"
                            size="sm"
                            disabled={payout.total_amount === 0}
                            onClick={() => handleProviderPayout(payout.provider_id)}
                          >
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            Effectuer versement
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedTransaction && (
        <PaymentDetailsModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}
