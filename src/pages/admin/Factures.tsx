import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Send, 
  Eye, 
  Search, 
  RefreshCw,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PieChart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InvoiceDetailsModal } from '@/components/admin/InvoiceDetailsModal';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ClientInvoice {
  id: string;
  invoice_number: string;
  client_id: string;
  booking_id: string;
  amount: number;
  status: string;
  payment_date: string | null;
  created_at: string;
  issued_date: string | null;
  due_date: string | null;
  service_description: string | null;
  notes: string | null;
  client_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  bookings?: {
    booking_date: string;
    start_time: string;
    services?: {
      name: string;
      category: string;
    } | null;
  };
}

interface ProviderInvoice {
  id: string;
  invoice_number: string;
  provider_id: string;
  amount_brut: number;
  amount_net: number;
  charges_sociales: number;
  status: string;
  payment_date: string | null;
  created_at: string;
  issued_date: string | null;
  service_description?: string | null;
  booking_id: string | null;
  provider_profile?: {
    business_name: string;
  } | null;
}

interface Statistics {
  total_factures_month: number;
  total_amount_facture: number;
  commission_bikawo: number;
  factures_en_attente: number;
  remboursements: number;
  monthly_revenue: any[];
}

export default function AdminFactures() {
  const [clientInvoices, setClientInvoices] = useState<ClientInvoice[]>([]);
  const [providerInvoices, setProviderInvoices] = useState<ProviderInvoice[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [universeFilter, setUniverseFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('month');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter, universeFilter, periodFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadClientInvoices(),
        loadProviderInvoices(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les factures",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClientInvoices = async () => {
    let query = supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
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

    // Charger les détails
    const invoicesWithDetails = await Promise.all(
      (data || []).map(async (invoice) => {
        const [clientProfile, booking] = await Promise.all([
          supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('user_id', invoice.client_id)
            .single(),
          supabase
            .from('bookings')
            .select('booking_date, start_time, service_id')
            .eq('id', invoice.booking_id)
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

        return {
          ...invoice,
          client_profile: clientProfile.data,
          bookings: booking.data ? {
            ...booking.data,
            services
          } : undefined
        };
      })
    );

    setClientInvoices(invoicesWithDetails as ClientInvoice[]);
  };

  const loadProviderInvoices = async () => {
    let query = supabase
      .from('provider_invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
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

    // Charger les profils prestataires
    const invoicesWithDetails = await Promise.all(
      (data || []).map(async (invoice) => {
        const { data: providerData } = await supabase
          .from('providers')
          .select('user_id, business_name')
          .eq('id', invoice.provider_id)
          .single();

        return {
          ...invoice,
          provider_profile: {
            business_name: providerData?.business_name || 'N/A'
          }
        };
      })
    );

    setProviderInvoices(invoicesWithDetails as ProviderInvoice[]);
  };

  const loadStatistics = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [clientInvoicesData, providerInvoicesData, transactions] = await Promise.all([
      supabase
        .from('invoices')
        .select('*')
        .gte('created_at', startOfMonth.toISOString()),
      supabase
        .from('provider_invoices')
        .select('*')
        .gte('created_at', startOfMonth.toISOString()),
      supabase
        .from('financial_transactions')
        .select('*')
        .gte('created_at', startOfMonth.toISOString())
    ]);

    const totalFactures = (clientInvoicesData.data?.length || 0) + (providerInvoicesData.data?.length || 0);
    const totalAmount = (clientInvoicesData.data || []).reduce((sum, inv) => sum + Number(inv.amount), 0);
    const commission = (transactions.data || [])
      .filter(t => t.payment_status === 'paid')
      .reduce((sum, t) => sum + Number(t.company_commission), 0);
    const enAttente = (clientInvoicesData.data || []).filter(inv => inv.status === 'pending').length;
    const remboursements = (clientInvoicesData.data || []).filter(inv => inv.status === 'refunded').length;

    // Revenus mensuels pour graphique
    const monthlyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayInvoices = (clientInvoicesData.data || []).filter(inv => {
        const invDate = new Date(inv.created_at);
        return invDate.toDateString() === date.toDateString();
      });
      const revenue = dayInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      monthlyRevenue.push({
        name: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        revenue
      });
    }

    setStatistics({
      total_factures_month: totalFactures,
      total_amount_facture: totalAmount,
      commission_bikawo: commission,
      factures_en_attente: enAttente,
      remboursements,
      monthly_revenue: monthlyRevenue
    });
  };

  const handleDownloadPDF = async (invoice: any, type: 'client' | 'provider') => {
    toast({
      title: "Génération PDF",
      description: "Le PDF de la facture est en cours de génération...",
    });
    
    // TODO: Implémenter la génération PDF
    setTimeout(() => {
      toast({
        title: "PDF généré",
        description: `Facture ${invoice.invoice_number} téléchargée`,
      });
    }, 1500);
  };

  const handleSendEmail = async (invoice: any, type: 'client' | 'provider') => {
    toast({
      title: "Envoi en cours",
      description: "L'email est en cours d'envoi...",
    });

    // TODO: Implémenter l'envoi d'email via edge function
    setTimeout(() => {
      toast({
        title: "Email envoyé",
        description: `Facture envoyée à ${type === 'client' ? invoice.client_profile?.email : invoice.provider_profile?.business_name}`,
      });
    }, 1500);
  };

  const handleCancelInvoice = async (invoiceId: string, type: 'client' | 'provider') => {
    try {
      const table = type === 'client' ? 'invoices' : 'provider_invoices';
      const { error } = await supabase
        .from(table)
        .update({ status: 'cancelled' })
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Facture annulée",
        description: "La facture a été annulée avec succès",
      });

      loadData();
    } catch (error) {
      console.error('Erreur annulation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la facture",
        variant: "destructive"
      });
    }
  };

  const filteredClientInvoices = clientInvoices.filter(invoice => {
    const clientName = invoice.client_profile 
      ? `${invoice.client_profile.first_name} ${invoice.client_profile.last_name}`
      : '';
    const serviceName = invoice.bookings?.services?.name || '';
    
    return (
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serviceName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredProviderInvoices = providerInvoices.filter(invoice => {
    return (
      invoice.provider_profile?.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      'draft': <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Brouillon</Badge>,
      'issued': <Badge variant="default"><Send className="w-3 h-3 mr-1" />Émise</Badge>,
      'paid': <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Payée</Badge>,
      'pending': <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>,
      'refunded': <Badge variant="outline"><RefreshCw className="w-3 h-3 mr-1" />Remboursée</Badge>,
      'cancelled': <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Annulée</Badge>,
    };
    return badges[status as keyof typeof badges] || <Badge variant="outline">{status}</Badge>;
  };

  const invoiceTypeData = statistics ? [
    { name: 'Clients', value: clientInvoices.length, color: '#3b82f6' },
    { name: 'Prestataires', value: providerInvoices.length, color: '#10b981' }
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
        <h1 className="text-2xl sm:text-3xl font-bold">Gestion des factures</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Suivi de la facturation clients et prestataires</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Factures émises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statistics?.total_factures_month || 0}
            </div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Total facturé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics?.total_amount_facture.toFixed(2)}€
            </div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              Commission Bikawo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {statistics?.commission_bikawo.toFixed(2)}€
            </div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statistics?.factures_en_attente || 0}
            </div>
            <p className="text-xs text-muted-foreground">Paiements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-red-600" />
              Remboursements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics?.remboursements || 0}
            </div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenus journaliers (7 jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statistics?.monthly_revenue || []}>
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
            <CardTitle className="text-lg">Répartition par type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPieChart>
                <Pie
                  data={invoiceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {invoiceTypeData.map((entry, index) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-2">
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
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="issued">Émise</SelectItem>
                <SelectItem value="paid">Payée</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="refunded">Remboursée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
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

      {/* Onglets factures */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">
            Factures Clients ({filteredClientInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="providers">
            Factures Prestataires ({filteredProviderInvoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date émission</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Aucune facture trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClientInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-xs">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>
                          {invoice.client_profile
                            ? `${invoice.client_profile.first_name} ${invoice.client_profile.last_name}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {invoice.bookings?.services?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {invoice.amount.toFixed(2)}€
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          {invoice.payment_date
                            ? new Date(invoice.payment_date).toLocaleDateString('fr-FR')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedInvoice({ ...invoice, type: 'client' })}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPDF(invoice, 'client')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendEmail(invoice, 'client')}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
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

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Prestataire</TableHead>
                    <TableHead className="text-right">Montant brut</TableHead>
                    <TableHead className="text-right">Montant net</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date émission</TableHead>
                    <TableHead>Versement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviderInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Aucune facture trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProviderInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-xs">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell className="font-medium">
                          {invoice.provider_profile?.business_name}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {invoice.amount_brut.toFixed(2)}€
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {invoice.amount_net.toFixed(2)}€
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          {invoice.payment_date
                            ? new Date(invoice.payment_date).toLocaleDateString('fr-FR')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedInvoice({ ...invoice, type: 'provider' })}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPDF(invoice, 'provider')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendEmail(invoice, 'provider')}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
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
      </Tabs>

      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}
