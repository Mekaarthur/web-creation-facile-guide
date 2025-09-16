-- Corriger le dernier problème de vue SECURITY DEFINER

-- Supprimer la vue problématique et la remplacer par une approche plus sécurisée
DROP VIEW IF EXISTS public.safe_public_stats;

-- Créer une fonction simple au lieu d'une vue pour éviter les problèmes SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_platform_public_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'verified_providers', (SELECT COUNT(*) FROM providers WHERE is_verified = true AND status = 'active'),
    'monthly_completed_bookings', (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days'),
    'platform_average_rating', (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE is_approved = true),
    'active_service_categories', (SELECT COUNT(DISTINCT category) FROM services WHERE is_active = true)
  );
$$;

-- Créer une policy pour permettre l'accès public aux stats via cette fonction
-- Pas besoin de table ou vue, juste une fonction publique accessible

-- Nettoyer les vues et fonctions qui pourraient poser problème
DROP VIEW IF EXISTS public.public_platform_stats;

-- Vérifier que nous n'avons plus de vues SECURITY DEFINER problématiques
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Lister toutes les vues qui pourraient avoir des problèmes
    FOR view_record IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
        AND viewname LIKE '%stats%'
    LOOP
        -- Log pour debug
        RAISE NOTICE 'Vue trouvée: %', view_record.viewname;
    END LOOP;
END
$$;

-- Validation finale : s'assurer que toutes nos fonctions ont le bon search_path
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname NOT LIKE 'pg_%'
    AND p.prosrc IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM pg_proc_config(p.oid) 
        WHERE configuration[1] = 'search_path'
    );
    
    -- Log le résultat
    IF func_count > 0 THEN
        RAISE NOTICE 'Il reste % fonctions sans search_path configuré', func_count;
    ELSE
        RAISE NOTICE 'Toutes les fonctions ont un search_path configuré';
    END IF;
END
$$;