-- Fonction pour check-in/check-out des missions
CREATE OR REPLACE FUNCTION public.mission_checkin(
  booking_id UUID,
  location_info TEXT DEFAULT NULL,
  photos TEXT[] DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.bookings
  SET 
    started_at = now(),
    check_in_location = location_info,
    before_photos = photos,
    status = 'in_progress'
  WHERE id = booking_id;
  
  -- Notifier le client du début de mission
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type
  )
  SELECT 
    client_id,
    'Prestation commencée',
    'Votre prestataire a commencé la prestation.',
    'mission_started'
  FROM public.bookings
  WHERE id = booking_id;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.mission_checkout(
  booking_id UUID,
  location_info TEXT DEFAULT NULL,
  photos TEXT[] DEFAULT NULL,
  notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.bookings
  SET 
    completed_at = now(),
    check_out_location = location_info,
    after_photos = photos,
    provider_notes = notes,
    status = 'completed'
  WHERE id = booking_id;
  
  -- Notifier le client de la fin de mission
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type
  )
  SELECT 
    client_id,
    'Prestation terminée',
    'Votre prestation est terminée. Nous vous invitons à laisser un avis.',
    'mission_completed'
  FROM public.bookings
  WHERE id = booking_id;
  
  RETURN TRUE;
END;
$$;