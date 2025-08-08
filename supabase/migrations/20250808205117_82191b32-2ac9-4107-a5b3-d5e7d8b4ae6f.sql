-- Ajouter les critères d'évaluation détaillés à la table reviews
ALTER TABLE public.reviews 
ADD COLUMN punctuality_rating integer CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
ADD COLUMN quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5);

-- Mettre à jour les avis existants avec les nouvelles colonnes (optionnel)
UPDATE public.reviews 
SET punctuality_rating = rating, quality_rating = rating 
WHERE punctuality_rating IS NULL OR quality_rating IS NULL;

-- Fonction pour calculer la note moyenne globale incluant les nouveaux critères
CREATE OR REPLACE FUNCTION public.calculate_detailed_rating(
  general_rating integer,
  punctuality_rating integer,
  quality_rating integer
) RETURNS numeric AS $$
BEGIN
  RETURN ROUND((general_rating + punctuality_rating + quality_rating) / 3.0, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Mettre à jour la fonction de mise à jour du rating des prestataires
CREATE OR REPLACE FUNCTION public.update_provider_detailed_rating()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.providers 
  SET rating = (
    SELECT COALESCE(AVG(
      CASE 
        WHEN punctuality_rating IS NOT NULL AND quality_rating IS NOT NULL 
        THEN calculate_detailed_rating(rating, punctuality_rating, quality_rating)
        ELSE rating
      END
    ), 0) 
    FROM public.reviews 
    WHERE provider_id = COALESCE(NEW.provider_id, OLD.provider_id) 
    AND is_approved = true
  )
  WHERE id = COALESCE(NEW.provider_id, OLD.provider_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Remplacer le trigger existant
DROP TRIGGER IF EXISTS update_provider_rating_trigger ON public.reviews;
CREATE TRIGGER update_provider_detailed_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_provider_detailed_rating();