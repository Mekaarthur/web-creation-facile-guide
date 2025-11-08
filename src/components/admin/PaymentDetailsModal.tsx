import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  User, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Clock,
  ExternalLink,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface PaymentDetailsModalProps {
  transaction: Transaction;
  onClose: () => void;
  onUpdate: () => void;
}

export const PaymentDetailsModal = ({ transaction, onClose, onUpdate }: PaymentDetailsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [refundAmount, setRefundAmount] = useState(transaction.client_price.toString());
  const [refundReason, setRefundReason] = useState('');
  const { toast } = useToast();

  const handleRefund = async () => {
    if (!refundReason) {
      toast({
        title: "Erreur",
        description: "Veuillez indiquer une raison de remboursement",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          paymentIntentId: transaction.id,
          refundAmount: Math.round(Number(refundAmount) * 100), // Convertir en cents
          reason: refundReason
        }
      });

      if (error) throw error;

      // Mettre à jour le statut de la transaction
      await supabase
        .from('financial_transactions')
        .update({ payment_status: 'refunded' })
        .eq('id', transaction.id);

      toast({
        title: "Remboursement effectué",
        description: `${refundAmount}€ remboursés au client`,
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Erreur remboursement:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'effectuer le remboursement",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayProvider = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({ provider_paid_at: new Date().toISOString() })
        .eq('id', transaction.id);

      if (error) throw error;

      toast({
        title: "Versement effectué",
        description: "Le prestataire a été payé avec succès",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Erreur versement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le versement",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const commissionPercentage = ((transaction.company_commission / transaction.client_price) * 100).toFixed(1);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de la transaction</DialogTitle>
          <DialogDescription>
            Transaction #{transaction.id.substring(0, 8)} - {getStatusBadge(transaction.payment_status)}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="financial">Finances</TabsTrigger>
            <TabsTrigger value="stripe">Stripe</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations de réservation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Service</Label>
                    <p className="font-medium">{transaction.bookings?.services?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{transaction.service_category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <p className="font-medium">
                        {transaction.bookings?.booking_date
                          ? new Date(transaction.bookings.booking_date).toLocaleDateString('fr-FR')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Horaires</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <p className="font-medium">
                        {transaction.bookings?.start_time} - {transaction.bookings?.end_time}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Adresse</Label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <p className="font-medium">{transaction.bookings?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">
                    {transaction.client_profile
                      ? `${transaction.client_profile.first_name} ${transaction.client_profile.last_name}`
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">{transaction.client_profile?.email}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Prestataire</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">
                    {transaction.provider_profile
                      ? `${transaction.provider_profile.first_name} ${transaction.provider_profile.last_name}`
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.provider_paid_at ? 'Payé' : 'En attente de paiement'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Répartition financière
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg bg-primary/5">
                    <p className="text-sm text-muted-foreground mb-1">Prix total</p>
                    <p className="text-2xl font-bold text-primary">
                      {transaction.client_price.toFixed(2)}€
                    </p>
                    <p className="text-xs text-muted-foreground">Client paye</p>
                  </div>

                  <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                    <p className="text-sm text-muted-foreground mb-1">Prestataire</p>
                    <p className="text-2xl font-bold text-green-600">
                      {transaction.provider_payment.toFixed(2)}€
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(100 - Number(commissionPercentage)).toFixed(1)}% du total
                    </p>
                  </div>

                  <div className="text-center p-4 border rounded-lg bg-amber-50 dark:bg-amber-950">
                    <p className="text-sm text-muted-foreground mb-1">Commission</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {transaction.company_commission.toFixed(2)}€
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {commissionPercentage}% Bikawo
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date paiement client:</span>
                    <span className="font-medium">
                      {transaction.client_paid_at
                        ? new Date(transaction.client_paid_at).toLocaleString('fr-FR')
                        : 'En attente'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date versement prestataire:</span>
                    <span className="font-medium">
                      {transaction.provider_paid_at
                        ? new Date(transaction.provider_paid_at).toLocaleString('fr-FR')
                        : 'Non versé'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stripe" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informations Stripe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">ID Transaction Stripe</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                        {transaction.id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://dashboard.stripe.com/payments/${transaction.id}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Statut paiement</Label>
                    <div className="mt-1">{getStatusBadge(transaction.payment_status)}</div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Moyen de paiement</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <CreditCard className="h-4 w-4" />
                      <span>Carte bancaire / Stripe</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`https://dashboard.stripe.com/payments/${transaction.id}`, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Voir dans Stripe Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            {/* Versement prestataire */}
            {transaction.payment_status === 'paid' && !transaction.provider_paid_at && (
              <Card>
                <CardHeader>
                  <CardTitle>Verser au prestataire</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Le paiement client est confirmé. Vous pouvez maintenant effectuer le versement au prestataire.
                  </p>
                  <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      Montant à verser: {transaction.provider_payment.toFixed(2)}€
                    </p>
                  </div>
                  <Button
                    onClick={handlePayProvider}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Confirmer le versement
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Remboursement */}
            {(transaction.payment_status === 'paid' || transaction.payment_status === 'pending') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Remboursement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Montant à rembourser (€)</Label>
                    <Input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      max={transaction.client_price}
                      step="0.01"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum: {transaction.client_price.toFixed(2)}€
                    </p>
                  </div>

                  <div>
                    <Label>Raison du remboursement</Label>
                    <Textarea
                      placeholder="Indiquer la raison du remboursement..."
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    variant="destructive"
                    onClick={handleRefund}
                    disabled={isLoading || !refundReason}
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Effectuer le remboursement
                  </Button>
                </CardContent>
              </Card>
            )}

            {transaction.payment_status === 'refunded' && (
              <Card>
                <CardContent className="text-center py-8">
                  <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Cette transaction a déjà été remboursée</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
