import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, CreditCard, DollarSign, TrendingUp, AlertCircle, Download, Filter, RotateCcw, Check, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  currency: string;
  admin_notes?: string;
  refund_amount?: number;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  carts?: {
    status: string;
    total_estimated: number;
  };
  bookings?: {
    id: string;
    service_id: string;
    services: {
      name: string;
    };
  };
}

interface Statistics {
  total_revenue: number;
  pending_amount: number;
  failed_count: number;
  refunded_amount: number;
  by_method: {
    stripe: number;
    paypal: number;
    virement: number;
    especes: number;
  };
}

export default function AdminPaiements() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [confirmNotes, setConfirmNotes] = useState('');
  const { toast } = useToast();

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      let url = `https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/admin-payments`;
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }

      const result = await response.json();
      
      setPayments(result.payments || []);
      setStatistics(result.statistics || null);
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

  const handlePaymentAction = async (action: string, paymentId: string, extraData?: any) => {
    try {
      setActionLoading(paymentId);
      
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      let url = `https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/admin-payments?action=${action}&paymentId=${paymentId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...extraData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'action');
      }

      const result = await response.json();

      toast({
        title: "Succès",
        description: `Action ${action} effectuée avec succès`,
      });

      // Recharger les données
      loadPayments();
      setSelectedPayment(null);
      setRefundAmount('');
      setRefundReason('');
      setConfirmNotes('');
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: error.message || `Impossible d'effectuer l'action ${action}`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = payments.filter(payment => {
    const clientName = payment.profiles ? `${payment.profiles.first_name} ${payment.profiles.last_name}` : '';
    const matchesSearch = 
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'payé':
        return <Badge variant="default" className="bg-green-100 text-green-800">Payé</Badge>;
      case 'en_attente':
        return <Badge variant="secondary">En attente</Badge>;
      case 'échoué':
        return <Badge variant="destructive">Échoué</Badge>;
      case 'remboursé':
        return <Badge variant="outline">Remboursé</Badge>;
      case 'annulé':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'stripe':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Stripe</Badge>;
      case 'paypal':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">PayPal</Badge>;
      case 'virement':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Virement</Badge>;
      case 'especes':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Espèces</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const statusCounts = {
    all: payments.length,
    payé: payments.filter(p => p.status === 'payé').length,
    en_attente: payments.filter(p => p.status === 'en_attente').length,
    échoué: payments.filter(p => p.status === 'échoué').length,
    remboursé: payments.filter(p => p.status === 'remboursé').length,
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
            <div className="text-2xl font-bold text-green-600">€{statistics?.total_revenue?.toFixed(2) || '0.00'}</div>
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
            <div className="text-2xl font-bold text-orange-600">€{statistics?.pending_amount?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">{statusCounts.en_attente} transactions</p>
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
            <div className="text-2xl font-bold text-red-600">{statistics?.failed_count || 0}</div>
            <p className="text-xs text-muted-foreground">À résoudre</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Remboursements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">€{statistics?.refunded_amount?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">{statusCounts.remboursé} remboursements</p>
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
            <Button variant="outline" size="sm" onClick={loadPayments}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              // Export functionality
              const handleExport = async () => {
                try {
                  const token = (await supabase.auth.getSession()).data.session?.access_token;
                  
                  const url = `https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/admin-payments?action=export&format=csv&status=${statusFilter}`;
                  
                  const response = await fetch(url, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    }
                  });

                  if (response.ok) {
                    const blob = await response.blob();
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = `paiements_${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(downloadUrl);
                  }
                } catch (error) {
                  console.error('Erreur export:', error);
                  toast({
                    title: "Erreur",
                    description: "Impossible d'exporter les données",
                    variant: "destructive"
                  });
                }
              };
              handleExport();
            }}>
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
          <TabsTrigger value="payé">
            Payés ({statusCounts.payé})
          </TabsTrigger>
          <TabsTrigger value="en_attente">
            En attente ({statusCounts.en_attente})
          </TabsTrigger>
          <TabsTrigger value="échoué">
            Échoués ({statusCounts.échoué})
          </TabsTrigger>
          <TabsTrigger value="remboursé">
            Remboursés ({statusCounts.remboursé})
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
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Montant</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => {
                      const clientName = payment.profiles 
                        ? `${payment.profiles.first_name} ${payment.profiles.last_name}`
                        : 'N/A';
                      
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            €{payment.amount.toFixed(2)} {payment.currency}
                          </TableCell>
                          <TableCell>{clientName}</TableCell>
                          <TableCell>{getMethodBadge(payment.payment_method)}</TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            {payment.payment_date 
                              ? new Date(payment.payment_date).toLocaleDateString('fr-FR')
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {payment.transaction_id || payment.id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedPayment(payment)}
                                  >
                                    Détails
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Détails du paiement</DialogTitle>
                                    <DialogDescription>
                                      Paiement #{selectedPayment?.id.slice(0, 8)}
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedPayment && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium">Montant:</span> €{selectedPayment.amount.toFixed(2)}
                                        </div>
                                        <div>
                                          <span className="font-medium">Devise:</span> {selectedPayment.currency}
                                        </div>
                                        <div>
                                          <span className="font-medium">Méthode:</span> {selectedPayment.payment_method}
                                        </div>
                                        <div>
                                          <span className="font-medium">Statut:</span> {getStatusBadge(selectedPayment.status)}
                                        </div>
                                        <div>
                                          <span className="font-medium">Date:</span> {selectedPayment.payment_date ? new Date(selectedPayment.payment_date).toLocaleString('fr-FR') : 'N/A'}
                                        </div>
                                        <div>
                                          <span className="font-medium">Transaction ID:</span> {selectedPayment.transaction_id}
                                        </div>
                                      </div>
                                      
                                      {selectedPayment.admin_notes && (
                                        <div>
                                          <span className="font-medium">Notes admin:</span>
                                          <p className="text-muted-foreground mt-1">{selectedPayment.admin_notes}</p>
                                        </div>
                                      )}

                                      <div className="flex gap-2 pt-4">
                                        {selectedPayment.status === 'en_attente' && (
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <Button size="sm" disabled={actionLoading === selectedPayment.id}>
                                                <Check className="w-4 h-4 mr-2" />
                                                Confirmer paiement
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                              <DialogHeader>
                                                <DialogTitle>Confirmer le paiement</DialogTitle>
                                                <DialogDescription>
                                                  Voulez-vous confirmer ce paiement manuellement ?
                                                </DialogDescription>
                                              </DialogHeader>
                                              <div className="space-y-4">
                                                <Textarea
                                                  placeholder="Notes (optionnel)"
                                                  value={confirmNotes}
                                                  onChange={(e) => setConfirmNotes(e.target.value)}
                                                />
                                                <Button
                                                  onClick={() => handlePaymentAction('confirm', selectedPayment.id, { notes: confirmNotes })}
                                                  disabled={actionLoading === selectedPayment.id}
                                                >
                                                  Confirmer
                                                </Button>
                                              </div>
                                            </DialogContent>
                                          </Dialog>
                                        )}
                                        
                                        {selectedPayment.status === 'payé' && (
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <Button variant="destructive" size="sm" disabled={actionLoading === selectedPayment.id}>
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                                Rembourser
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                              <DialogHeader>
                                                <DialogTitle>Rembourser le paiement</DialogTitle>
                                                <DialogDescription>
                                                  Remboursement pour le paiement #{selectedPayment.id.slice(0, 8)}
                                                </DialogDescription>
                                              </DialogHeader>
                                              <div className="space-y-4">
                                                <div>
                                                  <label className="text-sm font-medium">Montant à rembourser</label>
                                                  <Input
                                                    type="number"
                                                    step="0.01"
                                                    max={selectedPayment.amount}
                                                    placeholder={selectedPayment.amount.toString()}
                                                    value={refundAmount}
                                                    onChange={(e) => setRefundAmount(e.target.value)}
                                                  />
                                                </div>
                                                <div>
                                                  <label className="text-sm font-medium">Raison du remboursement</label>
                                                  <Textarea
                                                    placeholder="Expliquez la raison du remboursement..."
                                                    value={refundReason}
                                                    onChange={(e) => setRefundReason(e.target.value)}
                                                  />
                                                </div>
                                                <Button
                                                  variant="destructive"
                                                  onClick={() => handlePaymentAction('refund', selectedPayment.id, { 
                                                    amount: parseFloat(refundAmount) || selectedPayment.amount,
                                                    reason: refundReason 
                                                  })}
                                                  disabled={actionLoading === selectedPayment.id}
                                                >
                                                  Confirmer le remboursement
                                                </Button>
                                              </div>
                                            </DialogContent>
                                          </Dialog>
                                        )}
                                        
                                        {selectedPayment.status === 'échoué' && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePaymentAction('retry', selectedPayment.id)}
                                            disabled={actionLoading === selectedPayment.id}
                                          >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Relancer
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}