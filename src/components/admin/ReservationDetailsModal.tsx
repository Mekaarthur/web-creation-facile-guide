import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Reservation, FinancialTransaction, Financials } from "./reservation/types";
import { ReservationInfoTab } from "./reservation/ReservationInfoTab";
import { ReservationFinanceTab } from "./reservation/ReservationFinanceTab";
import { ReservationHistoryTab } from "./reservation/ReservationHistoryTab";
import { ReservationProviderTab } from "./reservation/ReservationProviderTab";
import { ReservationActionsTab } from "./reservation/ReservationActionsTab";

interface ReservationDetailsModalProps {
  reservation: Reservation;
  onClose: () => void;
  onUpdate: () => void;
}

export const ReservationDetailsModal = ({ reservation, onClose, onUpdate }: ReservationDetailsModalProps) => {
  const [isMutating, setIsMutating] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [newDate, setNewDate] = useState(reservation.booking_date);
  const [newStartTime, setNewStartTime] = useState(reservation.start_time);
  const [newEndTime, setNewEndTime] = useState(reservation.end_time);
  const { toast } = useToast();

  const { data: financialData } = useQuery({
    queryKey: ['reservation-financial', reservation.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('booking_id', reservation.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return { transaction: null, stripeId: null };

      const { data: paymentData } = await supabase
        .from('payments')
        .select('stripe_payment_intent_id')
        .eq('booking_id', reservation.id)
        .maybeSingle();

      return {
        transaction: data as FinancialTransaction,
        stripeId: paymentData?.stripe_payment_intent_id ?? null,
      };
    },
  });

  const { data: clientHistory = [] } = useQuery({
    queryKey: ['reservation-history', reservation.client_id, reservation.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_date, start_time, status, total_price, services(name)')
        .eq('client_id', reservation.client_id)
        .neq('id', reservation.id)
        .order('booking_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: availableProviders = [] } = useQuery({
    queryKey: ['reservation-providers'],
    enabled: !reservation.provider_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('id, user_id, profiles!providers_user_id_fkey(first_name, last_name)')
        .eq('is_verified', true)
        .eq('status', 'active');
      if (error) throw error;
      return data || [];
    },
  });

  const financialTransaction = financialData?.transaction ?? null;
  const stripePaymentIntentId = financialData?.stripeId ?? null;

  const calculateDuration = () => {
    const start = new Date(`2000-01-01T${reservation.start_time}`);
    const end   = new Date(`2000-01-01T${reservation.end_time}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const calculateFinancials = (): Financials => {
    const duration = calculateDuration();
    const hourlyRate = reservation.hourly_rate || (reservation.total_price / duration);
    const commissionPerHour = Math.round(hourlyRate * 0.28);
    const providerPerHour   = hourlyRate - commissionPerHour;
    return {
      hourlyRate,
      duration,
      commissionPerHour,
      providerPerHour,
      totalClient:     hourlyRate * duration,
      totalProvider:   providerPerHour * duration,
      totalCommission: commissionPerHour * duration,
      commissionPercentage: ((commissionPerHour / hourlyRate) * 100).toFixed(1),
    };
  };

  const handleModifyDateTime = async () => {
    if (reservation.status !== 'pending') {
      toast({ title: "Erreur", description: "Seules les réservations en attente peuvent être modifiées", variant: "destructive" });
      return;
    }
    setIsMutating(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_date: newDate, start_time: newStartTime, end_time: newEndTime })
        .eq('id', reservation.id);
      if (error) throw error;

      await supabase.from('admin_actions_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'booking', entity_id: reservation.id, action_type: 'modified',
        old_data: { booking_date: reservation.booking_date, start_time: reservation.start_time, end_time: reservation.end_time },
        new_data: { booking_date: newDate, start_time: newStartTime, end_time: newEndTime },
        description: 'Date/heure modifiée par admin'
      });

      toast({ title: "Modification enregistrée", description: "Les horaires ont été mis à jour" });
      onUpdate(); onClose();
    } catch {
      toast({ title: "Erreur", description: "Impossible de modifier la réservation", variant: "destructive" });
    } finally {
      setIsMutating(false);
    }
  };

  const handleRefund = async () => {
    if (!financialTransaction) {
      toast({ title: "Erreur", description: "Aucune transaction trouvée", variant: "destructive" });
      return;
    }
    if (!stripePaymentIntentId) {
      toast({ title: "Identifiant Stripe introuvable", description: "Effectuez le remboursement directement dans le dashboard Stripe.", variant: "destructive" });
      return;
    }
    setIsMutating(true);
    try {
      const { data, error } = await supabase.functions.invoke('refund-booking', {
        body: { bookingId: reservation.id, paymentIntentId: stripePaymentIntentId, reason: cancellationReason }
      });
      if (error) throw error;
      toast({ title: "Remboursement effectué", description: `Montant remboursé: ${data.refundAmount}€ (${data.refundPercentage}%)` });
      onUpdate(); onClose();
    } catch {
      toast({ title: "Erreur", description: "Impossible de traiter le remboursement", variant: "destructive" });
    } finally {
      setIsMutating(false);
    }
  };

  const handleApprove = async () => {
    setIsMutating(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', reservation.id);
      if (error) throw error;

      await supabase.from('admin_actions_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'booking', entity_id: reservation.id, action_type: 'approved',
        old_data: { status: reservation.status }, new_data: { status: 'confirmed' },
        description: 'Réservation approuvée par admin'
      });

      await supabase.from('notifications').insert({
        user_id: reservation.client_id,
        title: 'Réservation confirmée',
        message: `Votre réservation du ${new Date(reservation.booking_date).toLocaleDateString('fr-FR')} a été confirmée.`,
        type: 'booking_confirmed'
      });

      toast({ title: "Réservation approuvée", description: "La réservation a été confirmée avec succès" });
      onUpdate(); onClose();
    } catch {
      toast({ title: "Erreur", description: "Impossible d'approuver la réservation", variant: "destructive" });
    } finally {
      setIsMutating(false);
    }
  };

  const handleAssignProvider = async () => {
    if (!selectedProvider) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un prestataire", variant: "destructive" });
      return;
    }
    setIsMutating(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ provider_id: selectedProvider, status: 'assigned', assigned_at: new Date().toISOString() })
        .eq('id', reservation.id);
      if (error) throw error;

      await supabase.from('admin_actions_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'booking', entity_id: reservation.id, action_type: 'provider_assigned',
        old_data: { provider_id: reservation.provider_id }, new_data: { provider_id: selectedProvider },
        description: 'Prestataire assigné manuellement'
      });

      const { data: providerData } = await supabase
        .from('providers').select('user_id').eq('id', selectedProvider).single();
      if (providerData?.user_id) {
        await supabase.from('notifications').insert({
          user_id: providerData.user_id,
          title: 'Nouvelle mission assignée',
          message: `Une nouvelle mission vous a été assignée pour le ${new Date(reservation.booking_date).toLocaleDateString('fr-FR')}.`,
          type: 'booking_assigned'
        });
      }

      toast({ title: "Prestataire assigné", description: "Le prestataire a été assigné avec succès" });
      onUpdate(); onClose();
    } catch {
      toast({ title: "Erreur", description: "Impossible d'assigner le prestataire", variant: "destructive" });
    } finally {
      setIsMutating(false);
    }
  };

  const handleConvertToMission = async () => {
    if (!reservation.provider_id) {
      toast({ title: "Erreur", description: "Veuillez d'abord assigner un prestataire", variant: "destructive" });
      return;
    }
    setIsMutating(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'in_progress', mission_started_at: new Date().toISOString() })
        .eq('id', reservation.id);
      if (error) throw error;

      await supabase.from('admin_actions_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: 'booking', entity_id: reservation.id, action_type: 'converted_to_mission',
        description: 'Réservation convertie en mission active'
      });

      const { data: providerData } = await supabase
        .from('providers').select('user_id').eq('id', reservation.provider_id).single();
      if (providerData?.user_id) {
        await supabase.from('notifications').insert({
          user_id: providerData.user_id,
          title: 'Mission démarrée',
          message: `Votre mission du ${new Date(reservation.booking_date).toLocaleDateString('fr-FR')} est maintenant active.`,
          type: 'mission_started'
        });
      }

      toast({ title: "Convertie en mission", description: "La réservation est maintenant une mission active. Le prestataire a été notifié." });
      onUpdate(); onClose();
    } catch {
      toast({ title: "Erreur", description: "Impossible de convertir en mission", variant: "destructive" });
    } finally {
      setIsMutating(false);
    }
  };

  const financials = calculateFinancials();

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
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="finance">Finances</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="provider">Prestataire</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <ReservationInfoTab reservation={reservation} financials={financials} />

          <ReservationFinanceTab financials={financials} financialTransaction={financialTransaction} />

          <ReservationHistoryTab clientHistory={clientHistory} />

          <ReservationProviderTab
            reservation={reservation}
            availableProviders={availableProviders}
            selectedProvider={selectedProvider}
            setSelectedProvider={setSelectedProvider}
            isLoading={isMutating}
            handleAssignProvider={handleAssignProvider}
          />

          <ReservationActionsTab
            reservation={reservation}
            financialTransaction={financialTransaction}
            stripePaymentIntentId={stripePaymentIntentId}
            isLoading={isMutating}
            cancellationReason={cancellationReason}
            setCancellationReason={setCancellationReason}
            newDate={newDate}
            setNewDate={setNewDate}
            newStartTime={newStartTime}
            setNewStartTime={setNewStartTime}
            newEndTime={newEndTime}
            setNewEndTime={setNewEndTime}
            handleModifyDateTime={handleModifyDateTime}
            handleApprove={handleApprove}
            handleConvertToMission={handleConvertToMission}
            handleRefund={handleRefund}
          />
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
