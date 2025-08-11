-- Fonction pour distribuer automatiquement les tâches aux prestataires
CREATE OR REPLACE FUNCTION public.auto_assign_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  best_provider_id UUID;
  provider_user_id UUID;
BEGIN
  -- Ne traiter que les nouvelles réservations
  IF NEW.status = 'pending' AND (OLD.provider_id IS NULL OR OLD IS NULL) AND NEW.provider_id IS NULL THEN
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