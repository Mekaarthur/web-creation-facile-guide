import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  Target,
  Mail,
  Phone,
  History,
  RefreshCw,
  ExternalLink
} from "lucide-react";

interface Reservation {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  address: string | null;
  total_price: number;
  hourly_rate: number | null;
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
    base_price?: number;
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

interface FinancialTransaction {
  id: string;
  payment_status: string;
  client_paid_at: string | null;
  provider_paid_at: string | null;
  client_price: number;
  provider_payment: number;
  company_commission: number;
}

export const ReservationDetailsModal = ({ reservation, onClose, onUpdate }: ReservationDetailsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [financialTransaction, setFinancialTransaction] = useState<FinancialTransaction | null>(null);
  const [newDate, setNewDate] = useState(reservation.booking_date);
  const [newStartTime, setNewStartTime] = useState(reservation.start_time);
  const [newEndTime, setNewEndTime] = useState(reservation.end_time);
  const { toast } = useToast();

  useEffect(() => {
    if (!reservation.provider_id) {
      loadAvailableProviders();
    }
    loadClientHistory();
    loadFinancialTransaction();
  }, [reservation.provider_id, reservation.client_id, reservation.id]);

  // Nouveau modèle de commission: markup fixe de 5€
  const calculateFinancials = (basePrice: number) => {
    const markup = 5; // 5€ de markup
    const clientPrice = basePrice + markup;
    const providerPayment = basePrice;
    const bikawoCommission = markup;
    
    return {
      clientPrice,
      providerPayment,
      bikawoCommission,
      markupPercentage: ((markup / basePrice) * 100).toFixed(1)
    };
  };

  const loadFinancialTransaction = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('booking_id', reservation.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore "not found" error
        console.error('Error loading transaction:', error);
      } else if (data) {
        setFinancialTransaction(data);
      }
    } catch (error) {
      console.error('Error loading transaction:', error);
    }
  };

  const loadClientHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          status,
          total_price,
          services(name)
        `)
        .eq('client_id', reservation.client_id)
        .neq('id', reservation.id)
        .order('booking_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      setClientHistory(data || []);
    } catch (error) {
      console.error('Error loading client history:', error);
    }
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

  const handleModifyDateTime = async () => {
    if (reservation.status !== 'pending') {
      toast({
        title: "Erreur",
        description: "Seules les réservations en attente peuvent être modifiées",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          booking_date: newDate,
          start_time: newStartTime,
          end_time: newEndTime
        })
        .eq('id', reservation.id);

      if (error) throw error;

      await supabase.from('admin_actions_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'booking',
        entity_id: reservation.id,
        action_type: 'modified',
        old_data: { 
          booking_date: reservation.booking_date, 
          start_time: reservation.start_time,
          end_time: reservation.end_time
        },
        new_data: { 
          booking_date: newDate, 
          start_time: newStartTime,
          end_time: newEndTime
        },
        description: 'Date/heure modifiée par admin'
      });

      toast({
        title: "Modification enregistrée",
        description: "Les horaires ont été mis à jour",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error modifying booking:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la réservation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!financialTransaction) {
      toast({
        title: "Erreur",
        description: "Aucune transaction trouvée",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('refund-booking', {
        body: {
          bookingId: reservation.id,
          paymentIntentId: financialTransaction.id,
          reason: cancellationReason
        }
      });

      if (error) throw error;

      toast({
        title: "Remboursement effectué",
        description: `Montant remboursé: ${data.refundAmount}€ (${data.refundPercentage}%)`,
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter le remboursement",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

      await supabase.from('admin_actions_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'booking',
        entity_id: reservation.id,
        action_type: 'approved',
        old_data: { status: reservation.status },
        new_data: { status: 'confirmed' },
        description: 'Réservation approuvée par admin'
      });

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

      await supabase.from('admin_actions_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'booking',
        entity_id: reservation.id,
        action_type: 'provider_assigned',
        old_data: { provider_id: reservation.provider_id },
        new_data: { provider_id: selectedProvider },
        description: 'Prestataire assigné manuellement'
      });

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

      await supabase.from('admin_actions_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'booking',
        entity_id: reservation.id,
        action_type: 'cancelled',
        old_data: { status: reservation.status },
        new_data: { status: 'cancelled', reason: cancellationReason },
        description: `Réservation annulée: ${cancellationReason}`
      });

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
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'in_progress'
        })
        .eq('id', reservation.id);

      if (error) throw error;

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

  const basePrice = reservation.services?.base_price || reservation.total_price - 5;
  const financials = calculateFinancials(basePrice);

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="finance">Finances</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
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
                    <Label className="text-muted-foreground">Durée</Label>
                    <p className="font-medium">
                      {(() => {
                        const start = new Date(`2000-01-01T${reservation.start_time}`);
                        const end = new Date(`2000-01-01T${reservation.end_time}`);
                        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                        return `${hours}h`;
                      })()}
                    </p>
                  </div>
                  {reservation.hourly_rate && (
                    <div>
                      <Label className="text-muted-foreground">Prix horaire</Label>
                      <p className="font-medium">{reservation.hourly_rate.toFixed(2)}€/h</p>
                    </div>
                  )}
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
                <div className="space-y-3">
                  <p className="font-medium">
                    {reservation.client_profile?.first_name || ''} {reservation.client_profile?.last_name || ''}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${reservation.client_profile?.email}`} className="text-primary hover:underline">
                      {reservation.client_profile?.email || 'N/A'}
                    </a>
                  </div>
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
                    <p className="text-sm text-muted-foreground mb-1">Prix service</p>
                    <p className="text-xl font-bold">{basePrice.toFixed(2)}€</p>
                    <p className="text-xs text-muted-foreground">Prix de base</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg bg-primary/5">
                    <p className="text-sm text-muted-foreground mb-1">Client paye</p>
                    <p className="text-2xl font-bold text-primary">
                      {financials.clientPrice.toFixed(2)}€
                    </p>
                    <p className="text-xs text-muted-foreground">+5€ markup</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                    <p className="text-sm text-muted-foreground mb-1">Prestataire reçoit</p>
                    <p className="text-2xl font-bold text-green-600">
                      {financials.providerPayment.toFixed(2)}€
                    </p>
                    <p className="text-xs text-muted-foreground">Prix service</p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Commission Bikawo</p>
                  <p className="text-2xl font-bold text-amber-600">{financials.bikawoCommission.toFixed(2)}€</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Markup fixe de 5€ ({financials.markupPercentage}% du service)
                  </p>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mode de paiement</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Stripe / Carte bancaire
                      </p>
                    </div>
                    <Badge variant={
                      financialTransaction?.payment_status === 'paid' ? 'default' :
                      financialTransaction?.payment_status === 'pending' ? 'secondary' : 'outline'
                    }>
                      {financialTransaction?.payment_status === 'paid' ? 'Payé' :
                       financialTransaction?.payment_status === 'pending' ? 'En attente' : 'Non payé'}
                    </Badge>
                  </div>

                  {financialTransaction && (
                    <>
                      {financialTransaction.client_paid_at && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Date paiement client: </span>
                          <span className="font-medium">
                            {new Date(financialTransaction.client_paid_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-muted-foreground">ID transaction: </span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {financialTransaction.id.substring(0, 16)}...
                        </code>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historique du client
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientHistory.length > 0 ? (
                  <div className="space-y-3">
                    {clientHistory.map((booking) => (
                      <div key={booking.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{booking.services?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(booking.booking_date).toLocaleDateString('fr-FR')} à {booking.start_time}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{booking.status}</Badge>
                          <p className="text-sm font-medium mt-1">{booking.total_price.toFixed(2)}€</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun historique trouvé pour ce client
                  </p>
                )}
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
            {/* Modifier date/heure */}
            {reservation.status === 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Modifier date et horaires
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Date</Label>
                      <Input 
                        type="date" 
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Heure début</Label>
                      <Input 
                        type="time" 
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Heure fin</Label>
                      <Input 
                        type="time" 
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={handleModifyDateTime} disabled={isLoading} className="w-full">
                    <Clock className="mr-2 h-4 w-4" />
                    Enregistrer les modifications
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contacter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = `mailto:${reservation.client_profile?.email}`}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer un email au client
                </Button>
                {reservation.provider_profile && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {/* TODO: Implement provider email */}}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Envoyer un email au prestataire
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Actions admin */}
            <Card>
              <CardHeader>
                <CardTitle>Actions administrateur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reservation.status === 'pending' && (
                  <Button 
                    onClick={handleApprove} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approuver la réservation
                  </Button>
                )}

                {reservation.status === 'confirmed' && (
                  <Button 
                    onClick={handleConvertToMission} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Repeat className="mr-2 h-4 w-4" />
                    Convertir en mission active
                  </Button>
                )}

                {financialTransaction && financialTransaction.payment_status === 'paid' && (
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`https://dashboard.stripe.com/payments/${financialTransaction.id}`, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Voir paiement Stripe
                  </Button>
                )}

                {reservation.status !== 'cancelled' && (
                  <>
                    <div className="border-t pt-3">
                      <Label>Annuler et rembourser</Label>
                      <Textarea
                        placeholder="Raison de l'annulation (obligatoire)..."
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <Button 
                      variant="destructive"
                      onClick={handleRefund}
                      disabled={isLoading || !cancellationReason}
                      className="w-full"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Annuler et rembourser
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
