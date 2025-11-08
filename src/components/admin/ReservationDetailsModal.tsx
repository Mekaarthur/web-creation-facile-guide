import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Repeat,
  Target
} from "lucide-react";

interface Reservation {
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

interface ReservationDetailsModalProps {
  reservation: Reservation;
  onClose: () => void;
  onUpdate: () => void;
}

export const ReservationDetailsModal = ({ reservation, onClose, onUpdate }: ReservationDetailsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const { toast } = useToast();

  // Charger les prestataires au montage si pas déjà assigné
  useEffect(() => {
    if (!reservation.provider_id) {
      loadAvailableProviders();
    }
  }, [reservation.provider_id]);

  const calculateCommission = (totalPrice: number) => {
    return (totalPrice * 0.28).toFixed(2);
  };

  const calculateProviderPayment = (totalPrice: number) => {
    return (totalPrice * 0.72).toFixed(2);
  };

  const loadAvailableProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('id, user_id, profiles!providers_user_id_fkey(first_name, last_name)')
        .eq('is_verified', true)
        .eq('status', 'active');

      if (error) throw error;
      setAvailableProviders(data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  };

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', reservation.id);

      if (error) throw error;

      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'booking',
        entity_id: reservation.id,
        action_type: 'approved',
        old_data: { status: reservation.status },
        new_data: { status: 'confirmed' },
        description: 'Réservation approuvée par admin'
      });

      // Notify client
      await supabase.from('notifications').insert({
        user_id: reservation.client_id,
        title: 'Réservation confirmée',
        message: `Votre réservation du ${new Date(reservation.booking_date).toLocaleDateString('fr-FR')} a été confirmée.`,
        type: 'booking_confirmed'
      });

      toast({
        title: "Réservation approuvée",
        description: "La réservation a été confirmée avec succès",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error approving reservation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver la réservation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignProvider = async () => {
    if (!selectedProvider) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un prestataire",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          provider_id: selectedProvider,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        })
        .eq('id', reservation.id);

      if (error) throw error;

      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'booking',
        entity_id: reservation.id,
        action_type: 'provider_assigned',
        old_data: { provider_id: reservation.provider_id },
        new_data: { provider_id: selectedProvider },
        description: 'Prestataire assigné manuellement'
      });

      // Notify provider
      const { data: providerData } = await supabase
        .from('providers')
        .select('user_id')
        .eq('id', selectedProvider)
        .single();

      if (providerData?.user_id) {
        await supabase.from('notifications').insert({
          user_id: providerData.user_id,
          title: 'Nouvelle mission assignée',
          message: `Une nouvelle mission vous a été assignée pour le ${new Date(reservation.booking_date).toLocaleDateString('fr-FR')}.`,
          type: 'booking_assigned'
        });
      }

      toast({
        title: "Prestataire assigné",
        description: "Le prestataire a été assigné avec succès",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error assigning provider:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le prestataire",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancellationReason) {
      toast({
        title: "Erreur",
        description: "Veuillez indiquer une raison d'annulation",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancellation_reason: cancellationReason,
          cancelled_at: new Date().toISOString(),
          cancelled_by: 'admin'
        })
        .eq('id', reservation.id);

      if (error) throw error;

      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'booking',
        entity_id: reservation.id,
        action_type: 'cancelled',
        old_data: { status: reservation.status },
        new_data: { status: 'cancelled', reason: cancellationReason },
        description: `Réservation annulée: ${cancellationReason}`
      });

      // Notify client
      await supabase.from('notifications').insert({
        user_id: reservation.client_id,
        title: 'Réservation annulée',
        message: `Votre réservation a été annulée. Raison: ${cancellationReason}`,
        type: 'booking_cancelled'
      });

      toast({
        title: "Réservation annulée",
        description: "La réservation a été annulée",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la réservation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToMission = async () => {
    setIsLoading(true);
    try {
      // La réservation devient automatiquement une mission
      // On met juste à jour le statut pour indiquer que c'est maintenant une mission active
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'in_progress'
        })
        .eq('id', reservation.id);

      if (error) throw error;

      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'booking',
        entity_id: reservation.id,
        action_type: 'converted_to_mission',
        description: 'Réservation convertie en mission active'
      });

      toast({
        title: "Convertie en mission",
        description: "La réservation est maintenant une mission active",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error converting to mission:', error);
      toast({
        title: "Erreur",
        description: "Impossible de convertir en mission",
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
          <DialogTitle>Détails de la réservation</DialogTitle>
          <DialogDescription>
            N° {reservation.id.substring(0, 8)} - {reservation.services?.name || 'Service'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="finance">Finances</TabsTrigger>
            <TabsTrigger value="provider">Prestataire</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Informations générales</span>
                  <Badge>{reservation.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Service</Label>
                    <p className="font-medium">{reservation.services?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{reservation.services?.category || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <p className="font-medium">
                        {new Date(reservation.booking_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Horaires</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <p className="font-medium">
                        {reservation.start_time} - {reservation.end_time}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Adresse</Label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <p className="font-medium">{reservation.address || 'N/A'}</p>
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
                <div className="space-y-2">
                  <p className="font-medium">
                    {reservation.client_profile?.first_name || ''} {reservation.client_profile?.last_name || ''}
                  </p>
                  <p className="text-sm text-muted-foreground">{reservation.client_profile?.email || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {reservation.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notes du client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{reservation.notes}</p>
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
                    <p className="text-2xl font-bold">{reservation.total_price.toFixed(2)}€</p>
                    <p className="text-xs text-muted-foreground">Payé par le client</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg bg-primary/5">
                    <p className="text-sm text-muted-foreground mb-1">Commission Bikawo</p>
                    <p className="text-2xl font-bold text-primary">
                      {calculateCommission(reservation.total_price)}€
                    </p>
                    <p className="text-xs text-muted-foreground">28% du total</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                    <p className="text-sm text-muted-foreground mb-1">Revenu prestataire</p>
                    <p className="text-2xl font-bold text-green-600">
                      {calculateProviderPayment(reservation.total_price)}€
                    </p>
                    <p className="text-xs text-muted-foreground">72% du total</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mode de paiement</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Stripe / Carte bancaire
                      </p>
                    </div>
                    <Badge variant="outline">En attente</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="provider" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignation prestataire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reservation.provider_profile ? (
                  <div>
                    <Label className="text-muted-foreground">Prestataire assigné</Label>
                    <p className="font-medium">
                      {reservation.provider_profile.first_name} {reservation.provider_profile.last_name}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Label>Sélectionner un prestataire</Label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un prestataire..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProviders.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.profiles?.first_name} {provider.profiles?.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleAssignProvider}
                      disabled={isLoading || !selectedProvider}
                      className="w-full"
                    >
                      Assigner ce prestataire
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions administrateur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reservation.status === 'pending' && (
                  <Button
                    onClick={handleApprove}
                    disabled={isLoading}
                    className="w-full"
                    variant="default"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approuver / Valider la réservation
                  </Button>
                )}

                {reservation.status === 'confirmed' && reservation.provider_id && (
                  <Button
                    onClick={handleConvertToMission}
                    disabled={isLoading}
                    className="w-full"
                    variant="default"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Convertir en mission active
                  </Button>
                )}

                {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
                  <div className="space-y-2">
                    <Label htmlFor="cancellation">Annuler la réservation</Label>
                    <Textarea
                      id="cancellation"
                      placeholder="Raison de l'annulation (obligatoire)"
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      rows={3}
                    />
                    <Button
                      onClick={handleCancel}
                      disabled={isLoading || !cancellationReason}
                      className="w-full"
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Annuler la réservation
                    </Button>
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
