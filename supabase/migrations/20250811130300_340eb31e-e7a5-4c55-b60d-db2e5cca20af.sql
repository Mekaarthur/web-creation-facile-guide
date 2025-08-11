-- Mise à jour des statuts pour le workflow complet
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS check_in_location TEXT,
ADD COLUMN IF NOT EXISTS check_out_location TEXT,
ADD COLUMN IF NOT EXISTS before_photos TEXT[],
ADD COLUMN IF NOT EXISTS after_photos TEXT[],
ADD COLUMN IF NOT EXISTS provider_notes TEXT;

-- Fonction pour distribuer automatiquement les tâches aux prestataires
CREATE OR REPLACE FUNCTION public.auto_assign_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  best_provider_id UUID;
  provider_user_id UUID;
BEGIN
  -- Ne traiter que les nouvelles réservations
  IF NEW.status = 'pending' AND OLD.provider_id IS NULL AND NEW.provider_id IS NULL THEN
    -- Trouver le meilleur prestataire disponible
    SELECT p.id INTO best_provider_id
    FROM public.providers p
    WHERE p.is_verified = true
      AND p.location IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.provider_services ps
        WHERE ps.provider_id = p.id 
        AND ps.service_id = NEW.service_id
        AND ps.is_active = true
      )
    ORDER BY 
      p.rating DESC NULLS LAST,
      p.acceptance_rate DESC NULLS LAST,
      p.missions_completed DESC,
      RANDOM()
    LIMIT 1;
    
    -- Si un prestataire est trouvé, l'assigner
    IF best_provider_id IS NOT NULL THEN
      NEW.provider_id := best_provider_id;
      NEW.assigned_at := now();
      NEW.status := 'assigned';
      
      -- Obtenir l'user_id du prestataire pour la notification
      SELECT user_id INTO provider_user_id
      FROM public.providers 
      WHERE id = best_provider_id;
      
      -- Créer une notification pour le prestataire
      INSERT INTO public.provider_notifications (
        provider_id,
        booking_id,
        title,
        message,
        type
      ) VALUES (
        best_provider_id,
        NEW.id,
        'Nouvelle mission assignée',
        'Une nouvelle mission vous a été automatiquement assignée. Confirmez votre disponibilité.',
        'mission_assigned'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

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
AS $$
DECLARE
  booking_record RECORD;
  client_user_id UUID;
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
      'Recherche d\'un nouveau prestataire',
      'Nous recherchons un autre prestataire disponible pour votre demande.',
      'provider_changed'
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Fonction pour check-in/check-out des missions
CREATE OR REPLACE FUNCTION public.mission_checkin(
  booking_id UUID,
  location_info TEXT DEFAULT NULL,
  photos TEXT[] DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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