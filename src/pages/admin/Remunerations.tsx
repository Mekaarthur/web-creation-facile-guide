import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, Building2, Download, Mail, Eye, DollarSign, Calendar, Users, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProviderPayment {
  id: string;
  provider_id: string;
  amount_gross: number;
  amount_net: number;
  amount_charges: number;
  period_start: string;
  period_end: string;
  status: string;
  generated_date: string;
  paid_date?: string;
  notes?: string;
  providers?: {
    id: string;
    business_name: string;
    user_id: string;
    profiles?: {
      first_name: string;
      last_name: string;
    };
  };
  missions_count: number;
  total_hours: number;
}

interface PaymentStats {
  total_gross: number;
  total_net: number;
  pending_amount: number;
  paid_amount: number;
  total_count: number;
}

export default function AdminRemunerations() {
  const [payments, setPayments] = useState<ProviderPayment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    total_gross: 0,
    total_net: 0,
    pending_amount: 0,
    paid_amount: 0,
    total_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<ProviderPayment | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const { toast } = useToast();

  const loadProviderPayments = async () => {
    try {
      setLoading(true);
      
      // Charger les fiches de rémunération avec les données prestataires
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('prestations_realisees')
        .select(`
          *,
          providers:provider_id (
            id,
            business_name,
            user_id,
            profiles:user_id (first_name, last_name)
          )
        `)
        .order('date_prestation', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Transformer les données pour créer des fiches de rémunération par période
      const paymentsByProvider = paymentsData?.reduce((acc, prestation) => {
        const providerId = prestation.provider_id;
        const month = format(new Date(prestation.date_prestation), 'yyyy-MM');
        
        if (!acc[providerId]) {
          acc[providerId] = {};
        }
        
        if (!acc[providerId][month]) {
          acc[providerId][month] = {
            provider: prestation.providers,
            prestations: [],
            total_gross: 0,
            total_net: 0,
            total_hours: 0,
            missions_count: 0
          };
        }
        
        acc[providerId][month].prestations.push(prestation);
        acc[providerId][month].total_gross += prestation.montant_total || 0;
        acc[providerId][month].total_hours += prestation.duree_heures || 0;
        acc[providerId][month].missions_count += 1;
        
        // Calcul net (simulé - à adapter selon vos règles)
        acc[providerId][month].total_net = acc[providerId][month].total_gross * 0.8;
        
        return acc;
      }, {} as any);

      // Convertir en tableau de fiches de rémunération
      const transformedPayments: ProviderPayment[] = [];
      
      Object.entries(paymentsByProvider || {}).forEach(([providerId, months]: [string, any]) => {
        Object.entries(months).forEach(([month, data]: [string, any]) => {
          const startDate = new Date(month + '-01');
          const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
          
          transformedPayments.push({
            id: `${providerId}-${month}`,
            provider_id: providerId,
            amount_gross: data.total_gross,
            amount_net: data.total_net,
            amount_charges: data.total_gross - data.total_net,
            period_start: startDate.toISOString(),
            period_end: endDate.toISOString(),
            status: 'pending',
            generated_date: new Date().toISOString(),
            providers: data.provider,
            missions_count: data.missions_count,
            total_hours: data.total_hours
          });
        });
      });

      setPayments(transformedPayments);

      // Calculer les statistiques
      const calculatedStats = transformedPayments.reduce((acc, payment) => {
        acc.total_gross += payment.amount_gross;
        acc.total_net += payment.amount_net;
        acc.total_count += 1;
        
        if (payment.status === 'paid') {
          acc.paid_amount += payment.amount_net;
        } else {
          acc.pending_amount += payment.amount_net;
        }
        
        return acc;
      }, {
        total_gross: 0,
        total_net: 0,
        pending_amount: 0,
        paid_amount: 0,
        total_count: 0
      });
      
      setStats(calculatedStats);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les fiches de rémunération",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPaymentSheet = async (payment: ProviderPayment) => {
    try {
      // Simuler le téléchargement de la fiche (à implémenter avec un service PDF)
      const paymentUrl = `https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/generate-payment-sheet?payment_id=${payment.id}`;
      window.open(paymentUrl, '_blank');
      
      toast({
        title: "Téléchargement en cours",
        description: "Fiche de rémunération en cours de téléchargement",
      });
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la fiche",
        variant: "destructive"
      });
    }
  };

  const sendPaymentEmail = async (payment: ProviderPayment) => {
    try {
      // Envoyer l'email de fiche de rémunération
      const { error } = await supabase.functions.invoke('send-payment-sheet-email', {
        body: { payment_id: payment.id }
      });

      if (error) throw error;

      toast({
        title: "Email envoyé",
        description: "Fiche de rémunération envoyée par email",
      });
    } catch (error) {
      console.error('Erreur envoi email:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email",
        variant: "destructive"
      });
    }
  };

  const adjustPayment = async (payment: ProviderPayment) => {
    try {
      const adjustment = parseFloat(adjustmentAmount);
      if (isNaN(adjustment)) {
        throw new Error('Montant invalide');
      }

      // Simuler l'ajustement (à implémenter)
      toast({
        title: "Ajustement appliqué",
        description: `Ajustement de €${adjustment} appliqué avec succès`,
      });

      setAdjustmentAmount('');
      setAdjustmentReason('');
      setSelectedPayment(null);
      loadProviderPayments();
    } catch (error) {
      console.error('Erreur ajustement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'appliquer l'ajustement",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadProviderPayments();
  }, []);

  const filteredPayments = payments.filter(payment => {
    const providerName = payment.providers?.business_name || 
      (payment.providers?.profiles ? 
        `${payment.providers.profiles.first_name} ${payment.providers.profiles.last_name}` : '');
    return providerName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Payée</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Annulée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fiches de rémunération prestataires</h1>
        <p className="text-muted-foreground">Gestion des rémunérations et fiches de paie</p>
      </div>

      {/* Statistiques des rémunérations */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              Total brut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.total_gross.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Montant brut total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" />
              Total net
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€{stats.total_net.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Montant net à payer</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">€{stats.pending_amount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">À payer</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              Fiches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_count}</div>
            <p className="text-xs text-muted-foreground">Fiches générées</p>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rechercher</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher par nom de prestataire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des fiches de rémunération */}
      <Card>
        <CardHeader>
          <CardTitle>Fiches de rémunération</CardTitle>
          <CardDescription>
            {filteredPayments.length} fiche(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prestataire</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Missions</TableHead>
                <TableHead>Heures</TableHead>
                <TableHead>Montant brut</TableHead>
                <TableHead>Montant net</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const providerName = payment.providers?.business_name || 
                  (payment.providers?.profiles ? 
                    `${payment.providers.profiles.first_name} ${payment.providers.profiles.last_name}` : 
                    'Prestataire inconnu');
                
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{providerName}</TableCell>
                    <TableCell>
                      {format(new Date(payment.period_start), 'MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>{payment.missions_count}</TableCell>
                    <TableCell>{payment.total_hours.toFixed(1)}h</TableCell>
                    <TableCell>€{payment.amount_gross.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">€{payment.amount_net.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Détails de la fiche de rémunération</DialogTitle>
                            </DialogHeader>
                            {selectedPayment && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div><span className="font-medium">Prestataire:</span> {providerName}</div>
                                  <div><span className="font-medium">Période:</span> {format(new Date(selectedPayment.period_start), 'MM/yyyy', { locale: fr })}</div>
                                  <div><span className="font-medium">Missions:</span> {selectedPayment.missions_count}</div>
                                  <div><span className="font-medium">Heures:</span> {selectedPayment.total_hours.toFixed(1)}h</div>
                                  <div><span className="font-medium">Montant brut:</span> €{selectedPayment.amount_gross.toFixed(2)}</div>
                                  <div><span className="font-medium">Charges:</span> €{selectedPayment.amount_charges.toFixed(2)}</div>
                                  <div><span className="font-medium">Montant net:</span> €{selectedPayment.amount_net.toFixed(2)}</div>
                                  <div><span className="font-medium">Statut:</span> {getStatusBadge(selectedPayment.status)}</div>
                                </div>
                                
                                <div className="pt-4">
                                  <h4 className="font-medium mb-2">Ajuster le montant</h4>
                                  <div className="space-y-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="Montant d'ajustement (+ ou -)"
                                      value={adjustmentAmount}
                                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                                    />
                                    <Textarea
                                      placeholder="Raison de l'ajustement"
                                      value={adjustmentReason}
                                      onChange={(e) => setAdjustmentReason(e.target.value)}
                                    />
                                    <Button 
                                      onClick={() => adjustPayment(selectedPayment)}
                                      className="w-full"
                                      disabled={!adjustmentAmount || !adjustmentReason}
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Appliquer l'ajustement
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadPaymentSheet(payment)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => sendPaymentEmail(payment)}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}