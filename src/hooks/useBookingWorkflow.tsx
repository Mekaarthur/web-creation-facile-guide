import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CancellationPolicy {
  moreThan24h: number;    // 100% remboursement
  between24hAnd2h: number; // 50% remboursement
  lessThan2h: number;      // 0% remboursement
}

const DEFAULT_POLICY: CancellationPolicy = {
  moreThan24h: 100,
  between24hAnd2h: 50,
  lessThan2h: 0
};

export const useBookingWorkflow = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const calculateRefundAmount = (
    bookingDate: string,
    startTime: string,
    totalPrice: number,
    policy: CancellationPolicy = DEFAULT_POLICY
  ): { refundAmount: number; refundPercentage: number } => {
    const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursUntilBooking > 24) {
      refundPercentage = policy.moreThan24h;
    } else if (hoursUntilBooking >= 2) {
      refundPercentage = policy.between24hAnd2h;
    } else {
      refundPercentage = policy.lessThan2h;
    }

    const refundAmount = (totalPrice * refundPercentage) / 100;
    return { refundAmount, refundPercentage };
  };

  // Raisons autorisant un remboursement (politique stricte : remboursement = dernier recours)
  export type RefundReason =
    | 'client_refuses_all_alternatives'
    | 'no_replacement_found_48h'
    | 'client_initiated_cancellation'
    | 'admin_manual_override';

  const cancelBooking = async (
    bookingId: string,
    reason: string,
    cancelledBy: 'client' | 'provider' | 'admin',
    refundReason?: RefundReason
  ) => {
    setLoading(true);
    try {
      // Récupérer les détails de la réservation
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*, payments(id, stripe_payment_intent_id, amount)')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Calculer le remboursement potentiel
      const { refundAmount, refundPercentage } = calculateRefundAmount(
        booking.booking_date,
        booking.start_time,
        booking.total_price
      );

      // Auto-déduire la refundReason quand l'annulation vient du client
      const finalRefundReason: RefundReason | undefined =
        refundReason ?? (cancelledBy === 'client' ? 'client_initiated_cancellation' : undefined);

      // Appeler l'edge function (gère remplaçant + politique de remboursement)
      const { data, error } = await supabase.functions.invoke('handle-cancellation', {
        body: {
          bookingId,
          reason,
          cancelledBy,
          refundAmount,
          refundPercentage,
          refundReason: finalRefundReason
        }
      });

      if (error) throw error;

      // Toast adapté à la réponse de l'edge function
      if (data?.replacementFound) {
        toast({
          title: "Mission maintenue",
          description: "Un nouveau prestataire a été assigné au même créneau.",
        });
      } else if (data?.alternativesProposed) {
        toast({
          title: "Alternatives proposées",
          description: data?.voucherIssued
            ? "Choisissez un nouveau créneau ou utilisez votre bon de réduction de 20%."
            : "Consultez les créneaux alternatifs avant tout remboursement.",
        });
      } else if (data?.refundProcessed) {
        toast({
          title: "Réservation annulée",
          description: `Remboursement de ${refundAmount.toFixed(2)}€ (${refundPercentage}%) en cours.`,
        });
      } else {
        toast({
          title: "Réservation annulée",
          description: "Aucun remboursement applicable selon les conditions.",
        });
      }

      return { 
        success: true, 
        refundAmount: data?.refundAmount ?? 0, 
        refundPercentage: data?.refundPercentage ?? 0,
        replacementFound: data?.replacementFound ?? false,
        alternativesProposed: data?.alternativesProposed ?? false
      };
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la réservation",
        variant: "destructive",
      });
      return { success: false, refundAmount: 0, refundPercentage: 0 };
    } finally {
      setLoading(false);
    }
  };

  const requestBookingModification = async (
    bookingId: string,
    newDate?: string,
    newStartTime?: string,
    newDuration?: number
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          booking_date: newDate,
          start_time: newStartTime,
          duration_hours: newDuration,
          status: 'pending', // Repasse en attente de confirmation
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Modification demandée",
        description: "Le prestataire doit confirmer les nouveaux horaires",
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la réservation",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    cancelBooking,
    calculateRefundAmount,
    requestBookingModification
  };
};
