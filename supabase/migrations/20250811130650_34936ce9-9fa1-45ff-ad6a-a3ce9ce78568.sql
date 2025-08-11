-- Créer le trigger pour l'assignation automatique
DROP TRIGGER IF EXISTS trigger_auto_assign_booking ON public.bookings;
CREATE TRIGGER trigger_auto_assign_booking
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_booking();

-- Fonction pour gérer les confirmations de prestataires
CREATE OR REPLACE FUNCTION public.confirm_booking(
  booking_id UUID,
  provider_confirms BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  booking_record RECORD;
BEGIN
  -- Récupérer les détails de la réservation
  SELECT * INTO booking_record
  FROM public.bookings
  WHERE id = booking_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  IF provider_confirms THEN
    -- Confirmer la réservation
    UPDATE public.bookings
    SET status = 'confirmed', confirmed_at = now()
    WHERE id = booking_id;
    
    -- Notifier le client
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type
    ) VALUES (
      booking_record.client_id,
      'Prestation confirmée',
      'Votre prestataire a confirmé sa disponibilité pour votre prestation.',
      'booking_confirmed'
    );
  ELSE
    -- Rejeter et relancer l'assignation
    UPDATE public.bookings
    SET provider_id = NULL, status = 'pending', assigned_at = NULL
    WHERE id = booking_id;
    
    -- Notifier le client du changement
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type
    ) VALUES (
      booking_record.client_id,
      'Recherche d''un nouveau prestataire',
      'Nous recherchons un autre prestataire disponible pour votre demande.',
      'provider_changed'
    );
  END IF;
  
  RETURN TRUE;
END;
$$;