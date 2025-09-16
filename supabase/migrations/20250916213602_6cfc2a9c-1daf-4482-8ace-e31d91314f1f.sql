-- Correction finale simple pour éliminer le dernier problème de sécurité

-- Supprimer toutes les vues qui pourraient poser problème
DROP VIEW IF EXISTS public.safe_public_stats CASCADE;
DROP VIEW IF EXISTS public.public_platform_stats CASCADE;

-- Créer une fonction publique simple pour les statistiques sans vues problématiques
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'verified_providers', (SELECT COUNT(*) FROM providers WHERE is_verified = true AND status = 'active'),
    'monthly_bookings', (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days'),
    'platform_rating', (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE is_approved = true),
    'service_categories', (SELECT COUNT(DISTINCT category) FROM services WHERE is_active = true)
  );
$$;

-- Validation rapide : vérifier qu'il n'y a plus de vues SECURITY DEFINER
SELECT COUNT(*) as remaining_views FROM pg_views WHERE schemaname = 'public';