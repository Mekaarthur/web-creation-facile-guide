import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Euro, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CancelledBooking {
  id: string;
  booking_date: string;
  total_price: number;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  service: { name: string } | null;
  client: { first_name: string | null; last_name: string | null } | null;
  payments: {
    id: string;
    status: string;
    refund_amount: number | null;
    stripe_payment_intent_id: string | null;
  }[];
}

export const AdminRefundManager = () => {
  const [bookings, setBookings] = useState<CancelledBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CancelledBooking | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCancelledBookings();
  }, []);

  const loadCancelledBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name),
          client:profiles!bookings_client_id_fkey(first_name, last_name),
          payments(id, status, refund_amount, stripe_payment_intent_id)
        `)
        .eq('status', 'cancelled')
        .order('cancelled_at', { ascending: false });

      if (error) throw error;
      setBookings((data as any) || []);
    } catch (error) {
      console.error('Error loading cancelled bookings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations annulées",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processManualRefund = async () => {
    if (!selectedBooking || !refundAmount) return;

    setActionLoading(true);
    try {
      const payment = selectedBooking.payments[0];
      if (!payment?.stripe_payment_intent_id) {
        throw new Error('Aucun paiement Stripe trouvé');
      }

      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          paymentIntentId: payment.stripe_payment_intent_id,
          refundAmount: Math.round(parseFloat(refundAmount) * 100),
          reason: refundReason || 'Manual refund by admin'
        }
      });

      if (error) throw error;

      // Mettre à jour le paiement
      await supabase
        .from('payments')
        .update({
          status: 'remboursé',
          refund_amount: parseFloat(refundAmount),
          refund_date: new Date().toISOString(),
          admin_notes: refundReason
        })
        .eq('id', payment.id);

      toast({
        title: "Remboursement effectué",
        description: `${refundAmount}€ remboursés avec succès`,
      });

      setSelectedBooking(null);
      setRefundAmount('');
      setRefundReason('');
      loadCancelledBookings();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter le remboursement",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getRefundStatus = (booking: CancelledBooking) => {
    const payment = booking.payments?.[0];
    if (!payment) return { status: 'no_payment', badge: 'secondary', text: 'Aucun paiement' };
    
    if (payment.refund_amount && payment.refund_amount > 0) {
      return { status: 'refunded', badge: 'default', text: 'Remboursé', icon: CheckCircle };
    }
    
    if (payment.status === 'remboursé') {
      return { status: 'refunded', badge: 'default', text: 'Remboursé', icon: CheckCircle };
    }
    
    return { status: 'pending', badge: 'destructive', text: 'À rembourser', icon: AlertCircle };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestion des remboursements</h2>
        <p className="text-muted-foreground">Gérez les remboursements des réservations annulées</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total annulations</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Remboursements traités</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => getRefundStatus(b).status === 'refunded').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => getRefundStatus(b).status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des réservations annulées */}
      <div className="space-y-4">
        {bookings.map((booking) => {
          const refundStatus = getRefundStatus(booking);
          const StatusIcon = refundStatus.icon;

          return (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{booking.service?.name}</h3>
                      <Badge variant={refundStatus.badge as any}>
                        {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                        {refundStatus.text}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>
                        <strong>Client:</strong> {booking.client?.first_name} {booking.client?.last_name}
                      </div>
                      <div>
                        <strong>Date:</strong> {format(new Date(booking.booking_date), 'PPP', { locale: fr })}
                      </div>
                      <div>
                        <strong>Annulé le:</strong> {format(new Date(booking.cancelled_at), 'PPP', { locale: fr })}
                      </div>
                      <div>
                        <strong>Annulé par:</strong> {booking.cancelled_by === 'client' ? 'Client' : 'Prestataire'}
                      </div>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-md text-sm">
                      <strong>Raison:</strong> {booking.cancellation_reason}
                    </div>

                    <div className="text-lg font-bold text-primary">
                      Montant: {booking.total_price.toFixed(2)}€
                      {booking.payments?.[0]?.refund_amount && (
                        <span className="text-sm text-green-600 ml-2">
                          (Remboursé: {booking.payments[0].refund_amount.toFixed(2)}€)
                        </span>
                      )}
                    </div>
                  </div>

                  {refundStatus.status === 'pending' && booking.payments?.[0]?.stripe_payment_intent_id && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setRefundAmount(booking.total_price.toString());
                          }}
                        >
                          <Euro className="w-4 h-4 mr-2" />
                          Rembourser
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Traiter le remboursement</DialogTitle>
                          <DialogDescription>
                            Effectuer un remboursement pour cette réservation annulée
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="refund-amount">
                              Montant du remboursement (max: {booking.total_price.toFixed(2)}€)
                            </Label>
                            <Input
                              id="refund-amount"
                              type="number"
                              step="0.01"
                              max={booking.total_price}
                              value={refundAmount}
                              onChange={(e) => setRefundAmount(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="refund-reason">Raison du remboursement</Label>
                            <Textarea
                              id="refund-reason"
                              placeholder="Notes administratives..."
                              value={refundReason}
                              onChange={(e) => setRefundReason(e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedBooking(null)}
                            disabled={actionLoading}
                          >
                            Annuler
                          </Button>
                          <Button
                            onClick={processManualRefund}
                            disabled={actionLoading || !refundAmount}
                          >
                            {actionLoading ? 'Traitement...' : 'Confirmer le remboursement'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {bookings.length === 0 && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune réservation annulée</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
