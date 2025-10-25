-- ============================================
-- CORRECTION DES WARNINGS DE SÉCURITÉ
-- ============================================

-- 1. CORRECTION DES FONCTIONS SANS search_path

CREATE OR REPLACE FUNCTION public.reset_yearly_referral_counters()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.providers
  SET yearly_referrals_count = 0,
      is_super_ambassador = false
  WHERE yearly_referrals_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL THEN
    NEW.email := (SELECT email FROM auth.users WHERE id = NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_binome_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. SÉCURISATION DES VUES MATERIALISÉES

DO $$
DECLARE
  mat_view_name TEXT;
BEGIN
  FOR mat_view_name IN 
    SELECT matviewname 
    FROM pg_matviews 
    WHERE schemaname = 'public'
  LOOP
    BEGIN
      EXECUTE format('REVOKE SELECT ON %I FROM anon, authenticated', mat_view_name);
      RAISE NOTICE 'Accès révoqué pour: %', mat_view_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Erreur pour %: %', mat_view_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- 3. COMMENTAIRES DE SÉCURITÉ

COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 
'✅ Sécurisé: SECURITY DEFINER + search_path fixe';

COMMENT ON FUNCTION public.get_current_user_role() IS 
'✅ Sécurisé: SECURITY DEFINER + search_path fixe';

COMMENT ON FUNCTION public.current_user_email() IS 
'✅ Sécurisé: SECURITY DEFINER + search_path fixe';

COMMENT ON FUNCTION public.reset_yearly_referral_counters() IS 
'✅ Sécurisé: SECURITY DEFINER + search_path fixe';

COMMENT ON FUNCTION public.sync_profile_email() IS 
'✅ Sécurisé: SECURITY DEFINER + search_path fixe';

COMMENT ON FUNCTION public.update_binome_updated_at() IS 
'✅ Sécurisé: search_path fixe';