import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  User, 
  MapPin, 
  Calendar, 
  Clock,
  FileText,
  CreditCard,
  Ban
} from "lucide-react";

interface Mission {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  address: string | null;
  total_price: number;
  status: string;
  created_at: string;
  client_id: string;
  provider_id: string | null;
  service_id: string;
  notes?: string | null;
  cancellation_reason?: string | null;
  services: {
    name: string;
    category: string;
  } | null;
  client_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  provider_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface MissionDetailsModalProps {
  mission: Mission;
  onClose: () => void;
  onUpdate: () => void;
}

export const MissionDetailsModal = ({ mission, onClose, onUpdate }: MissionDetailsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const { toast } = useToast();

  const calculateCommission = (totalPrice: number) => {
    return (totalPrice * 0.28).toFixed(2);
  };

  const calculateProviderPayment = (totalPrice: number) => {
    return (totalPrice * 0.72).toFixed(2);
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (newStatus === 'cancelled' && cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancelled_by = 'admin';
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', mission.id);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'booking',
        entity_id: mission.id,
        action_type: 'status_change',
        old_data: { status: mission.status },
        new_data: { status: newStatus },
        description: `Changement de statut: ${mission.status} → ${newStatus}`
      });

      // Send notification to client
      await supabase.from('notifications').insert({
        user_id: mission.client_id,
        title: `Mission ${newStatus === 'completed' ? 'terminée' : newStatus === 'cancelled' ? 'annulée' : 'mise à jour'}`,
        message: `Votre mission du ${new Date(mission.booking_date).toLocaleDateString('fr-FR')} a été ${newStatus === 'completed' ? 'marquée comme terminée' : newStatus === 'cancelled' ? 'annulée' : 'mise à jour'}.`,
        type: newStatus === 'completed' ? 'mission_completed' : newStatus === 'cancelled' ? 'booking_cancelled' : 'booking_update'
      });

      toast({
        title: "Statut mis à jour",
        description: `La mission est maintenant : ${newStatus}`,
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating mission:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidatePayment = async () => {
    setIsLoading(true);
    try {
      // Update mission status to paid
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'paid' })
        .eq('id', mission.id);

      if (bookingError) throw bookingError;

      // Create financial transaction record
      const { error: transactionError } = await supabase
        .from('financial_transactions')
        .insert({
          booking_id: mission.id,
          client_id: mission.client_id,
          provider_id: mission.provider_id || '',
          service_category: mission.services?.category || 'other',
          client_price: mission.total_price,
          provider_payment: Number(calculateProviderPayment(mission.total_price)),
          company_commission: Number(calculateCommission(mission.total_price)),
          payment_status: 'completed',
          client_paid_at: new Date().toISOString(),
          provider_paid_at: new Date().toISOString()
        });

      if (transactionError) throw transactionError;

      // Log admin action
      await supabase.from('admin_actions_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'booking',
        entity_id: mission.id,
        action_type: 'payment_validated',
        description: `Paiement validé pour la mission - ${mission.total_price}€`
      });

      // Notify provider
      if (mission.provider_id) {
        const { data: providerData } = await supabase
          .from('providers')
          .select('user_id')
          .eq('id', mission.provider_id)
          .single();

        if (providerData?.user_id) {
          await supabase.from('notifications').insert({
            user_id: providerData.user_id,
            title: 'Paiement validé',
            message: `Le paiement de ${calculateProviderPayment(mission.total_price)}€ pour votre mission du ${new Date(mission.booking_date).toLocaleDateString('fr-FR')} a été validé.`,
            type: 'payment_received'
          });
        }
      }

      toast({
        title: "Paiement validé",
        description: "Le paiement au prestataire a été traité",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error validating payment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider le paiement",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de la mission</DialogTitle>
          <DialogDescription>
            Mission N° {mission.id.substring(0, 8)} - {mission.services?.name || 'Service'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="finance">Finances</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Informations générales</span>
                  <Badge>{mission.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Service</Label>
                    <p className="font-medium">{mission.services?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{mission.services?.category || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <p className="font-medium">
                        {new Date(mission.booking_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Horaires</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <p className="font-medium">
                        {mission.start_time} - {mission.end_time}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Adresse</Label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <p className="font-medium">{mission.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="font-medium">
                    {mission.client_profile?.first_name || ''} {mission.client_profile?.last_name || ''}
                  </p>
                  <p className="text-sm text-muted-foreground">{mission.client_profile?.email || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Prestataire
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mission.provider_profile ? (
                  <div>
                    <p className="font-medium">
                      {mission.provider_profile.first_name || ''} {mission.provider_profile.last_name || ''}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun prestataire assigné</p>
                )}
              </CardContent>
            </Card>

            {mission.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{mission.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="finance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Répartition financière
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Montant total</p>
                    <p className="text-2xl font-bold">{mission.total_price.toFixed(2)}€</p>
                    <p className="text-xs text-muted-foreground">Payé par le client</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg bg-primary/5">
                    <p className="text-sm text-muted-foreground mb-1">Commission Bikawo</p>
                    <p className="text-2xl font-bold text-primary">
                      {calculateCommission(mission.total_price)}€
                    </p>
                    <p className="text-xs text-muted-foreground">28% du total</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                    <p className="text-sm text-muted-foreground mb-1">Revenu prestataire</p>
                    <p className="text-2xl font-bold text-green-600">
                      {calculateProviderPayment(mission.total_price)}€
                    </p>
                    <p className="text-xs text-muted-foreground">72% du total</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Statut du paiement</p>
                      <p className="text-sm text-muted-foreground">
                        {mission.status === 'paid' ? 'Paiement effectué au prestataire' : 'En attente de validation'}
                      </p>
                    </div>
                    <Badge variant={mission.status === 'paid' ? 'default' : 'outline'}>
                      {mission.status === 'paid' ? 'Payé' : 'En attente'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique de la mission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 pb-3 border-b">
                    <div className="bg-muted rounded-full p-2 mt-1">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Mission créée</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(mission.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  {mission.status === 'completed' && (
                    <div className="flex items-start gap-3 pb-3 border-b">
                      <div className="bg-green-100 dark:bg-green-950 rounded-full p-2 mt-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Mission terminée</p>
                        <p className="text-sm text-muted-foreground">Par le prestataire</p>
                      </div>
                    </div>
                  )}
                  {mission.status === 'cancelled' && mission.cancellation_reason && (
                    <div className="flex items-start gap-3">
                      <div className="bg-destructive/10 rounded-full p-2 mt-1">
                        <Ban className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Mission annulée</p>
                        <p className="text-sm text-muted-foreground">{mission.cancellation_reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions administrateur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mission.status !== 'completed' && mission.status !== 'cancelled' && (
                  <>
                    <Button
                      onClick={() => handleStatusChange('completed')}
                      disabled={isLoading}
                      className="w-full"
                      variant="default"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marquer comme terminée
                    </Button>

                    <div className="space-y-2">
                      <Label htmlFor="cancellation">Annuler la mission</Label>
                      <Textarea
                        id="cancellation"
                        placeholder="Raison de l'annulation (obligatoire)"
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        rows={3}
                      />
                      <Button
                        onClick={() => handleStatusChange('cancelled')}
                        disabled={isLoading || !cancellationReason}
                        className="w-full"
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Annuler la mission
                      </Button>
                    </div>
                  </>
                )}

                {mission.status === 'completed' && (
                  <Button
                    onClick={handleValidatePayment}
                    disabled={isLoading}
                    className="w-full"
                    variant="default"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Valider le paiement au prestataire
                  </Button>
                )}

                {mission.status === 'paid' && (
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-medium text-green-600">Mission terminée et payée</p>
                    <p className="text-sm text-muted-foreground">Aucune action nécessaire</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
