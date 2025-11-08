-- Ajouter la colonne status pour remplacer is_approved
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Migrer les données existantes
UPDATE public.reviews 
SET status = CASE 
  WHEN is_approved = true THEN 'published'
  ELSE 'pending'
END
WHERE status IS NULL OR status = 'pending';

-- Ajouter colonnes pour la modération
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderated_by UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS service_id UUID;

-- Ajouter la contrainte sur status
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS check_review_status;
ALTER TABLE public.reviews ADD CONSTRAINT check_review_status 
  CHECK (status IN ('pending', 'published', 'rejected', 'deleted'));

-- Créer une vue pour les statistiques
CREATE OR REPLACE VIEW review_statistics AS
SELECT
  COUNT(*) AS total_reviews,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_reviews,
  COUNT(*) FILTER (WHERE status = 'published') AS published_reviews,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_reviews,
  COUNT(*) FILTER (WHERE rating <= 2) AS negative_reviews,
  COUNT(*) FILTER (WHERE rating >= 4) AS positive_reviews,
  ROUND(AVG(rating)::NUMERIC, 1) AS average_rating,
  COUNT(*) FILTER (WHERE created_at >= (now() - INTERVAL '7 days')) AS reviews_last_7_days,
  COUNT(*) FILTER (WHERE created_at >= (now() - INTERVAL '30 days')) AS reviews_last_30_days
FROM public.reviews
WHERE status != 'deleted';

GRANT SELECT ON review_statistics TO authenticated;
