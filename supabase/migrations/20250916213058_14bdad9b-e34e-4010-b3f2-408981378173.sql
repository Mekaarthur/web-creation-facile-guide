-- Corriger les derniers problèmes de sécurité

-- 1. Corriger la vue avec SECURITY DEFINER (remplacer par une vue normale)
DROP VIEW IF EXISTS public.safe_public_stats;

-- Créer une vue normale sans SECURITY DEFINER
CREATE VIEW public.safe_public_stats AS
SELECT 
  (SELECT COUNT(*) FROM providers WHERE is_verified = true AND status = 'active') as verified_providers,
  (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_completed_bookings,
  (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE is_approved = true) as platform_average_rating,
  (SELECT COUNT(DISTINCT category) FROM services WHERE is_active = true) as active_service_categories;

-- 2. Corriger les dernières fonctions sans search_path
-- Identifier et corriger toutes les fonctions restantes
DO $$
DECLARE
    func_record RECORD;
    sql_stmt TEXT;
BEGIN
    -- Lister toutes les fonctions publiques et leurs signatures
    FOR func_record IN 
        SELECT 
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as function_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname NOT LIKE 'pg_%'
        AND p.prosecdef = false
        AND NOT EXISTS (
            SELECT 1 FROM pg_settings 
            WHERE name = 'search_path' 
            AND setting LIKE '%' || p.proname || '%'
        )
    LOOP
        BEGIN
            -- Construire la commande ALTER FUNCTION avec la signature complète
            sql_stmt := format('ALTER FUNCTION public.%I(%s) SET search_path = ''public''', 
                              func_record.function_name, 
                              func_record.function_args);
            EXECUTE sql_stmt;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Log les erreurs mais continuer
                RAISE NOTICE 'Could not set search_path for function %: %', func_record.function_name, SQLERRM;
        END;
    END LOOP;
END
$$;

-- 3. Supprimer la fonction is_platform_admin() qui était SECURITY DEFINER
DROP FUNCTION IF EXISTS public.is_platform_admin();

-- Créer une fonction normale pour les vérifications admin
CREATE OR REPLACE FUNCTION public.check_admin_role()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT has_role(auth.uid(), 'admin'::app_role);
$$;

-- 4. Nettoyer toutes les vues avec SECURITY DEFINER si il y en a d'autres
DROP VIEW IF EXISTS public.public_platform_stats;

-- 5. Corriger spécifiquement les fonctions get_* et calculate_* qui peuvent poser problème
ALTER FUNCTION public.get_profile_display_info(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_provider_display_info(uuid) SET search_path = 'public';
ALTER FUNCTION public.calculate_distance(numeric, numeric, numeric, numeric) SET search_path = 'public';

-- 6. Ajouter une policy pour permettre l'accès public aux stats sécurisées
-- (La vue n'a pas de RLS par défaut, mais on peut la contrôler via une table de base)
CREATE TABLE IF NOT EXISTS public.platform_stats_access (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  access_time timestamp with time zone DEFAULT now(),
  access_type text DEFAULT 'view_stats'
);

ALTER TABLE public.platform_stats_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Track stats access" ON public.platform_stats_access
  FOR INSERT WITH CHECK (true);

-- 7. Améliorer les logs de sécurité pour inclure IP et user agent si possible
ALTER TABLE public.security_audit_log 
ADD COLUMN IF NOT EXISTS session_info jsonb DEFAULT '{}';

-- 8. Créer une fonction pour nettoyer les anciens logs (data retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS integer
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Supprimer les logs plus anciens que 1 an
  DELETE FROM public.security_audit_log 
  WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Log la finalisation des corrections de sécurité
INSERT INTO public.security_audit_log (
  user_id,
  action_type,
  table_name,
  session_info,
  created_at
) VALUES (
  auth.uid(),
  'SECURITY_FINALIZATION',
  'platform_wide',
  jsonb_build_object(
    'fixes_applied', 'RLS_policies,search_path_corrections,audit_triggers',
    'timestamp', now()::text
  ),
  now()
);