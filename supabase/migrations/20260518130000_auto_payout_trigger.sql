-- Trigger : quand une réservation passe à 'completed', marquer la transaction
-- financière comme prête pour virement prestataire (si le client a déjà payé).
CREATE OR REPLACE FUNCTION public.auto_queue_provider_payout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE public.financial_transactions
    SET
      payment_status = 'ready_for_payout',
      updated_at     = now()
    WHERE booking_id    = NEW.id
      AND payment_status = 'paid';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_completion_payout_trigger ON public.bookings;
CREATE TRIGGER booking_completion_payout_trigger
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.auto_queue_provider_payout();
