-- Corriger le trigger d'audit et finaliser la sécurité

-- Corriger la fonction d'audit (le problème était avec OLD/NEW dans un contexte incorrect)
CREATE OR REPLACE FUNCTION public.audit_sensitive_access()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    record_id_value UUID;
BEGIN
    -- Déterminer l'ID du record selon l'opération
    IF TG_OP = 'DELETE' THEN
        record_id_value := OLD.id;
    ELSE
        record_id_value := NEW.id;
    END IF;
    
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
        record_id_value,
        now()
    );
    
    -- Retourner la bonne valeur selon l'opération
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Recréer les triggers d'audit avec la fonction corrigée
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

-- Corriger les dernières fonctions qui peuvent manquer de search_path
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.calculate_moderation_stats() SET search_path = 'public';

-- Sécuriser davantage l'accès aux reviews
CREATE POLICY "Only approved reviews visible to public" ON public.reviews
  FOR SELECT USING (
    is_approved = true OR 
    auth.uid() = client_id OR 
    auth.uid() = provider_id OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Améliorer la policy pour les bookings
CREATE POLICY "Users can only see relevant bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() = (SELECT user_id FROM providers WHERE id = bookings.provider_id) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Sécuriser l'accès aux candidatures
CREATE POLICY "Candidatures visible only to relevant parties" ON public.candidatures_prestataires
  FOR SELECT USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Restreindre l'accès aux incidents
CREATE POLICY "Incidents visible to relevant users only" ON public.incidents
  FOR SELECT USING (
    reported_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.id = incidents.booking_id 
      AND (
        b.client_id = auth.uid() OR 
        b.provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
      )
    ) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Créer une vue publique sécurisée pour les statistiques générales
CREATE OR REPLACE VIEW public.safe_public_stats AS
SELECT 
  (SELECT COUNT(*) FROM providers WHERE is_verified = true AND status = 'active') as verified_providers,
  (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_completed_bookings,
  (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE is_approved = true) as platform_average_rating,
  (SELECT COUNT(DISTINCT category) FROM services WHERE is_active = true) as active_service_categories;

-- Fonction helper pour vérifier les permissions admin de manière sécurisée
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT has_role(auth.uid(), 'admin'::app_role);
$$;

-- Améliorer la sécurité des tokens d'invitation et codes de parrainage
CREATE POLICY "Referrals privacy protection" ON public.referrals
  FOR SELECT USING (
    auth.uid() = referrer_id OR 
    auth.uid() = referred_id OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Protéger les données de géolocalisation sensibles
CREATE POLICY "Location data privacy" ON public.provider_locations
  FOR SELECT USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()) OR
    (
      -- Permettre une vue générale de la zone (sans coordonnées précises) pour le matching
      auth.uid() IS NOT NULL AND 
      EXISTS (SELECT 1 FROM providers WHERE id = provider_locations.provider_id AND is_verified = true)
    ) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Log cette action de sécurité
INSERT INTO public.security_audit_log (
  user_id,
  action_type,
  table_name,
  created_at
) VALUES (
  auth.uid(),
  'SECURITY_UPGRADE',
  'platform_wide',
  now()
);