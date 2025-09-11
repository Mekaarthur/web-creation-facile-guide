import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  Euro, 
  Filter,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  CreditCard,
  Receipt,
  ArrowRight,
  PieChart
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  issued_date: string;
  due_date: string;
  payment_date: string | null;
  service_description: string | null;
  notes: string | null;
  created_at: string;
}

const ModernInvoiceManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  // Charger les factures avec React Query
  const { data: invoices = [], isLoading, refetch } = useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async (): Promise<Invoice[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', user.id)
        .order('issued_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  // Filtrage et statistiques
  const { filteredInvoices, stats } = useMemo(() => {
    let filtered = invoices;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.service_description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Filtrage par année
    if (yearFilter !== 'all') {
      filtered = filtered.filter(invoice => 
        new Date(invoice.issued_date).getFullYear().toString() === yearFilter
      );
    }

    // Calculer les statistiques
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const pendingAmount = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    const creditImpotSavings = totalAmount * 0.5; // 50% crédit d'impôt

    return {
      filteredInvoices: filtered,
      stats: {
        total: totalAmount,
        paid: paidAmount,
        pending: pendingAmount,
        count: invoices.length,
        creditImpotSavings
      }
    };
  }, [invoices, searchTerm, statusFilter, yearFilter]);

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
        icon: <Clock className="w-4 h-4" />,
        label: 'En attente'
      },
      paid: {
        color: 'bg-green-500/10 text-green-700 border-green-500/20',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Payée'
      },
      overdue: {
        color: 'bg-red-500/10 text-red-700 border-red-500/20',
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'En retard'
      }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const downloadInvoice = async (invoice: Invoice) => {
    try {
      // Simuler le téléchargement (à implémenter avec la génération PDF réelle)
      toast({
        title: "Téléchargement commencé",
        description: `Facture ${invoice.invoice_number} en cours de téléchargement`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la facture",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques en header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total facturé</p>
                <p className="text-2xl font-bold text-primary">{stats.total.toFixed(2)}€</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Euro className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Montant payé</p>
                <p className="text-2xl font-bold text-green-600">{stats.paid.toFixed(2)}€</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending.toFixed(2)}€</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Crédit d'impôt</p>
                <p className="text-2xl font-bold text-purple-600">{stats.creditImpotSavings.toFixed(2)}€</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de contrôles */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher par numéro de facture ou service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="paid">Payées</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                </SelectContent>
              </Select>

              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des factures */}
      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Aucune facture trouvée
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || yearFilter !== 'all'
                ? 'Essayez de modifier vos filtres de recherche'
                : "Vous n'avez pas encore de factures"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice, index) => {
            const statusConfig = getStatusConfig(invoice.status);
            const isOverdue = invoice.status === 'pending' && new Date(invoice.due_date) < new Date();
            
            return (
              <Card 
                key={invoice.id} 
                className="border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            Facture {invoice.invoice_number}
                          </h3>
                          <Badge className={statusConfig.color}>
                            {statusConfig.icon}
                            <span className="ml-1">{statusConfig.label}</span>
                          </Badge>
                          {isOverdue && (
                            <Badge variant="destructive">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              En retard
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Service:</strong> {invoice.service_description || 'Service non spécifié'}</p>
                          <div className="flex items-center gap-4">
                            <span>
                              <Calendar className="w-4 h-4 inline mr-1" />
                              Émise le {format(new Date(invoice.issued_date), 'dd MMMM yyyy', { locale: fr })}
                            </span>
                            <span>
                              <Clock className="w-4 h-4 inline mr-1" />
                              Échéance: {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                          </div>
                        </div>

                        {invoice.notes && (
                          <div className="p-3 bg-muted/30 rounded-lg text-sm">
                            <p className="text-muted-foreground">{invoice.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-3">
                      <div className="text-2xl font-bold text-primary">
                        {invoice.amount.toFixed(2)}€
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Économie crédit impôt: {(invoice.amount * 0.5).toFixed(2)}€
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="hover:bg-primary/5">
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadInvoice(invoice)}
                          className="hover:bg-primary/5"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                        {invoice.status === 'pending' && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CreditCard className="w-4 h-4 mr-1" />
                            Payer
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Section crédit d'impôt */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <PieChart className="w-5 h-5 text-blue-600" />
            </div>
            Crédit d'impôt 2024
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">Total économisé cette année</span>
              <span className="text-2xl font-bold text-blue-600">
                {stats.creditImpotSavings.toFixed(2)}€
              </span>
            </div>
            
            <Progress 
              value={Math.min((stats.creditImpotSavings / 12000) * 100, 100)} 
              className="h-3"
            />
            
            <div className="flex justify-between text-sm text-blue-700">
              <span>Économisé: {stats.creditImpotSavings.toFixed(2)}€</span>
              <span>Plafond: 12 000€</span>
            </div>
            
            <div className="bg-white/50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>💡 Astuce:</strong> Conservez toutes vos factures pour votre déclaration d'impôts.
              </p>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                <Download className="w-4 h-4 mr-2" />
                Télécharger le récapitulatif annuel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernInvoiceManagement;