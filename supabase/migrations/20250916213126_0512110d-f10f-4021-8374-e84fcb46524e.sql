-- Finaliser la sécurisation sans recréer les policies existantes

-- 1. Seulement corriger les fonctions restantes (éviter les duplicatas)
ALTER FUNCTION public.get_profile_display_info(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_provider_display_info(uuid) SET search_path = 'public';
ALTER FUNCTION public.calculate_distance(numeric, numeric, numeric, numeric) SET search_path = 'public';

-- 2. Créer une vue simple pour les stats publiques (sans SECURITY DEFINER)
CREATE OR REPLACE VIEW public.safe_public_stats AS
SELECT 
  (SELECT COUNT(*) FROM providers WHERE is_verified = true AND status = 'active') as verified_providers,
  (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_completed_bookings,
  (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE is_approved = true) as platform_average_rating,
  (SELECT COUNT(DISTINCT category) FROM services WHERE is_active = true) as active_service_categories;

-- 3. Ajouter la colonne session_info si elle n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'security_audit_log' 
        AND column_name = 'session_info'
    ) THEN
        ALTER TABLE public.security_audit_log 
        ADD COLUMN session_info jsonb DEFAULT '{}';
    END IF;
END $$;

-- 4. S'assurer que la table platform_stats_access existe
CREATE TABLE IF NOT EXISTS public.platform_stats_access (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  access_time timestamp with time zone DEFAULT now(),
  access_type text DEFAULT 'view_stats'
);

-- Activer RLS seulement si pas déjà fait
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND c.relname = 'platform_stats_access'
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.platform_stats_access ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 5. Créer la policy seulement si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'platform_stats_access' 
        AND policyname = 'Track stats access'
    ) THEN
        EXECUTE 'CREATE POLICY "Track stats access" ON public.platform_stats_access FOR INSERT WITH CHECK (true)';
    END IF;
END $$;

-- 6. Log final de sécurité
INSERT INTO public.security_audit_log (
  user_id,
  action_type,
  table_name,
  session_info,
  created_at
) VALUES (
  auth.uid(),
  'SECURITY_AUDIT_COMPLETE',
  'platform_wide',
  jsonb_build_object(
    'tables_secured', ARRAY['services', 'providers', 'user_presence', 'payments', 'reviews'],
    'functions_corrected', 'search_path_set_for_all',
    'rls_policies_added', 'comprehensive_access_control',
    'audit_logging', 'enabled_on_sensitive_tables',
    'completion_time', now()::text
  ),
  now()
);