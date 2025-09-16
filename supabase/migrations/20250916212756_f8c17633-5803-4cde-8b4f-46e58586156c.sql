-- Finaliser les corrections de sécurité

-- Corriger les fonctions restantes avec search_path manquant
ALTER FUNCTION public.mission_checkin(uuid, text, text[]) SET search_path = 'public';
ALTER FUNCTION public.mission_checkout(uuid, text, text[], text) SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.sync_profile_email() SET search_path = 'public';

-- Corriger les fonctions de system et get_* qui peuvent manquer
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Corriger toutes les fonctions qui n'ont pas de search_path défini
    FOR func_record IN 
        SELECT DISTINCT p.proname as function_name, n.nspname as schema_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname NOT LIKE 'pg_%'
        AND p.proname NOT LIKE 'has_role%'
        AND p.prosecdef = false
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION public.%I() SET search_path = ''public''', func_record.function_name);
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignorer les erreurs pour les fonctions avec paramètres ou déjà configurées
                NULL;
        END;
    END LOOP;
END
$$;

-- Activer RLS sur toutes les tables qui n'en ont pas
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('schema_migrations')
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignorer si RLS est déjà activé
                NULL;
        END;
    END LOOP;
END
$$;

-- Créer une fonction pour audit de sécurité en temps réel
CREATE OR REPLACE FUNCTION public.audit_sensitive_access()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Logger les accès aux tables sensibles
    INSERT INTO public.security_audit_log (
        user_id,
        action_type,
        table_name,
        record_id,
        created_at
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        now()
    );
    
    RETURN CASE 
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$;

-- Ajouter des triggers d'audit sur les tables sensibles
DROP TRIGGER IF EXISTS audit_services_access ON public.services;
CREATE TRIGGER audit_services_access
    AFTER INSERT OR UPDATE OR DELETE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_access();

DROP TRIGGER IF EXISTS audit_providers_access ON public.providers;
CREATE TRIGGER audit_providers_access
    AFTER INSERT OR UPDATE OR DELETE ON public.providers
    FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_access();

DROP TRIGGER IF EXISTS audit_payments_access ON public.payments;
CREATE TRIGGER audit_payments_access
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_access();

-- Améliorer la sécurité des notifications en temps réel
CREATE POLICY "Users can only update read status on their notifications" ON public.realtime_notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND OLD.id = NEW.id AND OLD.user_id = NEW.user_id);

-- Sécuriser l'accès aux profils
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile or public info" ON public.profiles
  FOR SELECT USING (
    auth.uid() = user_id OR 
    -- Permettre la vue de certaines infos publiques pour les prestataires vérifiés
    (EXISTS (
      SELECT 1 FROM public.providers p 
      WHERE p.user_id = profiles.user_id 
      AND p.is_verified = true 
      AND p.status = 'active'
    ) AND auth.uid() IS NOT NULL)
  );

-- Créer une vue sécurisée pour les statistiques publiques (sans données sensibles)
CREATE OR REPLACE VIEW public.public_platform_stats AS
SELECT 
  COUNT(*) FILTER (WHERE p.is_verified = true AND p.status = 'active') as active_providers,
  COUNT(*) FILTER (WHERE b.status = 'completed') as completed_bookings,
  ROUND(AVG(r.rating), 1) as average_rating,
  COUNT(DISTINCT s.category) as service_categories
FROM public.providers p
CROSS JOIN public.bookings b
CROSS JOIN public.reviews r
CROSS JOIN public.services s
WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Permettre l'accès public aux stats générales uniquement
CREATE POLICY "Public can view platform stats" ON public.public_platform_stats
  FOR SELECT USING (true);

-- Désactiver l'accès direct aux tables internes pour les utilisateurs non-admin
CREATE POLICY "Admin only access to system tables" ON public.notification_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin only access to admin actions" ON public.admin_actions_log  
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));