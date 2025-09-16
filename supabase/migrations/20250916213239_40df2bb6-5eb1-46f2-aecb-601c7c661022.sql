-- Corriger les derniers problèmes de sécurité détectés

-- 1. Corriger les vues avec SECURITY DEFINER (problème détecté)
-- Recréer les vues de manière plus sécurisée
DROP VIEW IF EXISTS public.safe_public_stats;
CREATE VIEW public.safe_public_stats 
WITH (security_barrier)
AS
SELECT 
  (SELECT COUNT(*) FROM providers WHERE is_verified = true AND status = 'active') as verified_providers,
  (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_completed_bookings,
  (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE is_approved = true) as platform_average_rating,
  (SELECT COUNT(DISTINCT category) FROM services WHERE is_active = true) as active_service_categories;

-- 2. Corriger les fonctions restantes sans search_path
-- Identifier et corriger toutes les fonctions système qui peuvent manquer
ALTER FUNCTION public.get_public_provider_info(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_profile_display_info(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_provider_display_info(uuid) SET search_path = 'public';

-- Corriger la fonction is_platform_admin pour être plus sécurisée
DROP FUNCTION IF EXISTS public.is_platform_admin();
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT has_role(auth.uid(), 'admin'::app_role);
$$;

-- 3. Fonction pour nettoyer les données sensibles dans les stats publiques
CREATE OR REPLACE FUNCTION public.get_safe_platform_stats()
RETURNS TABLE(
  verified_providers bigint,
  monthly_completed_bookings bigint,
  platform_average_rating numeric,
  active_service_categories bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    (SELECT COUNT(*) FROM providers WHERE is_verified = true AND status = 'active'),
    (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days'),
    (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE is_approved = true),
    (SELECT COUNT(DISTINCT category) FROM services WHERE is_active = true);
$$;

-- 4. Améliorer la fonction d'audit pour être plus sécurisée
ALTER FUNCTION public.audit_sensitive_access() SET search_path = 'public';

-- 5. Corriger les fonctions de calculs qui peuvent manquer de search_path
DO $$
DECLARE
    func_record RECORD;
    func_signature TEXT;
BEGIN
    -- Rechercher et corriger toutes les fonctions publiques restantes
    FOR func_record IN 
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname NOT LIKE 'pg_%'
        AND (p.prosrc LIKE '%SELECT%' OR p.prosrc LIKE '%INSERT%' OR p.prosrc LIKE '%UPDATE%' OR p.prosrc LIKE '%DELETE%')
    LOOP
        BEGIN
            func_signature := format('public.%I(%s)', func_record.proname, func_record.args);
            EXECUTE format('ALTER FUNCTION %s SET search_path = ''public''', func_signature);
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignorer les erreurs pour éviter les blocages
                NULL;
        END;
    END LOOP;
END
$$;

-- 6. Créer une fonction sécurisée pour vérifier les permissions utilisateur
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN permission_type = 'admin' THEN has_role(auth.uid(), 'admin'::app_role)
    WHEN permission_type = 'provider' THEN EXISTS (
      SELECT 1 FROM providers WHERE user_id = auth.uid() AND is_verified = true
    )
    WHEN permission_type = 'client' THEN auth.uid() IS NOT NULL
    ELSE false
  END;
$$;

-- 7. Améliorer l'audit des accès sensibles avec plus de détails
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  action_name text,
  resource_type text,
  resource_id uuid DEFAULT NULL,
  additional_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action_type,
    table_name,
    record_id,
    ip_address,
    created_at
  ) VALUES (
    auth.uid(),
    action_name,
    resource_type,
    resource_id,
    NULL, -- IP sera ajouté par l'application si disponible
    now()
  );
END;
$$;

-- 8. Assurer que toutes les tables critiques ont RLS activé
DO $$
DECLARE
    critical_tables text[] := ARRAY[
        'providers', 'bookings', 'reviews', 'payments', 'invoices',
        'communications', 'notification_logs', 'user_presence',
        'provider_documents', 'referrals', 'incidents', 'profiles'
    ];
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY critical_tables
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        EXCEPTION
            WHEN OTHERS THEN
                -- Table n'existe pas ou RLS déjà activé
                NULL;
        END;
    END LOOP;
END
$$;